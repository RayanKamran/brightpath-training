import secrets
from datetime import date

from flask import Flask, abort, flash, g, redirect, render_template, request, session, url_for

import auth
import courses
import importer
import people

HOMES = {"administrator": "admin_home", "instructor": "instructor_home", "learner": "learner_home"}


def secret_key():
    """Kept in instance/ so sessions survive a restart."""
    path = importer.DB_PATH.parent / "secret_key"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(secrets.token_hex(32))
    return path.read_text()


app = Flask(__name__)
app.config.update(DB_PATH=importer.DB_PATH, UPLOAD_DIR=importer.DB_PATH.parent / "uploads",
                  SECRET_KEY=secret_key(), SESSION_COOKIE_SAMESITE="Lax",
                  MAX_CONTENT_LENGTH=courses.MAX_FILE_BYTES + 64 * 1024)  # one file plus the form fields
app.before_request(auth.check_csrf)
app.before_request(auth.load_signed_in_user)
app.jinja_env.globals["csrf_token"] = auth.csrf_token
app.register_blueprint(people.bp)
app.register_blueprint(courses.bp)


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@app.errorhandler(413)
def too_large(exc):
    flash(f"That file is larger than {courses.MAX_FILE_MB} MB.")
    return redirect(request.referrer or url_for("index"))


@app.errorhandler(403)
def forbidden(exc):
    return render_template("403.html"), 403


@app.route("/")
def index():
    return redirect(url_for(HOMES[g.user["role"]] if g.user else "signin"))


@app.route("/signin", methods=["GET", "POST"])
def signin():
    error = None
    if request.method == "POST":
        user, error = auth.check_sign_in(auth.get_db(), request.form.get("email", ""),
                                         request.form.get("password", ""))
        if user:
            session.clear()
            session["user"] = [user["kind"], user["id"]]
            return redirect(url_for(HOMES[user["role"]]))
    return render_template("signin.html", error=error, email=request.form.get("email", ""))


@app.route("/signout", methods=["POST"])
def signout():
    session.clear()
    return redirect(url_for("signin"))


@app.route("/admin")
@auth.role_required("administrator")
def admin_home():
    db, scope = auth.get_db(), auth.client_scope()
    client = db.execute("SELECT name FROM clients WHERE client_id = ?", (scope,)).fetchone()["name"] \
        if scope else "BrightPath"
    learners = db.execute("SELECT COUNT(*) FROM learners WHERE :c IS NULL OR client_id = :c",
                          {"c": scope}).fetchone()[0]
    return render_template("home_admin.html", client=client, learners=learners)


@app.route("/admin/data")
@auth.role_required("administrator")
def admin_data():
    if auth.client_scope():
        abort(403)
    db = auth.get_db()
    counts = [(t, db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]) for t in importer.TABLES]
    return render_template("data.html", counts=counts)


@app.route("/instructor")
@auth.role_required("instructor")
def instructor_home():
    # Same rule as auth.teaches: every cohort listed here is one they can edit.
    cohorts = auth.get_db().execute(
        "SELECT c.course_id, c.title, c.cohort, cs.role, COALESCE(s.status, 'published') AS status "
        "FROM course_staff cs JOIN courses c USING (course_id) LEFT JOIN course_status s USING (course_id) "
        "WHERE cs.staff_id = ? AND (cs.unassigned_on IS NULL OR cs.unassigned_on > ?) "
        "ORDER BY c.starts_on, c.title", (g.user["id"], date.today().isoformat())).fetchall()
    return render_template("home_instructor.html", cohorts=cohorts)


@app.route("/learner")
@auth.role_required("learner")
def learner_home():
    enrolments = auth.get_db().execute(
        "SELECT c.course_id, c.title, c.cohort, e.outcome, COALESCE(s.status, 'published') AS status "
        "FROM enrolments e JOIN courses c USING (course_id) LEFT JOIN course_status s USING (course_id) "
        "WHERE e.learner_id = ? ORDER BY c.starts_on, c.title", (g.user["id"],)).fetchall()
    return render_template("home_learner.html", enrolments=enrolments)
