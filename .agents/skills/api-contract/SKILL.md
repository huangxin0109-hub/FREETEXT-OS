---
name: api-contract
description: Preserve API, schema, SDK, and error-code contracts in FREETEXT OS Cloudflare Functions and frontend callers. Use when changing `/api/*`, DeepSeek payloads, search providers, structured outputs, or error handling.
---

# API Contract

## Trigger

Use when editing `functions/api/*`, shared rules, request/response JSON, error messages, status codes, or frontend fetch callers.

## Do Not Trigger

Do not use for pure CSS/text changes that do not affect API behavior.

## Input

- API endpoint and caller.
- Current request/response shape.
- Error paths.

## Output

- Contract summary.
- Caller/doc updates.
- Validation results.

## Steps

1. Identify all callers with `rg` for endpoint paths and response fields.
2. Preserve secret boundaries; never expose API keys in frontend code.
3. Keep JSON field names stable unless the change is intentional.
4. Update frontend handling and docs/comments when response shape changes.
5. Test success, invalid input, and external-service failure.
6. Ensure AI outputs never fabricate factual book metadata.

## Acceptance

- Every caller still understands the endpoint.
- Errors are explicit and user-readable.
- Contracts are validated locally where possible.

## Common Failures

- Adding a new response field but forgetting UI display.
- Changing an error status without updating caller behavior.
- Letting DeepSeek invent missing author/publisher/date fields.

## Relationship To AGENTS.md

This skill implements the AGENTS.md rule that API/schema/SDK/error changes must check callers and docs.
