"""The one command: set up .venv, install requirements, import the CSVs, give new people the
default password, start the app.

Usage: python run.py [--reset]
"""
import os
import subprocess
import sys
import venv
from pathlib import Path

ROOT = Path(__file__).parent
VENV = ROOT / ".venv"
VENV_PYTHON = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

if Path(sys.prefix).resolve() != VENV.resolve():
    if not VENV_PYTHON.exists():
        print("Creating .venv ...")
        venv.create(VENV, with_pip=True)
    subprocess.check_call([str(VENV_PYTHON), "-m", "pip", "install", "-q", "--disable-pip-version-check",
                           "-r", str(ROOT / "requirements.txt")])
    sys.exit(subprocess.call([str(VENV_PYTHON), __file__, *sys.argv[1:]]))

from contextlib import closing  # noqa: E402

import auth  # noqa: E402
import importer  # noqa: E402

importer.main(sys.argv[1:])
with closing(auth.connect(importer.DB_PATH)) as db:
    auth.seed_default_passwords(db)

from app import app  # noqa: E402

app.run(host="127.0.0.1", port=5000)
