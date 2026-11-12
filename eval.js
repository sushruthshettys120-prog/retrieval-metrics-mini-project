// Evaluate keyword and semantic search using MRR and Recall@10.
// Run with: node eval.js
// No third-party packages are required.

const fs = require('node:fs');
const path = require('node:path');

/** Parse one CSV row, including quoted fields containing commas. */
function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error(`Invalid CSV row: unmatched quote in ${line}`);
  }

  fields.push(field);
  return fields;
}

/** Load query/relevant-ID pairs from test-set.csv. */
function loadTestSet(filePath = path.join(__dirname, 'test-set.csv')) {
  const contents = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('test-set.csv must contain a header and at least one query.');
  }

  return lines.slice(1).map((line, index) => {
    const [query = '', ids = ''] = parseCsvLine(line);
    const correctIds = ids
      .split(';')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id));

    if (!query.trim() || correctIds.length === 0) {
      throw new Error(`Invalid test-set.csv row ${index + 2}: ${line}`);
    }

    return { query: query.trim(), correctIds };
  });
}

/** Return the 1-based rank of the first relevant result, or null on a miss. */
function rankOf(rankedIds, correctIds) {
  if (!Array.isArray(rankedIds) || !Array.isArray(correctIds)) {
    throw new TypeError('rankedIds and correctIds must both be arrays.');
  }

  const relevantIds = new Set(correctIds);
  const index = rankedIds.findIndex((id) => relevantIds.has(Number(id)));
  return index === -1 ? null : index + 1;
}

/** Return reciprocal rank for one query; a miss has reciprocal rank 0. */
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);
  return rank === null ? 0 : 1 / rank;
}

/** Calculate per-query ranks and aggregate metrics for one search system. */
function evaluateSystem(testSet, results, systemName) {
  if (!Array.isArray(testSet) || testSet.length === 0) {
    throw new Error('The test set must contain at least one query.');
  }

  let reciprocalRankTotal = 0;
  let hits = 0;
  const ranks = [];

  for (const testCase of testSet) {
    const queryResults = results[testCase.query];
    if (!queryResults || !Array.isArray(queryResults[systemName])) {
      throw new Error(`Missing ${systemName} results for query: ${testCase.query}`);
    }

    const rankedIds = queryResults[systemName];
    const rank = rankOf(rankedIds, testCase.correctIds);
    ranks.push(rank);
    reciprocalRankTotal += rank === null ? 0 : 1 / rank;
    if (rank !== null) hits += 1;
  }

  return {
    ranks,
    mrr: reciprocalRankTotal / testSet.length,
    recallAt10: hits / testSet.length,
  };
}

/** Evaluate both systems against the same test queries. */
function evaluate(testSet, results) {
  return {
    keyword: evaluateSystem(testSet, results, 'keyword'),
    semantic: evaluateSystem(testSet, results, 'semantic'),
  };
}

/** Format the required Markdown comparison table. */
function formatReport(testSet, metrics) {
  const lines = [
    '| Query | Keyword rank | Semantic rank |',
    '|---|---|---|',
  ];

  testSet.forEach((testCase, index) => {
    const keywordRank = metrics.keyword.ranks[index] ?? 'miss';
    const semanticRank = metrics.semantic.ranks[index] ?? 'miss';
    lines.push(`| ${testCase.query} | ${keywordRank} | ${semanticRank} |`);
  });

  lines.push(
    `| **Summary** | **MRR ${metrics.keyword.mrr.toFixed(2)} · Recall@10 ${metrics.keyword.recallAt10.toFixed(2)}** | **MRR ${metrics.semantic.mrr.toFixed(2)} · Recall@10 ${metrics.semantic.recallAt10.toFixed(2)}** |`,
  );

  return lines.join('\n');
}

function main() {
  const testSet = loadTestSet();
  const resultsPath = path.join(__dirname, 'search-results.json');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const metrics = evaluate(testSet, results);
  console.log(formatReport(testSet, metrics));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Evaluation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { parseCsvLine, loadTestSet, rankOf, reciprocalRank, evaluate, formatReport };
