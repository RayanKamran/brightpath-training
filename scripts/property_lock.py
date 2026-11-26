"""Property-test lock: hash the approved property tests, and verify a tree against the hashes.

    python scripts/property_lock.py write             # owner only: record the approved files
    python scripts/property_lock.py verify            # this checkout against its own lock
    python scripts/property_lock.py verify --lock base/properties.lock.json --tree head/
                                                      # CI: the PR's files against the BASE lock

The lock lists exact files. Line endings are normalised (CRLF -> LF) before hashing so a Windows
checkout and a Linux runner agree. A locked file that is missing, changed, or a new file added under
a locked directory fails verification.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

LOCK_NAME = "properties.lock.json"

# What is locked. Directories lock every file inside them (and reject new files there).
PROTECTED = [
    "sonix/apps/sonix-apis/src/part/__properties__/",
    "docs/properties/",
    "docs/property-testing.md",
    ".github/workflows/properties.yml",
    ".claude/settings.json",
    ".claude/hooks/guard_properties.py",
    ".claude/hooks/run_properties.py",
    "scripts/property_lock.py",
]


def _digest(path: Path) -> str:
    data = path.read_bytes().replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def _files(tree: Path, entries: list[str]) -> dict[str, str]:
    found: dict[str, str] = {}
    for entry in entries:
        target = tree / entry
        if entry.endswith("/"):
            if target.is_dir():
                for f in sorted(target.rglob("*")):
                    if f.is_file():
                        found[f.relative_to(tree).as_posix()] = _digest(f)
        elif target.is_file():
            found[entry] = _digest(target)
    return found


def write(root: Path) -> int:
    lock = {"protected": PROTECTED, "files": _files(root, PROTECTED)}
    (root / LOCK_NAME).write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"locked {len(lock['files'])} files in {LOCK_NAME}")
    return 0


def verify(lock_path: Path, tree: Path) -> int:
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    expected: dict[str, str] = lock["files"]
    actual = _files(tree, lock["protected"])
    problems = []
    for name, digest in expected.items():
        if name not in actual:
            problems.append(f"missing  {name}")
        elif actual[name] != digest:
            problems.append(f"changed  {name}")
    for name in actual.keys() - expected.keys():
        problems.append(f"added    {name}")
    head_lock = tree / LOCK_NAME
    if head_lock.resolve() != lock_path.resolve():
        if not head_lock.is_file() or _digest(head_lock) != _digest(lock_path):
            problems.append(f"changed  {LOCK_NAME}")
    if problems:
        print("Property lock FAILED. Locked files may only change in a commit the owner makes:")
        print("\n".join("  " + p for p in sorted(problems)))
        return 1
    print(f"Property lock OK: {len(expected)} locked files unchanged.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["write", "verify"])
    parser.add_argument("--lock", type=Path)
    parser.add_argument("--tree", type=Path, default=Path("."))
    args = parser.parse_args()
    if args.command == "write":
        return write(args.tree)
    return verify(args.lock or args.tree / LOCK_NAME, args.tree)


if __name__ == "__main__":
    sys.exit(main())
