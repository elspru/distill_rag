#!/usr/bin/env bash
set -euo pipefail

# Defaults – can be overridden via env when calling the script
ES_NODE="${ELASTICSEARCH_NODE:-http://localhost:9200}"
INDEX="${ES_DISTILL_INDEX:-quo_distill_index}"
DATA_DIR="${JSON_DIR:-$HOME/liberit/hmas/data/llresearch/datasets}"

echo "[rebuild] Elasticsearch node : $ES_NODE"
echo "[rebuild] Index              : $INDEX"
echo "[rebuild] Data dir           : $DATA_DIR"
echo

# Quick sanity check
echo "[rebuild] Checking ES is up..."
curl -s "$ES_NODE" > /dev/null
echo "[rebuild] ES reachable."
echo

# Delete old index (ignore if missing)
echo "[rebuild] Deleting old index (if exists)…"
curl -s -X DELETE "$ES_NODE/$INDEX" > /dev/null || true
echo "[rebuild] Old index delete request sent."
echo

# Rebuild
echo "[rebuild] Rebuilding index from $DATA_DIR…"
ELASTICSEARCH_NODE="$ES_NODE" \
ES_DISTILL_INDEX="$INDEX" \
JSON_DIR="$DATA_DIR" \
  node indexing/index_distill_chunks.js

echo
echo "[rebuild] Done."
