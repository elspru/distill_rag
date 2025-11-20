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

## 🧠 **What Is This? (Plain-Language Overview)**

**distill_rag** is a small but powerful toolkit that helps you transform messy text sources (HTML pages, transcripts, articles, archives) into **clean, structured data** that AI models can learn from.

It’s designed for people who want to build:

* **domain-specific AI assistants**,
* **high-quality expert models**, or
* **distillation pipelines** where a stronger model teaches a smaller one.

If you’ve ever tried to fine-tune a model and realized the hardest part is actually preparing the dataset — this toolkit solves that problem.

---

## 🌍 **Why This Exists**

Training or distilling a specialised AI model requires **clean, coherent, well-structured data**.
But most text you find online is:

* full of ads, scripts, headers
* chopped into small fragments
* badly formatted
* missing metadata
* hard to retrieve or chunk meaningfully

Before you can train a model, you need a **pipeline that turns raw text into polished training-ready data**.

distill_rag gives you that pipeline.

It helps you:

1. pull content from raw HTML
2. clean and structure it
3. break it into long coherent chunks
4. embed it locally
5. index it with Elasticsearch
6. perform high-quality semantic search

This structure mirrors the exact data format most distillation workflows expect.

The goal is simple:
**Make it much easier for researchers and builders to create high-quality domain-specific AI models.**

---

## 🔧 **How It Works (At a Glance)**

Here’s the full process in three steps:

### **1. Extract & Clean**

Feed it any folder of HTML (scraped, archived, downloaded).
It removes noise, extracts meaningful text, and turns it into structured JSON.

### **2. Chunk & Embed**

The text is broken into long, context-rich chunks (ideal for distillation).
Each chunk is embedded using a local model like `mxbai-embed-large`.

### **3. Index & Search**

Chunks are stored in Elasticsearch with vectors, metadata, and text.
You can then run semantic search to retrieve the most relevant material — exactly how modern RAG and distillation pipelines work.

---

## 🚀 **Who Should Use This?**

* AI researchers building **aligned distilled models**
* Developers training **expert assistants**
* Archivists working with large collections of text
* Anyone building **custom RAG systems**
* Or anyone who wants a clean, open, hackable indexing pipeline

This project is intentionally simple, transparent, and designed to be extended.


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
