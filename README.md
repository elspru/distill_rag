---
title: Distill RAG
emoji: 🧩
colorFrom: blue
colorTo: green
sdk: static
pinned: false
---

# Distill RAG
A lightweight pipeline for extraction, chunking, embeddings, and search.

# 📘 **distill_rag — Dataset Extraction + Long-Chunk Indexing + Semantic Search for Distillation RAG Pipelines**

`distill_rag` is a modular toolkit for building high-quality **RAG-assisted dataset distillation pipelines**.

It covers the entire early pipeline:

1. **Extract raw HTML** (web archives, transcripts, or scraped sources)
2. **Clean and convert** into structured {title, turns[]} JSON sessions
3. **Chunk** content into long semantic blocks
4. **Embed** using any local embedding model (Ollama-compatible)
5. **Index** into Elasticsearch with metadata
6. **Search** using dense vector similarity

All components are independent, tested, and designed for easy integration into larger distillation loops (e.g., finetuning, self-training, iterative Q&A generation).

---

## 🚀 Features

* ✔ **HTML extraction** using Cheerio
* ✔ **Robust cleaning pipeline** (scripts, ads, headers removed)
* ✔ **Paragraph-aware long-chunker** tuned for distillation workflows
* ✔ **Fully async embedding + indexing**
* ✔ **Elasticsearch v8** vector index support
* ✔ **Ollama embedding API support**
* ✔ **Test suite included** (`npm test`)
* ✔ **CLI tools** for extraction and indexing
* ✔ **Apache 2.0 licensed**

---

## 🧱 Project Structure

```
distill_rag/
├── data_extraction/
│   ├── clean_html.js              # strip noise safely
│   ├── extractor.js               # extract Q/A style turns
│   ├── convert_raw_to_sessions.js # HTML → structured JSON
│   └── walk_and_extract.js        # CLI to batch-convert directories
│
├── indexing/
│   ├── index_distill_chunks.js    # long-chunk indexer
│   └── rebuild_distill_index.sh   # wipe + rebuild helper
│
├── search/
│   └── query.js                   # semantic search helper
│
├── tests/                         # jest-based automated test suite
│
├── prompts/                       # optional prompt templates
├── shared/                        # shared utilities
├── cleanup.sh                     # remove build artefacts
├── jest.config.js
├── package.json
└── README.md
```

---

## 📦 Installation

Requires:

* Node **18+**
* Elasticsearch **8.x**
* An embedding API (e.g., **Ollama** running `mxbai-embed-large`)

Install all dependencies:

```bash
npm install
```

---

## 🧼 1. Extracting Data from Raw HTML

Convert a directory of `.html` files into structured `.json` sessions:

```bash
node data_extraction/walk_and_extract.js raw_html/ extracted_sessions/
```

Each resulting JSON file looks like:

```json
{
  "title": "example.html",
  "turns": [
    { "role": "user", "content": "Q: What is service?" },
    { "role": "assistant", "content": "Service begins with kindness." }
  ]
}
```

Behind the scenes it:

* Strips scripts, ads, headers, nav bars
* Extracts paragraphs and headings
* Assigns roles (`user` = first block, rest `assistant`)
* Normalises whitespace

---

## 🧱 2. Chunking + Indexing into Elasticsearch

Rebuild the entire index:

```bash
bash rebuild_distill_index.sh
```

Manual CLI:

```bash
ES_DISTILL_INDEX=quo_distill_index \
QUO_JSON_DIR=./extracted_sessions \
ELASTICSEARCH_NODE=http://localhost:9200 \
node indexing/index_distill_chunks.js
```

The indexer:

* Creates long semantic chunks (5000–9000 characters)
* Calls your embedding API (`/api/embeddings`)
* Indexes all chunks with metadata:

  * `title`
  * `session_date`
  * `source`
  * `chunk_index`
  * `embedding` (vector)

---

## 🔎 3. Querying the Vector Index

Basic semantic search:

```js
const results = await search("how to serve others?");
console.log(results);
```

Each hit includes:

* `content`
* `score`
* `source`
* `session_date`

---

## 🧪 Running Tests

A full automated test suite covers:

* HTML cleaning
* Extraction correctness
* Session converter
* Chunker
* Embedding API live test
* Elasticsearch index live test
* End-to-end smoke test

Run all tests:

```bash
npm test
```

---

## 🧽 Cleanup

Remove temp artefacts:

```bash
npm run clean
```

Or:

```bash
bash cleanup.sh
```

---

## 🛠 Configuration

Config is handled via environment variables:

| Variable             | Default                                 | Purpose                         |
| -------------------- | --------------------------------------- | ------------------------------- |
| `ELASTICSEARCH_NODE` | `http://localhost:9200`                 | ES cluster URL                  |
| `ES_DISTILL_INDEX`   | `quo_distill_index`                     | Target index                    |
| `EMBED_URL`          | `http://localhost:11434/api/embeddings` | Embedding API                   |
| `EMBED_MODEL`        | `mxbai-embed-large`                     | Embedding model                 |
| `CHUNK_MIN`          | `5000`                                  | Minimum chunk size              |
| `CHUNK_MAX`          | `9000`                                  | Maximum chunk size              |
| `QUO_JSON_DIR`       | *(required)*                            | Directory of session JSON files |

---

## 🌱 Why This Exists

Modern distillation pipelines need:

* Long coherent chunks
* High-quality metadata
* Clean datasets without web noise
* Reproducible extraction
* Independent modular steps
* Vector search that mirrors training structure

`distill_rag` provides a clean baseline that researchers and builders can extend harmoniously—from spiritual texts to scientific archives, from transcripts to collected Q&A.

This toolkit stays lightweight, transparent, and hackable.

---

## 📄 License

Apache 2.0 (see `LICENSE` file)

---

## 🤗 Contributing

Contributions are welcome—bug fixes, new extractors, support for other embedding backends, indexing strategies, documentation improvements.

Feel free to submit issues or PRs.

---

## ☀️ Final Thoughts

This project is meant to empower people building truth-aligned, service-oriented models.
If it helps someone create a clearer dataset or a kinder AI, it’s doing its job.
