# Retrieval Metrics Mini Project

Build a tiny evaluation tool that measures how good a search system is.

In this mini project you will implement `eval.js` so it scores two search systems, keyword search and semantic search, on the same set of test queries, computes **MRR** and **Recall@10** for each, and prints a **markdown comparison table**. No database or API keys are needed: the two systems' ranked results are already captured for you as data, so you can focus on the metrics themselves.

## What is in this project

- `eval.js` : loads the inputs, calculates reciprocal ranks and aggregate metrics, and prints the Markdown comparison table.
- `test-set.csv` : 10 `(query, correct_post_ids)` pairs. A row may list more than one correct answer, semicolon-separated.
- `search-results.json` : for each query, the top-10 ranked `post_id` list each system returned.
- `posts-dataset.csv` : the 35 posts the IDs refer to.
- `test/eval.test.js` : automated tests for ranking, metrics, and report formatting.

## Metrics

- **Reciprocal Rank:** `1 / rank` of the first relevant result; `0` when no relevant result appears in the ranked list.
- **MRR:** the mean of reciprocal ranks across all test queries.
- **Recall@10 (query-level):** the fraction of test queries with at least one relevant result in the top ten.

Ranks are 1-based. When a query has multiple relevant IDs, the earliest relevant result determines its reciprocal rank and hit.

## Run

Requires Node.js; no third-party packages are needed.

```bash
node eval.js
node --test
```

## Results and interpretation

The supplied dataset gives keyword search an MRR of **0.30** and Recall@10 of **0.60**, while semantic search gets an MRR of **0.67** and Recall@10 of **1.00**. Semantic search is therefore better overall on both metrics: it finds at least one relevant result for every query and usually ranks it near the top. Keyword search wins on “redis or memcached for caching” and “sql or nosql for a new product,” where exact product and database terms make lexical matching especially effective. Semantic search wins on the natural-language troubleshooting and conceptual queries, where the user's wording expresses an intent or symptom rather than the exact title words. A team may still keep keyword search because it can retrieve exact technical terms and named technologies that semantic ranking may place lower.
