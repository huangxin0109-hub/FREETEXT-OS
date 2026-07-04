---
name: using-superpowers
description: Fallback Superpowers-style workflow for FREETEXT OS when the Superpowers plugin is unavailable. Use to decide which workflow skill to load and to enforce deliberate scoping, planning, testing, review, and verification.
---

# Using Superpowers

## Trigger

Use at the start of complex work when no native Superpowers plugin is installed.

## Do Not Trigger

Do not use for tiny, direct commands.

## Input

- User task.
- Available repo skills.

## Output

- Selected workflow skill(s).
- Short execution plan.

## Steps

1. Read AGENTS.md.
2. Pick the smallest matching skill: repo-onboarding, brainstorming, test-driven-development, frontend-quality, api-contract, document-ingestion, or verification-before-completion.
3. State the goal, boundary, and acceptance criteria.
4. Execute the selected workflow.

## Acceptance

- A matching skill is used when appropriate.
- The task does not start with blind editing.

## Common Failures

- Loading too many skills.
- Treating a fallback skill as a plugin installation.

## Relationship To AGENTS.md

This skill is a repo fallback for Superpowers and reinforces AGENTS.md work discipline.
