"""Who is signed in, and what their role lets them see."""
import sqlite3
from datetime import date
from functools import wraps

from flask import abort, current_app, g, redirect, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

import importer

DEFAULT_PASSWORD = "brightpath"
WRONG = "Wrong email or password"
DEACTIVATED = "Your account has been deactivated. Contact your administrator."
# Checked against for unknown emails, so timing doesn't reveal which accounts exist.
_DUMMY_HASH = generate_password_hash("no-such-account")

# Staff and learners as one list of people who can sign in. Staff whose left_on has passed are inactive.
_PEOPLE = """
    SELECT 'staff' AS kind, staff_id AS id, full_name AS name, email, role, client_id,
           (left_on IS NULL OR left_on >= :today) AS active FROM staff
    UNION ALL
    SELECT 'learner', learner_id, full_name, email, 'learner', client_id,
           account_status = 'active' FROM learners
"""


def connect(db_path):
    db = importer.connect(db_path)
    db.row_factory = sqlite3.Row
    db.execute("CREATE TABLE IF NOT EXISTS passwords (email TEXT PRIMARY KEY, hash TEXT NOT NULL)")
    return db


def get_db():
    if "db" not in g:
        g.db = connect(current_app.config["DB_PATH"])
    return g.db


def seed_default_passwords(db):
    """Give every person without a password the default one. Never overwrites a changed password."""
    # shortcut: imported accounts share one salted hash of the public default password; a changed
    # password gets its own salt. Hashing 28k passwords one by one would take minutes on every import.
    h = generate_password_hash(DEFAULT_PASSWORD)
    db.execute("INSERT OR IGNORE INTO passwords SELECT lower(email), ? FROM staff "
               "UNION SELECT lower(email), ? FROM learners", (h, h))
    db.commit()


def _find(db, where, **params):
    return db.execute(f"SELECT * FROM ({_PEOPLE}) WHERE {where}",
                      dict(params, today=date.today().isoformat())).fetchone()


def check_sign_in(db, email, password):
    """Return (user, None) on success, or (None, message to show)."""
    email = email.strip().lower()
    user = _find(db, "lower(email) = :email", email=email)
    row = user and db.execute("SELECT hash FROM passwords WHERE email = ?", (email,)).fetchone()
    if not check_password_hash(row["hash"] if row else _DUMMY_HASH, password) or not row:
        return None, WRONG
    if not user["active"]:
        return None, DEACTIVATED
    return user, None


def load_signed_in_user():
    """Before every request: put the signed-in user in g.user, signing out anyone no longer active."""
    g.user = None
    if "user" in session:
        kind, id_ = session["user"]
        user = _find(get_db(), "kind = :kind AND id = :id", kind=kind, id=id_)
        if user and user["active"]:
            g.user = user
        else:
            session.clear()


def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if g.user is None:
                return redirect(url_for("signin"))
            if g.user["role"] not in roles:
                abort(403)
            return view(*args, **kwargs)
        return wrapped
    return decorator


def client_scope():
    """The client an administrator is limited to, or None for a BrightPath administrator."""
    return g.user["client_id"]
