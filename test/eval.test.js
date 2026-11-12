const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  loadTestSet,
  rankOf,
  reciprocalRank,
  evaluate,
  formatReport,
} = require('../eval');

test('rankOf returns the first relevant result using 1-based ranking', () => {
  assert.equal(rankOf([10, 20, 30], [30, 20]), 2);
});

test('rankOf returns null when no relevant result is present', () => {
  assert.equal(rankOf([10, 20, 30], [40]), null);
});

test('reciprocalRank returns the reciprocal of the first relevant rank', () => {
  assert.equal(reciprocalRank([10, 20, 30], [30, 20]), 0.5);
});

test('reciprocalRank returns zero for a miss', () => {
  assert.equal(reciprocalRank([10, 20], [30]), 0);
});

test('the supplied dataset produces the expected MRR and Recall@10', () => {
  const testSet = loadTestSet(path.join(__dirname, '..', 'test-set.csv'));
  const results = require('../search-results.json');
  const metrics = evaluate(testSet, results);

  assert.equal(metrics.keyword.mrr.toFixed(2), '0.30');
  assert.equal(metrics.keyword.recallAt10.toFixed(2), '0.60');
  assert.equal(metrics.semantic.mrr.toFixed(2), '0.67');
  assert.equal(metrics.semantic.recallAt10.toFixed(2), '1.00');
});

test('report includes a summary row with the calculated metrics', () => {
  const testSet = loadTestSet(path.join(__dirname, '..', 'test-set.csv'));
  const results = require('../search-results.json');
  const report = formatReport(testSet, evaluate(testSet, results));

  assert.match(report, /\| \*\*Summary\*\* \|/);
  assert.match(report, /\*\*MRR 0\.67 · Recall@10 1\.00\*\*/);
});
