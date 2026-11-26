"""Stop hook: if parts code changed and is not yet pushed, run the property tests before the agent
may finish. A failing property blocks the turn (exit 2 feeds the failure back to the agent).

Runs when sonix part code has uncommitted changes, or commits that are not on the upstream yet.
If it already blocked once this turn (stop_hook_active), it lets the agent stop but says so, so a
genuinely stuck agent can still hand back to the human; CI still blocks the merge.
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WATCH = ["sonix/apps/sonix-apis/src/part", "sonix/libs/shared/data-models/src"]
API = ROOT / "sonix" / "apps" / "sonix-apis"


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()


def part_code_changed() -> bool:
    if git("status", "--porcelain", "--", *WATCH):
        return True
    upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
    if upstream:
        return bool(git("log", "--oneline", f"{upstream}..HEAD", "--", *WATCH))
    return False


def main() -> None:
    event = json.load(sys.stdin)
    if not (API / "src" / "part").is_dir() or not part_code_changed():
        sys.exit(0)
    proc = subprocess.run("npx vitest run src/part/__properties__", cwd=API, shell=True,
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode == 0:
        sys.exit(0)
    tail = (proc.stdout + proc.stderr)[-6000:]
    if event.get("stop_hook_active"):
        print("Property tests are still failing (CI will block the merge):\n" + tail, file=sys.stderr)
        sys.exit(0)
    print("Property tests fail on the current parts code. Fix the code (the tests are locked):\n"
          + tail, file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
