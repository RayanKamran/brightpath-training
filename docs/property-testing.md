# Property testing in the factory (HW6 Part 1b)

A property says something that must hold for every input; fast-check generates 1000 inputs per
property and, when one breaks it, shrinks it to the smallest failing case. We use four kinds:
round-trip, invariant, idempotency, equivalence. (End-to-end and differential tests are out of scope.)

## The three decisions

### 1. Who writes the properties: the spec, a reviewer pass, then the owner

1. **Before any implementation exists**, the agent reads only the ticket's spec and writes a
   property list: kind, the rule in plain words, and the **spec line numbers** it comes from
   (`docs/properties/<ticket>.md`). It does not read or plan the implementation first; the only
   code it reads is the existing public surface the tests must call (entity shapes, `findOne`).
2. The owner reads the list and replies `approve` (or changes it). Nothing is coded before that.
3. The agent turns the approved list into fast-check tests in
   `sonix/apps/<app>/src/<feature>/__properties__/`, runs them once to confirm they fail for the
   right reason (the feature doesn't exist yet), and the lock is written in the same commit.

The properties encode the spec, not the code: where the spec and the codebase disagree (for
example the spec's `toMoney(dto.cost)` turns cents into 100x cents), the property follows the
spec's stated rule (cents in, the same cents out) and the conflict goes in the PR.

### 2. How the lock works: three layers, the last one cannot be argued with

| Layer | What it stops | How |
|---|---|---|
| Claude Code `PreToolUse` hook (`.claude/hooks/guard_properties.py`) | The agent editing, overwriting, moving or deleting a locked file, by Edit/Write or by shell | Denies the tool call. The hook and `.claude/settings.json` are themselves locked, so the agent can't switch it off |
| `properties.lock.json` | Silent drift | SHA-256 of every locked file (CRLF normalised). `python scripts/property_lock.py verify` |
| CI `property-lock` (`.github/workflows/properties.yml`) | A pull request that changes a locked file by any route, including editing the workflow or the lock itself | Runs on `pull_request_target`, i.e. **the base branch's copy** of the workflow, script and lock. It checks the PR head out as data and never executes it. A PR cannot change the check that judges it |

Locked: the property tests, `docs/properties/`, this file, the workflow, the hook, the settings
file, the lock script, and the lock itself.

**Changing a property** is the owner's job, never the agent's: they edit in their own editor,
run `python scripts/property_lock.py write`, and land that as its own commit on the base branch
(not inside the feature PR, where `property-lock` would fail it).

### 3. What a failing property may block

| Where | Blocks? |
|---|---|
| Merge of the PR | **Yes.** `property-tests` and `property-lock` are required checks |
| The agent ending its turn | **Yes, once.** The `Stop` hook runs the properties when parts code has unpushed changes; red sends the shrunk counterexample back to the agent. If it is still red on the second stop it lets the agent hand back to the human (with the failure), so a stuck agent can ask for help |
| A local commit | No. Work-in-progress commits are fine; CI is the gate |
| The properties PR itself | It is red by design (the feature does not exist yet); it lands as the base the feature PR is judged against |

## They run on every change

* CI: `property-tests` on every push to every PR, checked out at the PR's **head SHA** (not the
  merge preview) and printing it, so "did it run on the final commit" is answered by the log.
* Locally: the `Stop` hook above, without anyone remembering to run them.
* By hand: `cd sonix/apps/sonix-apis && npx vitest run src/part/__properties__`.

## After merge (owner, one-off)

Add `property-tests` and `property-lock` to the required checks on `master` (next to the ones
listed in `docs/review-layers.md`).
