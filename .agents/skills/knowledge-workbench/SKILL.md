---
name: knowledge-workbench
description: Work with Obsidian-style knowledge bases for FREETEXT OS. Use only when the repo/workspace contains `.obsidian`, `.canvas`, Obsidian Bases, or explicitly Obsidian-authored Markdown notes that need organizing into callable working material.
---

# Knowledge Workbench

## Trigger

Use when Obsidian vault files, Canvas files, Bases, or linked Markdown notes exist and the task is to organize, summarize, map, or convert them into usable project material.

## Do Not Trigger

Do not use when no Obsidian vault or Obsidian-authored note set exists. Do not create a vault unless the user explicitly asks.

## Input

- Vault or note path.
- Intended output, such as PRD material, rules, glossary, roadmap, or research brief.

## Output

- Structured Markdown working material.
- Source file list.
- Missing metadata and confidence notes.

## Steps

1. Confirm the workspace contains `.obsidian`, `.canvas`, Bases, or linked Obsidian Markdown.
2. Preserve original notes and links.
3. Extract source titles, backlinks, tags, and unresolved links when present.
4. Convert Canvas or note clusters into concise project material.
5. Do not invent source metadata or provenance.
6. Save outputs in an explicit docs or artifacts path chosen for the task.

## Acceptance

- Original vault files are unchanged unless editing was requested.
- Output cites source notes.
- Unresolved or uncertain items are marked `待补充`.

## Common Failures

- Treating ordinary Markdown as an Obsidian vault without evidence.
- Flattening backlinks and losing context.
- Creating a vault unnecessarily.

## Relationship To AGENTS.md

This skill supports source-safe cultural and knowledge work while respecting AGENTS.md's no-fabrication rule.
