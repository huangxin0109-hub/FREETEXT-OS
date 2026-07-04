---
name: requesting-code-review
description: Prepare FREETEXT OS changes for human or AI review. Use before asking for review, opening a PR, or handing off work.
---

# Requesting Code Review

## Trigger

Use when a change is ready for review or the user asks for PR/review readiness.

## Do Not Trigger

Do not use while implementation is still incomplete.

## Input

- Diff.
- Test results.
- Known risks.

## Output

- Review summary.
- Files changed.
- Validation run.
- Specific reviewer focus areas.

## Steps

1. Summarize intent and changed files.
2. List validation commands and results.
3. Identify risky areas for reviewer attention.
4. Confirm no unrelated dirty files were included.

## Acceptance

- Reviewer can understand the change without re-running discovery.
- Known risks are explicit.

## Common Failures

- Hiding failed tests.
- Forgetting unrelated dirty files.

## Relationship To AGENTS.md

Supports final reporting and quality review discipline.
