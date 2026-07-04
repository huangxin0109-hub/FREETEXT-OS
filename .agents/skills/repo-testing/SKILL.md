---
name: repo-testing
description: Add or run focused tests for FREETEXT OS. Use when behavior changes, bugs are fixed, limits are adjusted, APIs are changed, or the user asks to verify functionality.
---

# Repo Testing

## Trigger

Use after code changes, bug fixes, API contract edits, import/parsing changes, DeepSeek workflow changes, or frontend path changes.

## Do Not Trigger

Do not use for pure documentation edits unless the docs include executable examples or command changes.

## Input

- Changed files.
- Existing package scripts.
- User acceptance criteria.

## Output

- Tests added or run.
- Pass/fail summary.
- Reasons for anything not run.

## Steps

1. Prefer existing scripts: `npm run test:syntax`, `npm run test:playwright`, then `npm test` when appropriate.
2. For API changes, test request/response shape and error handling.
3. For import limits, test boundary values below, at, and above the limit.
4. For frontend changes, invoke `frontend-quality`.
5. Keep tests focused; avoid building a broad test suite for a narrow change.

## Acceptance

- The changed behavior is directly covered.
- Boundary cases are checked when limits or validation changed.
- Failures are reported with likely cause.

## Common Failures

- Running only syntax checks for UI behavior.
- Skipping boundary cases.
- Treating local DeepSeek 401 as product failure when the secret is local-only.

## Relationship To AGENTS.md

This skill implements the AGENTS.md requirement to run relevant tests/lint/typecheck or explain why they cannot run.
