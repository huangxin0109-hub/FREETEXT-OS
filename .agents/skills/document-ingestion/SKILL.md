---
name: document-ingestion
description: Safely ingest and convert documents into Markdown for FREETEXT OS knowledge work. Use when handling PDF, Word, PowerPoint, Excel, CSV, images, audio, webpages, cultural/art materials, or any external source file.
---

# Document Ingestion

## Trigger

Use when importing, summarizing, converting, or structuring documents and cultural reference files.

## Do Not Trigger

Do not use for files already written as clean Markdown in the repo unless metadata/provenance is missing.

## Input

- Source file path or URL.
- Intended use.
- Copyright/permission status if known.

## Output

- Converted Markdown in `artifacts/document-ingestion/` or an explicitly requested directory.
- Source metadata.
- Confidence and missing metadata notes.

## Steps

1. Do not overwrite the original file.
2. Treat unknown files as untrusted; use local paths and minimal permissions.
3. Prefer `tools/document-ingestion/convert_with_markitdown.py` when markitdown is available.
4. Preserve source file name, path, conversion time, copyright status, and confidence.
5. Do not invent missing author, copyright, provenance, or metadata.
6. For private materials, do not upload to external services.

## Acceptance

- Markdown output exists.
- Metadata block is present.
- Conversion limitations are reported.

## Common Failures

- Replacing original documents.
- Summarizing without source metadata.
- Treating OCR or extraction errors as reliable text.

## Relationship To AGENTS.md

This skill enforces the AGENTS.md source/copyright rule and supports cultural knowledge workflows.
