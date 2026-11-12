Closes #

## What changed and why

## Risk tier
Tick one. The `risk-tier` check computes the tier from the diff and fails if you tick a lower one.
- [ ] Low — docs, tests, copy
- [ ] Medium — ordinary product change
- [ ] High — sign-in, passwords, roles, client separation, data import/loss, CI, dependencies

## Review layers
What each layer ran on this PR, what it caught, and what was done about each finding
(fixed in `<sha>`, or answered with a reason). "Nothing caught" is a valid answer.

| Layer | How it ran | Blocks? | Caught | Done about it |
|---|---|---|---|---|
| 1. Author verification (tests + browser walk-through) | author agent, before the PR | no (evidence only) | | |
| 2. Fresh-context AI review (`/code-review --comment`, REVIEW.md) | separate reviewer agent, inline PR comments | yes, via unresolved threads | | |
| 3. Security review (bandit, pip-audit, CodeQL, `/security-review`) | CI on every push + reviewer agent | yes | | |
| 4. Required checks (tests on Linux + Windows, journey, import, ruff) | CI on every push | yes | | |
| 5. Risk tier + human approval | CI classifier + repo owner | yes | | |

## Evidence
Test output, commands run and their results, browser screenshots of each "Done when" item.

## How to revert
`git revert <merge sha>` — plus anything that needs undoing in the data (new tables, new columns).
