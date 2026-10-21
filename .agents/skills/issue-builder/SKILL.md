---
name: issue-builder
description: Use whenever asked to pick up, work on, or build a GitHub issue in this repo. Runs every build issue through brainstorm → plan → approval → Ponytail-style build → browser check → report, all on the issue itself.
---

# Issue builder

You build this project one GitHub issue at a time. Use the `gh` CLI for every
issue interaction. All conversation about the work happens as **comments on the
issue**, not only in chat.

Before anything else, read the issue and all its comments:
`gh issue view <N> --comments`
Also read `data/seed/README.txt` and look at the CSVs in `data/seed/` so your
questions are grounded in the real data.

Work out which stage the issue is at from its comments, then continue from
there. Never skip a stage.

## Stage 1 — Brainstorm (no code)

- Use the Superpowers **brainstorming** skill.
- Post ONE question at a time as a comment:
  `gh issue comment <N> --body "Question 1: ..."`
- After posting a question, STOP and end your turn. Tell me in chat:
  "Question posted on #N, reply there and tell me to continue."
- When resumed, re-read the comments, take my answer, and post the next question.
- Do not write, create or edit any code or project files during this stage.
- When you have no more questions, say so in a comment and move to Stage 2.

## Stage 2 — Plan and wait for approval

- Use the Superpowers **writing-plans** skill.
- Post the plan as one comment: steps, files to touch, what you will reuse,
  how you will check it in the browser, and what is out of scope ("Stop at").
- STOP and end your turn. Tell me: "Plan posted on #N, comment `approve` to start."
- Start building ONLY when a comment from me contains the word `approve`.
  If I comment changes instead, revise the plan, post it again and wait again.

## Stage 3 — Build the Ponytail way

- Follow the **Ponytail** skill: write only what this issue needs.
- Before writing anything new, search the codebase for existing code,
  helpers, components, or libraries you can reuse, and reuse them.
- Do not build anything listed under the issue's "Stop at".
- Commit with a message that references the issue (`#N`).

## Stage 4 — Check it in the browser

- Start the app with the one command in the README.
- Use the **Chrome DevTools MCP** to open the app and go through every
  "Done when" item on the issue as a real user would: navigate, click, type,
  take screenshots, and read the console for errors.
- A module is NOT done until every "Done when" item has been seen working in
  the browser. If something fails, fix it and check again.

## Stage 5 — Report on the issue

Post a final comment with exactly these three sections:

### Built
What you built, and the commits.

### Checked
Each "Done when" item, how you checked it in the browser, and the result.

### Skipped
Anything you did not do or could not check, and why. Write "Nothing" if empty.

Then tell me in chat that the report is posted. Do not close the issue; I will.