# BrightPath training platform

Needs Python 3.11 or newer.

## Start the app

```
python run.py
```

This one command creates `.venv`, installs what's needed, imports the CSVs from
`data/seed/` into `instance/brightpath.db`, and starts the app at
http://127.0.0.1:5000. Stop it with Ctrl+C.

The import is insert-only: rows already in the database are left alone, so
running it again creates no duplicates and keeps changes made in the app.

## Signing in

Your username is your email address. Everyone imported from the CSVs starts
with the password **`brightpath`** (stored hashed). Example accounts:

| Role | Email |
|---|---|
| BrightPath administrator | `imran.doyle@brightpath.example` |
| Client administrator (Harbour Bank) | `pablo.kowalski@harbourbank.example` |
| Instructor | `priya.varma@brightpath.example` |
| Learner | `ayesha.farooq.391@example.com` |

Learners whose account is deactivated, and staff whose `left_on` date has
passed, cannot sign in. Each role has its own home page (`/admin`,
`/instructor`, `/learner`); other roles' pages are refused by the server.
BrightPath administrators can see table row counts at `/admin/data`.

Administrators manage learners at `/admin/learners` (create, place in a client
and department, deactivate, reactivate; every change is kept in the learner's
history). Client administrators only ever see their own client's learners.
BrightPath administrators assign instructors to cohorts at `/admin/cohorts`.
Nothing is ever deleted.

Instructors build pages (text, images, PDFs) in the cohorts they teach at
`/teach/<cohort>` and can create new cohorts; cohorts and pages stay drafts
until published. Learners read published pages of their cohorts at
`/learn/<cohort>`. Uploaded files are kept in `instance/uploads/`.

## Import only

```
python importer.py
```

Prints, for each CSV, how many rows were inserted, already present and
rejected, with the line number and reason for every rejected row.

## Start fresh

```
python run.py --reset
```

Wipes the database, imports everything again and starts the app.
`python importer.py --reset` does the same without starting the app.

## Tests

```
.venv/Scripts/python -m unittest discover tests     (Windows)
.venv/bin/python -m unittest discover tests         (macOS/Linux)
```
