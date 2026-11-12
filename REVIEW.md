# REVIEW.md — what the reviewer looks for in this repo

Loaded by every review: the fresh-context reviewer (`/code-review`), `/security-review`, and any
human. Read `CLAUDE.md` first.

## What failure looks like here

1. **One client sees another.** Seven client companies must never see each other's learners,
   enrolments, reports or CSVs. Any query that reads learners, enrolments, attempts or reports
   without `auth.client_scope()` (or an equivalent filter) is a finding.
2. **Someone acts as a role they don't hold.** Every route needs `@auth.role_required(...)`, and
   every object id taken from the URL must be checked against the signed-in person (the cohort
   they teach, the enrolment that is theirs). A guessable id that returns someone else's data is
   a finding.
3. **A record is lost or rewritten.** Nothing is ever deleted; scores are never changed once
   given; history is kept. A `DELETE`, a destructive `UPDATE`, or a `--reset` reachable from the
   app is a finding.
4. **The one journey breaks.** Admin creates a learner → instructor publishes a cohort with a
   page and a quiz → learner enrols and scores → instructor sees the score.
   `tests/test_journey.py` must keep passing unchanged; editing it to make it pass is a finding.
5. **Secrets and passwords.** Passwords only ever stored hashed; no secret in code, logs, URLs or
   flash messages; CSRF token on every POST form; reset tokens single-use and expiring.
6. **SQL built from user input.** Constants interpolated into SQL are fine (see the bandit
   baseline); request values must always be bound parameters.

## Rules for findings

- Every finding names a **file and line** and a concrete scenario (who does what, what goes
  wrong). No guesses without evidence.
- Tag each finding **Important**, **Nit**, or **Pre-existing** (a bug the PR didn't introduce).
- At most **3 nits** per review. No style or formatting findings: ruff owns those.
- Start the summary with a count, e.g. "2 Important, 1 Nit." Say plainly
  "Nothing to fix." when there is nothing.
- Don't repeat a finding already posted on the PR. Flag the class of bug so every instance gets
  fixed, not only the first one.
- After 3 review rounds on one PR, stop and ask the author to reconsider the approach.

## Skip

`.agents/`, `data/seed/`, `instance/`, `.github/bandit-baseline.json`.
