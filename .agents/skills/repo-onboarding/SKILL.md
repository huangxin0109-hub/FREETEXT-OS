---
name: repo-onboarding
description: Orient Codex in the FREETEXT OS repository before substantial work. Use when starting a new task, resuming after a long gap, auditing project structure, or deciding commands, architecture, risks, and boundaries.
---

# Repo Onboarding

## Trigger

Use when the task is broad, touches multiple files, asks for project setup, asks "what is this repo", or requires choosing tests/build/deploy commands.

## Do Not Trigger

Do not use for one-line answers or a tiny change in a known file where context is already fresh.

## Input

- User request.
- Current git status.
- Existing AGENTS.md and repo files.

## Output

- Project type and command map.
- Relevant files.
- Risks and validation plan.

## Steps

1. Confirm target, boundary, and acceptance criteria.
2. Read AGENTS.md first; if KnowledgeBase exists, read relevant files.
3. Inspect package/config files, deployment files, and current git status.
4. Identify project type, start command, test command, lint/typecheck/build command, deploy surface.
5. Name unrelated dirty files and avoid touching them.
6. Produce a short plan before editing unless the change is trivial.

## Acceptance

- The agent knows the repo type and validation commands.
- No unrelated dirty files are modified.
- The plan follows AGENTS.md and FREETEXT principles.

## Common Failures

- Assuming a framework exists because a file name looks familiar.
- Ignoring deleted or modified files already present in the worktree.
- Starting implementation before confirming the product boundary.

## Relationship To AGENTS.md

This skill operationalizes the AGENTS.md rule that complex tasks begin with目标、边界、验收标准 and that work must serve FREETEXT OS落地.
