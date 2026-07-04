---
name: scope-before-work
description: Define target, boundary, acceptance criteria, risks, and non-goals before complex FREETEXT OS work. Use before multi-file changes, product decisions, installations, or ambiguous requests.
---

# Scope Before Work

## Trigger

Use before complex or ambiguous tasks.

## Do Not Trigger

Do not use for simple read-only checks.

## Input

- User request.
- Current repo state.

## Output

- Goal.
- Boundary/non-goals.
- Acceptance criteria.
- Validation plan.

## Steps

1. Restate the goal in one sentence.
2. List explicit non-goals.
3. Identify files/tools likely involved.
4. Name validation commands or reasons they may not run.
5. Ask at most five blocking questions only if required.

## Acceptance

- The user can see what will and will not be done.
- No risky action begins without scope.

## Common Failures

- Asking broad questions that do not affect success.
- Treating scope as a long plan instead of a useful boundary.

## Relationship To AGENTS.md

Directly implements the complex-task scoping rule in AGENTS.md.
