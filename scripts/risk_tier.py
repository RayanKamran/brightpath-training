"""Layer 5 classifier: the change sets the risk tier, not the author.

Reads the diff against the base branch and prints the tier with its reasons. In CI it also
reads the pull request description and fails if the declared tier is lower than the computed
one, or if the "Review layers" section is missing.

Usage: python scripts/risk_tier.py [base_ref]        (default base: origin/master)
"""
import json
import os
import re
import subprocess
import sys

TIERS = ["Low", "Medium", "High"]

# Paths where one missed bug leaks one client's people to another, lets someone act as a role
# they don't hold, or loses data. Two people approve.
HIGH_PATHS = [r"^auth\.py$", r"^people\.py$", r"^importer\.py$", r"^run\.py$", r"^app\.py$",
              r"^\.github/", r"^scripts/risk_tier\.py$", r"^requirements\.txt$"]
# Words in added lines that mean the change touches who may do what, or whose data is shown.
HIGH_WORDS = [r"client_scope", r"role_required", r"password", r"csrf", r"session\[", r"abort\(403",
              r"SECRET_KEY", r"DROP\s+TABLE", r"DELETE\s+FROM", r"\bnosec\b", r"noqa"]
LOW_PATHS = [r"\.md$", r"^docs/", r"^tests/", r"\.txt$"]


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def classify(base):
    files = [f for f in git("diff", "--name-only", f"{base}...HEAD").splitlines() if f]
    added = [line[1:] for line in git("diff", "-U0", f"{base}...HEAD").splitlines()
             if line.startswith("+") and not line.startswith("+++")]
    reasons = []
    for f in files:
        if any(re.search(p, f) for p in HIGH_PATHS):
            reasons.append(("High", f"touches {f}"))
    for word in HIGH_WORDS:
        hits = [line.strip() for line in added if re.search(word, line, re.I)]
        if hits:
            reasons.append(("High", f"adds lines matching `{word}`, e.g. `{hits[0][:80]}`"))
    for f in files:
        if not any(re.search(p, f) for p in LOW_PATHS + HIGH_PATHS):
            reasons.append(("Medium", f"changes product code {f}"))
    tier = max((TIERS.index(t) for t, _ in reasons), default=0)
    return TIERS[tier], files, reasons


def declared(body):
    """The tier ticked in the PR template, e.g. '- [x] High'."""
    ticked = re.findall(r"-\s*\[[xX]\]\s*(Low|Medium|High)\b", body or "")
    return max(ticked, key=TIERS.index) if ticked else None


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "origin/master"
    tier, files, reasons = classify(base)
    out = [f"## Risk tier: {tier}", "", f"{len(files)} file(s) changed."]
    out += [f"- **{t}**: {r}" for t, r in reasons] or ["- docs/tests only"]
    approvers = {"Low": "no human approval needed once every check is green",
                 "Medium": "one person (the repo owner) reads the diff and the evidence before merging",
                 "High": "two people: the repo owner and a second human reviewer; an agent never fills a slot"}
    out += ["", f"Who approves: {approvers[tier]}."]

    errors = []
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path:
        with open(event_path, encoding="utf-8") as f:
            body = json.load(f).get("pull_request", {}).get("body") or ""
        mine = declared(body)
        if not mine:
            errors.append("Tick one risk tier in the PR description.")
        elif TIERS.index(mine) < TIERS.index(tier):
            errors.append(f"The PR says {mine}, but the change is {tier}. The change sets the tier.")
        if "## Review layers" not in body:
            errors.append("The PR description needs a '## Review layers' section: what each layer ran and caught.")
    out += [f"\n**FAIL:** {e}" for e in errors]

    text = "\n".join(out)
    print(text)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(text + "\n")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            f.write(f"tier={tier}\n")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
