---
name: test-driven-development
description: Drive risky FREETEXT OS behavior changes with a failing test or executable reproduction first. Use for bug fixes, parsing/import limits, API contracts, and regressions.
---

# Test Driven Development

## Trigger

Use for bugs, regressions, limits, parsing, API behavior, or complex state changes.

## Do Not Trigger

Do not use for pure copy edits or tiny visual text changes.

## Input

- Bug or behavior requirement.
- Existing tests or reproduction path.

## Output

- Failing reproduction or test.
- Fix.
- Passing verification.

## Steps

1. Reproduce the current failure with the smallest test or script.
2. Implement the minimum fix.
3. Run the reproduction again.
4. Add/adjust automated tests if the behavior is important and stable.
5. Report remaining untested risk.

## Acceptance

- The original bug is proven fixed.
- Boundary cases are covered when relevant.

## Common Failures

- Fixing before reproducing.
- Testing only the happy path.

## Relationship To AGENTS.md

Supports required validation after code changes.
