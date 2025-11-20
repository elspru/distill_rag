---
title: "distill-rag"
emoji: "🧰"
colorFrom: "indigo"
colorTo: "blue"
sdk: "static"
pinned: false
tags:
  - tool
  - rag
  - dataset
  - nlp
  - text-processing
  - search
  - embeddings
---


# Distill RAG

A lightweight pipeline for extraction, chunking, embeddings, and search.

---

## 🧠 What Is This? (Plain-Language Overview)

**distill_rag** is a small but powerful toolkit that helps you transform messy text sources (HTML pages, transcripts, articles, archives) into **clean, structured data** that AI models can learn from.

It’s designed for people who want to build:

* **domain-specific AI assistants**
* **high-quality expert models**
* **distillation pipelines** where a stronger model teaches a smaller one

If you’ve ever tried to fine-tune a model and realised the hardest part is actually preparing the dataset — this toolkit is for that problem.

---

## 🌍 Why This Exists

Training or distilling a specialised AI model requires **clean, coherent, well-structured data**.
But most text online is:

* full of ads, scripts, headers
* chopped into small fragments
* badly formatted
* missing metadata
* hard to chunk in meaningful ways

Before you can train a model, you need a **pipeline that turns raw text into polished, training-ready data**.

`distill_rag` gives you that pipeline. It helps you:

1. pull content from raw HTML
2. clean and structure it
3. break it into long coherent chunks
4. embed it locally
5. index it with Elasticsearch
6. perform high-quality semantic search

This structure mirrors the data format most distillation workflows expect.

**Goal:**
Make it easy for researchers and builders to create **high-quality domain-specific AI models**.

---

## 🔧 How It Works (At a Glance)

### 1. Extract & Clean

Feed it a folder of HTML (scraped, archived, downloaded).
It removes noise and produces structured JSON sessions.

### 2. Chunk & Embed

Text is broken into long, context-rich chunks (ideal for distillation).
Each chunk is embedded using a local model like `mxbai-embed-large`.

### 3. Index & Search

Chunks are stored in Elasticsearch as vectors + metadata.
You can then run semantic search to retrieve relevant material.

---

## 🚀 Who Should Use This?

* AI researchers building **aligned distilled models**
* Developers training **expert assistants**
* Archivists handling large text collections
* Anyone building **custom RAG systems**
* Anyone who wants a clean, open, hackable indexing pipeline

---

## 🚀 Features

* ✔ HTML extraction using Cheerio
* ✔ Robust cleaning (scripts, ads, headers removed)
* ✔ Long-chunker tuned for distillation
* ✔ Async embedding + indexing
* ✔ Elasticsearch v8 dense vector support
* ✔ Ollama embedding API support
* ✔ CLI tools for extraction, indexing, search
* ✔ Test suite included
* ✔ Apache 2.0 licensed

---

## 🧱 Project Structure

```text
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
│   ├── search_distill_chunks.js   # BM25 / vector / hybrid search
│   └── search_cli.js              # CLI search tool
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

Requirements:

* Node **18+**
* Elasticsearch **8.x**
* Embedding API (e.g., **Ollama** running `mxbai-embed-large`)

Install:

```bash
npm install
```

---

## 🧼 1. Extracting Data from Raw HTML

Convert a directory:

```bash
node data_extraction/walk_and_extract.js raw_html/ extracted_sessions/
```

Output example:

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

* strips scripts, ads, headers, nav bars
* extracts paragraphs and headings
* assigns roles (`user` = first block, rest `assistant`)
* normalises whitespace

---

## 🧱 2. Chunking + Indexing into Elasticsearch

Rebuild the full index:

```bash
bash rebuild_distill_index.sh
```

Manual index build:

```bash
ES_DISTILL_INDEX=quo_distill_index \
QUO_JSON_DIR=./extracted_sessions \
ELASTICSEARCH_NODE=http://localhost:9200 \
node indexing/index_distill_chunks.js
```

The indexer:

* creates long semantic chunks (5000–9000 characters)
* calls your embedding API (`/api/embeddings`)
* indexes all chunks with metadata:

  * `title`
  * `session_date`
  * `source`
  * `chunk_index`
  * `embedding` (vector)

---

## 🔎 Advanced Retrieval Modes

`distill_rag` supports **three complementary search strategies** via `search/search_distill_chunks.js`:

### 1. BM25 (Keyword Search)

Classic lexical search.
Good for names, citations, exact phrases.

```js
const { searchBM25 } = require("./search/search_distill_chunks");
const results = await searchBM25("service to others", 5);
console.log(results);
```

---

### 2. Vector Search (Dense Embeddings)

Semantic similarity using your local embedding model.

```js
const { searchVector } = require("./search/search_distill_chunks");
const results = await searchVector("how to grow spiritually", 5);
console.log(results);
```

---

### 3. Hybrid Search (RRF Fusion) — Recommended

State-of-the-art fusion of:

* BM25 lexical relevance
* Dense vector KNN

This gives robust results even on noisy or varied datasets.

```js
const { searchHybrid } = require("./search/search_distill_chunks");
const results = await searchHybrid("balance love and wisdom", 5);
console.log(results);
```

---

## 🖥 Search CLI Tool

You can run searches directly from the terminal:

```bash
node search/search_cli.js "service to others"
```

Specify mode (`bm25`, `vector`, `hybrid`) and `k`:

```bash
node search/search_cli.js "healing catalyst" hybrid 8
node search/search_cli.js "unity" bm25 5
node search/search_cli.js "wisdom" vector 10
```

This prints:

* source file
* chunk index
* score
* preview of the retrieved chunk

---

## 🧪 Tests

Run all tests:

```bash
npm test
```

Covers:

* HTML cleaning
* extractor correctness
* session conversion
* chunker behaviour
* embedding API live test
* Elasticsearch index live test
* hybrid retrieval
* end-to-end smoke test

---

## 🧽 Cleanup

```bash
npm run clean
```

or:

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
| `CHUNK_MIN`          | `5000`                                  | Minimum chunk size (characters) |
| `CHUNK_MAX`          | `9000`                                  | Maximum chunk size (characters) |
| `QUO_JSON_DIR`       | *(required)*                            | Directory of session JSON       |

---

## 📄 License

Apache 2.0 (see `LICENSE`).

---

## 🤗 Contributing

Contributions are welcome — bug fixes, new extractors, support for other embedding backends, indexing strategies, documentation.

---

## ☀️ Final Thoughts

This project is meant to empower people building truth-aligned, service-oriented models.
If it helps someone create a clearer dataset or a kinder AI, it’s doing its job.

---
