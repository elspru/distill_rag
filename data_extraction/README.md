# Raw Data Extraction

Most users start with messy HTML/TXT/PDF dumps.

This module converts raw files → structured JSON sessions compatible with the distill_rag indexer.

## Usage

1. Put raw files into a directory, e.g.:

   raw_corpus/file1.html
   raw_corpus/file2.txt

2. Run extraction:

   node data_extraction/walk_and_extract.js raw_corpus extracted_json

3. The output will be JSON files with:

   - title
   - session_date
   - turns[]

You can now index these with:

   QUO_JSON_DIR=extracted_json node indexing/index_distill_chunks.js
