"""Load the seed CSVs into SQLite.

Insert-only: a row whose key is already in the database is left alone, so changes
made in the app survive a re-run. Usage: python importer.py [--reset]
"""
import argparse
import csv
import sqlite3
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
DB_PATH = ROOT / "instance" / "brightpath.db"
SEED_DIR = ROOT / "data" / "seed"

# Staff columns may also say no staff member was involved.
NO_STAFF = {"", "self", "self-signup"}

# In load order: every table only references tables above it.
# cols: CSV columns; key: primary key; required: may not be blank (all others may);
# dates/ints/reals: checked and stored as such; refs: column -> referenced table.
TABLES = {
    "clients": dict(
        cols=["client_id", "name", "industry", "email_domain", "contract_start", "contract_end", "seats"],
        key=["client_id"], required=["name", "contract_start", "seats"],
        dates=["contract_start", "contract_end"], ints=["seats"], reals=[], refs={}),
    "staff": dict(
        cols=["staff_id", "full_name", "email", "role", "client_id", "specialism", "joined_on", "left_on"],
        key=["staff_id"], required=["full_name", "email", "role", "joined_on"],
        dates=["joined_on", "left_on"], ints=[], reals=[], refs={"client_id": "clients"}),
    "courses": dict(
        cols=["course_id", "title", "category", "description", "cohort", "starts_on", "ends_on", "length_days"],
        key=["course_id"], required=["title", "starts_on", "ends_on"],
        dates=["starts_on", "ends_on"], ints=["length_days"], reals=[], refs={}),
    "course_staff": dict(
        cols=["course_id", "staff_id", "role", "assigned_on", "unassigned_on"],
        key=["course_id", "staff_id", "assigned_on"], required=["role"],
        dates=["assigned_on", "unassigned_on"], ints=[], reals=[], refs={"course_id": "courses", "staff_id": "staff"}),
    "learners": dict(
        cols=["learner_id", "full_name", "email", "client_id", "department", "account_created_on",
              "created_by", "account_status"],
        key=["learner_id"], required=["full_name", "email", "created_by", "account_status"],
        dates=["account_created_on"], ints=[], reals=[], refs={"client_id": "clients", "created_by": "staff"}),
    "assessments": dict(
        cols=["assessment_id", "course_id", "type", "title", "due_on", "weight_pct", "author_id", "status",
              "published_on"],
        key=["assessment_id"], required=["course_id", "type", "title", "weight_pct", "status"],
        dates=["due_on", "published_on"], ints=[], reals=["weight_pct"], refs={"course_id": "courses", "author_id": "staff"}),
    "enrolments": dict(
        cols=["enrolment_id", "learner_id", "course_id", "enrolled_on", "withdrawn_on", "outcome",
              "previous_attempts", "activity_clicks", "enrolled_by"],
        key=["enrolment_id"], required=["learner_id", "course_id", "outcome", "enrolled_by"],
        dates=["enrolled_on", "withdrawn_on"], ints=["previous_attempts", "activity_clicks"], reals=[],
        refs={"learner_id": "learners", "course_id": "courses", "enrolled_by": "staff"}),
    "attempts": dict(
        cols=["attempt_id", "assessment_id", "learner_id", "course_id", "submitted_on", "score", "graded_by"],
        key=["attempt_id"], required=["assessment_id", "learner_id", "course_id", "submitted_on"],
        dates=["submitted_on"], ints=["score"], reals=[],
        refs={"assessment_id": "assessments", "learner_id": "learners", "course_id": "courses",
              "graded_by": "staff"}),
}


def connect(db_path=DB_PATH):
    """Open the database, creating the file and tables if needed."""
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(db_path)
    for table, t in TABLES.items():
        cols = ", ".join(f"{c} {'INTEGER' if c in t['ints'] else 'REAL' if c in t['reals'] else 'TEXT'}"
                         for c in t["cols"])
        db.execute(f"CREATE TABLE IF NOT EXISTS {table} ({cols}, PRIMARY KEY ({', '.join(t['key'])}))")
    return db


def check(row, t, known):
    """Return the reasons this row can't be loaded (empty list = fine)."""
    reasons = [f"missing {c}" for c in t["key"] + t["required"] if not row[c]]
    for c in t["dates"]:
        if row[c]:
            try:
                date.fromisoformat(row[c])
            except ValueError:
                reasons.append(f"bad date in {c} '{row[c]}'")
    for c in t["ints"]:
        if row[c] and not row[c].lstrip("-").isdigit():
            reasons.append(f"{c} '{row[c]}' is not a whole number")
    for c in t["reals"]:
        try:
            if row[c]:
                float(row[c])
        except ValueError:
            reasons.append(f"{c} '{row[c]}' is not a number")
    for c, ref in t["refs"].items():
        if row[c] and row[c] not in known[ref] and not (ref == "staff" and row[c] in NO_STAFF):
            reasons.append(f"unknown {c} '{row[c]}'")
    return reasons


def import_all(db_path=DB_PATH, seed_dir=SEED_DIR, reset=False):
    """Import every CSV; return one report dict per table, in load order."""
    db_path, seed_dir = Path(db_path), Path(seed_dir)
    if reset and db_path.exists():
        db_path.unlink()
    db = connect(db_path)
    known, report = {}, []
    try:
        for table, t in TABLES.items():
            existing = {"|".join(r) for r in db.execute(f"SELECT {', '.join(t['key'])} FROM {table}")}
            known[table] = existing if len(t["key"]) == 1 else set()
            r = dict(table=table, file=f"{table}.csv", inserted=0, present=0, rejected=[], ungraded=0)
            seen = set()
            insert = f"INSERT INTO {table} ({', '.join(t['cols'])}) VALUES ({', '.join('?' * len(t['cols']))})"
            with open(seed_dir / r["file"], newline="", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                missing = set(t["cols"]) - set(reader.fieldnames or [])
                if missing:
                    raise SystemExit(f"{r['file']}: missing columns {', '.join(sorted(missing))}")
                for row in reader:
                    row = {c: (row[c] or "").strip() for c in t["cols"]}
                    key = "|".join(row[c] for c in t["key"])
                    if key in seen:
                        r["rejected"].append((reader.line_num, f"duplicate {'/'.join(t['key'])} '{key}' in file"))
                        continue
                    seen.add(key)
                    if key in existing:
                        r["present"] += 1
                        continue
                    reasons = check(row, t, known)
                    if reasons:
                        r["rejected"].append((reader.line_num, "; ".join(reasons)))
                        continue
                    db.execute(insert, [None if v == "" else int(v) if c in t["ints"] else float(v) if c in t["reals"] else v
                                        for c, v in row.items()])
                    known[table].add(key)
                    r["inserted"] += 1
                    r["ungraded"] += table == "attempts" and not row["score"]
            report.append(r)
        db.commit()
    finally:
        db.close()
    return report


def print_report(report, out=sys.stdout):
    total = dict(inserted=0, present=0, rejected=0)
    for r in report:
        print(f"{r['file']:<18}{r['inserted']:>8} inserted{r['present']:>8} already present"
              f"{len(r['rejected']):>6} rejected", file=out)
        for line, reason in r["rejected"]:
            print(f"    line {line}: {reason}", file=out)
        if r["ungraded"]:
            print(f"    {r['ungraded']} attempts loaded ungraded (blank score)", file=out)
        total["inserted"] += r["inserted"]
        total["present"] += r["present"]
        total["rejected"] += len(r["rejected"])
    print(f"Total: {total['inserted']:,} inserted, {total['present']:,} already present, "
          f"{total['rejected']:,} rejected", file=out)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Import the seed CSVs into the BrightPath database.")
    parser.add_argument("--reset", action="store_true", help="wipe the database and import fresh")
    args = parser.parse_args(argv)
    print_report(import_all(reset=args.reset))


if __name__ == "__main__":
    main()
