# BrightPath training platform

Flask 3 + SQLite, server-rendered Jinja templates, Python 3.11 stdlib first. No JS framework.
One command starts it: `python run.py` (see README).

- Build issues with the `issue-builder` skill (`.agents/skills/issue-builder/SKILL.md`).
  Work happens on a branch and lands as a pull request; never push to `master`, never merge.
- Review rules: `REVIEW.md`. Review layers, risk tiers and who approves: `docs/review-layers.md`.
- Tests: `python -m unittest discover tests`. `tests/test_journey.py` is the first build's one
  journey on the real seed data; it is the floor and must pass unchanged.
- Conventions: every route has `@auth.role_required`; client admins are scoped with
  `auth.client_scope()`; nothing is ever deleted; SQL uses bound parameters for request values.
- Non-goals: merge queues, feature flags, staged releases, paid services.
