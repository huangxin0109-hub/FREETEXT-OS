---
name: verification-before-completion
description: Verify FREETEXT OS work before declaring it complete. Use at the end of any code, config, documentation ingestion, API, or frontend task.
---

# Verification Before Completion

## Trigger

Use before final response for non-trivial work.

## Do Not Trigger

Do not use for read-only answers where no artifact changed.

## Input

- Changed files.
- Acceptance criteria.
- Available commands.

## Output

- Verification log summary.
- Unverified items and reasons.
- Residual risks.

## Steps

1. Run the most relevant syntax/test/lint/build command.
2. For UI changes, run frontend-quality or explain why impossible.
3. For document ingestion, verify output file and metadata.
4. For API changes, test success/error path.
5. Check git status and ensure unrelated files are not staged.
6. Final response includes changed files, verification, risks, next step.

## Acceptance

- Completion is based on evidence, not confidence.
- Any inability to verify is clearly explained.

## Common Failures

- Saying "should work" without a command or browser check.
- Forgetting to stop dev servers.

## Relationship To AGENTS.md

Directly implements the AGENTS.md final-response and validation requirements.
