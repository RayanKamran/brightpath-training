# Review layers

Before this, the only thing between the agent's code and `master` was the agent's own report on
the issue: it built, it checked its work in the browser, it said it was done, it committed
straight to `master`. That is layer 1 of the seven in
[How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/),
and it is the author marking its own work.

| # | Layer (from the post) | Before | Now |
|---|---|---|---|
| 1 | Work verified before anyone else looks | ✅ browser check in `issue-builder` | ✅ kept, plus tests run before the PR |
| 2 | AI review on every PR | ❌ | ✅ fresh-context reviewer, inline comments |
| 3 | Security review that can block | ❌ | ✅ bandit + pip-audit + CodeQL in CI, `/security-review` |
| 4 | Automated checks that block | ❌ (tests existed, nothing ran them) | ✅ GitHub Actions, required |
| 5 | Human approval scaled by risk | ❌ | ✅ risk-tier classifier in CI + owner approval |
| 6 | Merge queue, flags, staged release | ❌ | out of scope (needs a team and real users) |
| 7 | Fast detection and rollback | ❌ | out of scope; each PR says how to revert |

## How each layer runs and what it may block

Nothing here needs anyone to remember it. CI runs on every push to a PR. The reviewer agents run
because `issue-builder` Stage 5 requires them before the agent may report. Branch protection on
`master` means nothing reaches it except through a PR with every required check green and every
review thread resolved.

### Layer 2 — Fresh-context AI review
- **Runs:** after the PR is open, the builder agent runs `/code-review high <PR> --comment`.
  The reviewer starts with a fresh context: the diff, the issue, `CLAUDE.md` and `REVIEW.md`, not
  the builder's conversation. Findings are posted as inline review comments on the PR.
- **Blocks:** yes. Every finding is a review thread. Branch protection requires every
  conversation to be resolved, so the author must fix it (and say which commit) or reply with a
  reason before it can merge.
- **Not the author:** the reviewer never sees the author's reasoning, only what it shipped.
  It is still an agent. Its findings count, but its approval never fills a human slot.
- **Cost:** runs on the Claude subscription the builder already uses, so it costs nothing extra.
  The Claude Code GitHub Action would bill API usage, which is out of scope.

### Layer 3 — Security review (`.github/workflows/security.yml`)
- **bandit** (Python SAST, medium+ severity and confidence). The 9 pre-existing B608 hits are
  in `.github/bandit-baseline.json`. Each one interpolates a constant SQL fragment or table name,
  never a request value. Only new findings fail, which is what the post's "Pre-existing" tag does.
- **pip-audit** checks `requirements.txt` for known CVEs.
- **CodeQL** (`security-extended`) is free for public repos. It posts alerts on the PR's lines.
- **`/security-review`** is run by the builder agent on High-tier PRs, and its findings go on the
  PR like layer 2's.
- **Blocks:** yes, red fails the merge. You can clear a false positive with
  `# nosec BXXX - reason` on the line, but the risk-tier classifier treats `nosec` as High, so
  a person always reads the suppression.

### Layer 4 — Required checks (`.github/workflows/checks.yml`)
- Every unit test on **Ubuntu and Windows**. The README promises both, and the owner runs Windows.
- `tests/test_journey.py`: the first build's one journey, on the **real seed data**. If a change
  breaks it, the change fails the floor. REVIEW.md makes editing this test to get it passing a
  finding in its own right.
- `python importer.py --reset` imports every seed CSV for real.
- **ruff**, checking for bugs only (syntax errors, undefined names, unused variables, bugbear).
  It has no style rules.
- **Blocks:** yes, every job is a required status check.

### Layer 5 — Risk tier and human approval (`.github/workflows/risk-tier.yml`)
`scripts/risk_tier.py` classifies the diff. The change sets the tier, not the author:

| Tier | What puts a PR here | Who approves before merge |
|---|---|---|
| Low | Only docs, tests, `.md`/`.txt` | Nobody needs to read it once every check is green. The owner merges. |
| Medium | Any other product code or template | The owner reads the diff and the evidence (test output, screenshots) |
| High | `auth.py`, `people.py`, `importer.py`, `app.py`, `run.py`, `requirements.txt`, anything in `.github/` or the classifier itself, or added lines mentioning `client_scope`, `role_required`, `password`, `csrf`, `session[`, `abort(403`, `SECRET_KEY`, `DELETE FROM`, `DROP TABLE`, `nosec`, `noqa` | Two people: the owner, plus a second human (a classmate or the instructor) who leaves an approving review |

- The check labels the PR `risk: Low/Medium/High` and writes its reasons to the job summary.
- **Blocks:** it fails if the PR description ticks a lower tier than the computed one, or if the
  description has no `## Review layers` section saying what each layer caught.
- **An agent's approval never counts as a human's.** The builder agent reporting "I checked it
  in the browser" is layer 1 evidence. It tells the reviewer where to look, but it is not an
  approval. The person who prompted the agent is always a required reviewer.

## Branch protection on `master`
- A pull request is required, so nobody pushes directly. This also applies to admins, which
  includes the agent using the owner's `gh` login.
- Required checks: `tests (ubuntu-latest)`, `tests (windows-latest)`, `lint`, `bandit`,
  `dependencies`, `codeql`, `risk-tier`.
- All conversations must be resolved, which is how layers 2 and 3 can block.
- GitHub doesn't let you approve your own PR, and the agent opens PRs as the owner. So the owner's
  approval for Medium is the act of merging after reading. For High, the second person's
  approving review is checked by hand before merging.
