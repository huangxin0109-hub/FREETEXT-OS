---
name: skill-harvest
description: Turn repeated FREETEXT OS workflows into small repo skills. Use when the same prompt pattern, review issue, bug fix flow, validation checklist, or content workflow appears three or more times.
---

# Skill Harvest

## Trigger

Use when a workflow repeats at least three times or the user asks to make Codex better at a recurring task.

## Do Not Trigger

Do not use for a one-off task or a broad bundle of unrelated workflows.

## Input

- Repeated prompts or fixes.
- Evidence that the pattern recurs.
- Existing relevant skills.

## Output

- A proposed small skill or update.
- Test task proving usefulness.

## Steps

1. Confirm the repeated pattern appears at least three times.
2. Prefer the system `skill-creator` skill.
3. Keep the new skill small and focused.
4. Do not combine unrelated workflows.
5. Add or update a repo skill under `.agents/skills/`.
6. Test the skill once on a real task before marking it usable.

## Acceptance

- The skill has a clear trigger and non-trigger.
- It has been tested on a real task.
- It improves future execution without bloating context.

## Common Failures

- Creating a giant "do everything" skill.
- Writing documentation instead of procedural skill instructions.
- Marking a skill usable before any real task test.

## Relationship To AGENTS.md

This skill helps the team continuously improve Codex workflow quality while respecting repo boundaries.
