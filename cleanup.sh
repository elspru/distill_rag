#!/usr/bin/env bash
set -e

echo "[cleanup] Starting distill_rag cleanup…"

# Remove backup files
echo "[cleanup] Removing *.bak files…"
find . -type f -name "*.bak" -print -delete

# Remove Node leftover logs
echo "[cleanup] Removing npm debug logs…"
find . -type f -name "npm-debug.log*" -print -delete

# Clean old Elasticsearch index (if running)
if [ -n "${ES_DISTILL_INDEX}" ]; then
  echo "[cleanup] Deleting Elasticsearch index: ${ES_DISTILL_INDEX}"
  curl -X DELETE "${ELASTICSEARCH_NODE:-http://localhost:9200}/${ES_DISTILL_INDEX}" || true
else
  echo "[cleanup] Skip index delete: ES_DISTILL_INDEX not set"
fi

# Remove build cache
echo "[cleanup] Removing Jest cache…"
rm -rf ./node_modules/.cache || true

# Optional: remove node_modules entirely
if [[ "$1" == "--deep" ]]; then
  echo "[cleanup] Deep mode: removing node_modules…"
  rm -rf node_modules
fi

echo "[cleanup] Done!"
