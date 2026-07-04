---
name: frontend-quality
description: Validate FREETEXT OS frontend/UI changes with a real browser. Use when modifying pages, components, styles, interactions, routing, forms, login-like flows, admin/back-office behavior, or any visible UI.
---

# Frontend Quality

## Trigger

Use for page, component, CSS, route, form, click path, import flow, or review/final-list changes.

## Do Not Trigger

Do not use for backend-only edits with no visible UI effect, unless the frontend consumes the API response.

## Input

- Changed UI files.
- Target route(s).
- Acceptance path.

## Output

- Browser validation summary.
- Console error summary.
- Screenshots only when helpful or requested.

## Steps

1. Run syntax checks first when JavaScript changed.
2. Start the local service with `npm run preview` or existing dev command.
3. Open the relevant route with Playwright or equivalent browser automation.
4. Complete the critical user path: click, input, import, navigation, and confirmation.
5. Check console errors and obvious visual breakage.
6. Save screenshots to `artifacts/` only when they clarify the result or failure.
7. If browser automation cannot run, state why and use the strongest available fallback.

## Acceptance

- Relevant page opens.
- Critical path works.
- No new console errors are observed.
- Any failure includes reproduction steps.

## Common Failures

- Trusting static inspection without opening the page.
- Testing the happy path only and missing empty/error states.
- Leaving local servers running after validation.

## Relationship To AGENTS.md

This skill satisfies the AGENTS.md rule that frontend/UI changes require Playwright or equivalent real page validation.
