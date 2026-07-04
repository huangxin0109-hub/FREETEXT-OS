---
name: repo-code-review
description: Review FREETEXT OS code changes for correctness, regressions, security, API contract drift, frontend behavior, and missing validation. Use when the user asks for review or before merging larger changes.
---

# Repo Code Review

## Trigger

Use for "review", "检查代码", pre-merge audits, regression hunts, or suspicious behavior after a change.

## Do Not Trigger

Do not use when the user asks only to implement a known small edit and no review is requested.

## Input

- Diff or changed files.
- Relevant app/API flows.
- Test output when available.

## Output

- Findings first, ordered by severity.
- File/line references.
- Test gaps and residual risk.

## Steps

1. Read AGENTS.md and the relevant diff.
2. Prioritize user-facing bugs, data loss, secret leakage, API contract mismatches, and missing validation.
3. Check frontend route/state changes against the five-step AI选书官 path.
4. Check Functions APIs for error shape, secret handling, CORS, and caller expectations.
5. Verify that tests or manual checks cover the risky path.
6. If no issues, say so clearly and list remaining risk.

## Acceptance

- Findings are actionable and grounded in exact files.
- Summary is secondary to findings.
- No unrelated refactor requests are mixed into review.

## Common Failures

- Treating style preferences as high-severity issues.
- Missing caller updates after API response shape changes.
- Forgetting that AI cannot fabricate book facts.

## Relationship To AGENTS.md

This skill supports the rule that API/schema changes must check callers/docs and that final answers include validation and risk.
