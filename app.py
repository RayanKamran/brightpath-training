from contextlib import closing

from flask import Flask, render_template

import importer

app = Flask(__name__)


@app.route("/")
def index():
    with closing(importer.connect()) as db:
        counts = [(t, db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]) for t in importer.TABLES]
    return render_template("index.html", counts=counts)
