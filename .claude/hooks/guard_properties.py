"""PreToolUse hook: the agent cannot edit, move, delete or overwrite locked property files.

Edit/Write/MultiEdit/NotebookEdit on a locked path is denied outright. A Bash/PowerShell command
that names a locked path is denied unless it is plainly read-only (cat, grep, git diff, running the
tests, ...). This is the local layer; CI (`property-lock`) is the one a pull request cannot get past.
The owner changes locked files outside the agent (their own editor), then runs
`python scripts/property_lock.py write` and commits.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from property_lock import LOCK_NAME, PROTECTED  # noqa: E402

LOCKED = [*PROTECTED, LOCK_NAME]
# Path fragments that identify a locked file inside a shell command.
FRAGMENTS = ["__properties__", "docs/properties", "property-testing.md", "workflows/properties.yml",
             ".claude/settings", ".claude/hooks", "guard_properties", "run_properties",
             "property_lock", LOCK_NAME]
READ_ONLY = re.compile(
    r"^\s*(cat|head|tail|less|grep|rg|ls|wc|diff|sha256sum|"
    r"git (diff|log|show|status|blame|ls-files|grep)|"
    r"npx vitest|npm (run )?test|npx nx test|python3? scripts/property_lock\.py verify|"
    r"Get-Content|Select-String)\b"
)
WRITES = re.compile(r">|\|\s*(tee|sh|bash|python)|\b(sed\s+-i|perl|truncate|dd|patch|apply|rm|mv|cp|"
                    r"checkout|restore|reset|stash|rebase|cherry-pick|Set-Content|Out-File|"
                    r"Remove-Item|Move-Item|Copy-Item|Rename-Item)\b|\s-[ec]\b")


def is_locked(path_text: str) -> bool:
    m = re.match(r"^/([a-zA-Z])/(.*)$", path_text)  # Git Bash style /d/... on Windows
    if m and sys.platform == "win32":
        path_text = f"{m.group(1)}:/{m.group(2)}"
    try:
        rel = Path(path_text).resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return False
    return any(rel == p or (p.endswith("/") and rel.startswith(p)) for p in LOCKED)


def deny(reason: str) -> None:
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    sys.exit(0)


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        deny("Property guard could not read the tool call, so it refuses it (fail closed).")
    tool = event.get("tool_name", "")
    args = event.get("tool_input", {}) or {}
    if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        path = args.get("file_path") or args.get("notebook_path") or ""
        if path and is_locked(path):
            deny(f"{path} is a locked property file. The implementing agent may run the property "
                 "tests but not change them; make the code pass instead, or ask the owner.")
    elif tool in ("Bash", "PowerShell"):
        cmd = (args.get("command") or "").replace("\\", "/")
        if any(f in cmd for f in FRAGMENTS):
            segments = re.split(r"&&|\|\||;|\n", cmd)
            for seg in segments:
                if any(f in seg for f in FRAGMENTS) and (not READ_ONLY.match(seg) or WRITES.search(seg)):
                    deny("This command touches a locked property file. Read-only commands and "
                         "running the tests are allowed; changing, moving or deleting them is not.")
    sys.exit(0)


if __name__ == "__main__":
    main()
