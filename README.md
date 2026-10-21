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
python -m unittest discover tests
```
