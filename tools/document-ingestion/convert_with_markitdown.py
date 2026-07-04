#!/usr/bin/env python3
"""Convert a local document to Markdown with MarkItDown and write source metadata."""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a local file to Markdown with MarkItDown.")
    parser.add_argument("source", help="Path to the source file")
    parser.add_argument("--out-dir", default="artifacts/document-ingestion", help="Output directory")
    parser.add_argument("--copyright", default="unknown", help="Permission/copyright status")
    parser.add_argument("--confidence", default="medium", choices=["high", "medium", "low"])
    args = parser.parse_args()

    source = pathlib.Path(args.source).resolve()
    if not source.exists() or not source.is_file():
        raise SystemExit(f"Source file not found: {source}")

    out_dir = pathlib.Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    tool = "markitdown"
    try:
        from markitdown import MarkItDown  # type: ignore

        result_text = MarkItDown().convert(str(source)).text_content
    except Exception:
        if source.suffix.lower() not in {".txt", ".md", ".csv"}:
            raise SystemExit(
                "markitdown conversion API is unavailable in this environment; "
                "fallback conversion only supports .txt, .md, and .csv."
            )
        tool = "markitdown-unavailable-fallback-text"
        result_text = source.read_text(encoding="utf-8")
    converted_at = dt.datetime.now(dt.timezone.utc).isoformat()
    metadata = [
        "---",
        f"source_file: {source.name}",
        f"source_path: {source}",
        f"converted_at: {converted_at}",
        f"copyright_status: {args.copyright}",
        f"confidence: {args.confidence}",
        f"tool: {tool}",
        "---",
        "",
    ]
    output_path = out_dir / f"{source.stem}.md"
    output_path.write_text("\n".join(metadata) + result_text, encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
