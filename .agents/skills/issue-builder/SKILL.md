---
name: issue-builder
description: Use whenever asked to pick up, work on, or build a GitHub issue in this repo. Runs every build issue through brainstorm → plan → approval → Ponytail-style build on a branch → browser check → pull request through the review layers → report on the issue.
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
- Work on a branch, never on `master`: `git switch -c issue-<N>-<short-name>`.
  Commit with messages that reference the issue (`#N`).
- Read `CLAUDE.md` and `REVIEW.md` before writing code; REVIEW.md is what the
  reviewer will hold you to.

## Stage 4 — Check it yourself (review layer 1)

- Run every test: `python -m unittest discover tests`. `tests/test_journey.py`
  (the first build's one journey) must pass **unchanged**. Never edit it to make
  it pass; if your change has to change the journey, stop and ask on the issue.
- Start the app with the one command in the README.
- Use the **Chrome DevTools MCP** to open the app and go through every
  "Done when" item on the issue as a real user would: navigate, click, type,
  take screenshots, and read the console for errors.
- A module is NOT done until every "Done when" item has been seen working in
  the browser. If something fails, fix it and check again.
- This is evidence, not approval: you are the author.

## Stage 5 — Pull request and review layers 2–5

See `docs/review-layers.md` for what each layer is and what it blocks.

1. Push the branch and open a PR with the repo's template
   (`.github/pull_request_template.md`): `Closes #N`, tick the risk tier, and add
   evidence (test output, screenshots) and how to revert.
2. **Layer 2 — fresh-context review.** Run `/code-review high <PR> --comment` so
   a reviewer that has not seen this conversation posts inline findings on the PR.
   On a High-tier PR also run `/security-review` and post its findings on the PR.
   If those commands are not available, dispatch a fresh subagent with only the
   diff (`gh pr diff <PR>`), the issue, `CLAUDE.md` and `REVIEW.md`, and post its
   findings as inline comments with
   `gh api repos/{owner}/{repo}/pulls/<PR>/reviews --input review.json`
   (`{"event":"COMMENT","body":"<count summary>","comments":[{"path":..,"line":..,"body":..}]}`).
3. **Layers 3–5 run in CI by themselves.** Wait for them: `gh pr checks <PR> --watch`.
4. **Answer every finding** from every layer, one by one, on the PR:
   - fixed: push the fix, reply "Fixed in `<sha>`" on the thread;
   - not fixing: reply with the reason (false positive, pre-existing, out of
     scope with a follow-up issue). Never silence a check without a reason on
     the line (`# nosec BXXX - reason`).
   Repeat until every check is green. After 3 review rounds, stop and ask me
   on the PR whether the approach is wrong.
5. Fill in the PR's **Review layers** table: for each layer, how it ran, what
   it caught, and what you did about each finding.
6. **Never merge, never approve, never resolve a thread for a human, never push
   to `master`.** An agent's approval never counts as a person's. I merge, after
   the approvals that the risk tier asks for.

## Stage 6 — Report on the issue

Post a final comment with exactly these four sections:

### Built
What you built, the PR, and the commits.

### Checked
Each "Done when" item, how you checked it in the browser, and the result.

### Reviewed
Risk tier (from the `risk-tier` check), and for each review layer: what it
caught and what you did about it. Link the PR threads.

### Skipped
Anything you did not do or could not check, and why. Write "Nothing" if empty.

Then tell me in chat that the report is posted and the PR is ready for me.
Do not close the issue; merging the PR will.