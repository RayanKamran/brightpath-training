"""Getting learners onto cohorts and off them. Nothing is deleted: a withdrawal keeps the enrolment as a record."""
from datetime import date, datetime

from flask import Blueprint, abort, flash, g, redirect, render_template, request, url_for

import auth
import courses
from courses import WITHDRAWN

bp = Blueprint("enrolment", __name__)
# SQL (enrolments e, courses c, param :today): still in progress — not withdrawn, no final outcome yet, and the
# cohort hasn't ended (an unfinished run on an ended cohort must not block a retake).
ACTIVE = (f"(NOT {WITHDRAWN} AND COALESCE(e.outcome, '') NOT IN ('Pass', 'Fail', 'Distinction') "
          f"AND c.ends_on >= :today)")


def today():
    return date.today().isoformat()


def open_cohorts(db):
    """Published cohorts that haven't ended: the only ones anyone can enrol in."""
    return db.execute("SELECT c.course_id, c.title, c.cohort, c.starts_on, c.ends_on FROM courses c "
                      "LEFT JOIN course_status s USING (course_id) WHERE COALESCE(s.status, 'published') = 'published' "
                      "AND c.ends_on >= ? ORDER BY c.title, c.starts_on", (today(),)).fetchall()


def enrol(db, learner_id, course_id, by):
    """Enrol a learner, by 'self' or a staff id. Returns (enrolment_id, None) or (None, reason)."""
    cohort = courses.cohort_row(db, course_id)
    learner = db.execute("SELECT full_name, account_status FROM learners WHERE learner_id = ?",
                         (learner_id,)).fetchone()
    if cohort is None or learner is None:
        abort(404)
    name = f"{cohort['title']} — {cohort['cohort']}"
    if cohort["status"] != "published":
        return None, f"{name} isn't open for enrolment."
    if cohort["ends_on"] < today():
        return None, f"{name} ended on {cohort['ends_on']}, so it's closed to new enrolments."
    if learner["account_status"] != "active":
        return None, f"{learner['full_name']}'s account is deactivated."
    if db.execute("SELECT 1 FROM enrolments WHERE learner_id = ? AND course_id = ?", (learner_id, course_id)).fetchone():
        return None, f"{learner['full_name']} already has an enrolment on {name}, which stays as their record."
    current = db.execute(f"SELECT c.cohort FROM enrolments e JOIN courses c USING (course_id) "
                         f"WHERE e.learner_id = :learner AND c.title = :title AND {ACTIVE}",
                         {"learner": learner_id, "title": cohort["title"], "today": today()}).fetchone()
    if current:
        return None, (f"{learner['full_name']} is already taking {cohort['title']} — {current['cohort']}; "
                      f"finish or withdraw from it first.")
    previous = db.execute("SELECT COUNT(*) FROM enrolments e JOIN courses c USING (course_id) "
                          "WHERE e.learner_id = ? AND c.title = ?", (learner_id, cohort["title"])).fetchone()[0]
    number = db.execute("SELECT COALESCE(MAX(CAST(SUBSTR(enrolment_id, 2) AS INTEGER)), 0) + 1 FROM enrolments "
                        "WHERE enrolment_id LIKE 'E%'").fetchone()[0]
    enrolment_id = f"E{number:06d}"
    db.execute("INSERT INTO enrolments (enrolment_id, learner_id, course_id, enrolled_on, outcome, previous_attempts, "
               "activity_clicks, enrolled_by) VALUES (?, ?, ?, ?, 'In progress', ?, 0, ?)",
               (enrolment_id, learner_id, course_id, today(), previous, by))
    db.commit()
    return enrolment_id, None


def withdraw(db, enrolment_id, by):
    """Withdraw an active enrolment, recording when and by whom. Returns an error message or None."""
    row = runs(db, "e.enrolment_id = :id", id=enrolment_id)[0]
    if not row["active"]:
        return "Only an enrolment that is still in progress can be withdrawn."
    db.execute("UPDATE enrolments SET outcome = 'Withdrawn', withdrawn_on = ? WHERE enrolment_id = ?",
               (today(), enrolment_id))
    db.execute("INSERT INTO withdrawals (enrolment_id, withdrawn_by, withdrawn_at) VALUES (?, ?, ?)",
               (enrolment_id, by, datetime.now().isoformat(" ", "minutes")))
    db.commit()


def runs(db, where, **params):
    """Enrolments with who enrolled/withdrew them, ready to show. Imported withdrawals show 'imported'."""
    return db.execute(
        f"SELECT e.*, c.title, c.cohort, c.starts_on, COALESCE(cs.status, 'published') AS cohort_status, "
        f"l.full_name AS learner_name, "
        f"CASE WHEN e.enrolled_by = 'self' THEN 'self' ELSE COALESCE(sb.full_name, e.enrolled_by) END AS enrolled_by_name, "
        f"{WITHDRAWN} AS withdrawn, {ACTIVE} AS active, "
        f"CASE WHEN w.withdrawn_by IS NULL THEN 'imported' WHEN w.withdrawn_by = 'self' THEN 'self' "
        f"ELSE COALESCE(wb.full_name, w.withdrawn_by) END AS withdrawn_by_name "
        f"FROM enrolments e JOIN courses c USING (course_id) LEFT JOIN course_status cs USING (course_id) "
        f"JOIN learners l USING (learner_id) "
        f"LEFT JOIN staff sb ON sb.staff_id = e.enrolled_by "
        f"LEFT JOIN withdrawals w USING (enrolment_id) LEFT JOIN staff wb ON wb.staff_id = w.withdrawn_by "
        f"WHERE {where} ORDER BY c.starts_on, c.title, l.full_name", {**params, "today": today()}).fetchall()


# --- learners ---------------------------------------------------------------------------------

@bp.route("/courses")
@auth.role_required("learner")
def catalogue():
    db = auth.get_db()
    mine = runs(db, "e.learner_id = :me", me=g.user["id"])
    enrolled = {r["course_id"] for r in mine}
    taking = {r["title"]: r["cohort"] for r in mine if r["active"]}
    return render_template("catalogue.html", cohorts=open_cohorts(db), enrolled=enrolled, taking=taking)


@bp.route("/courses/<course_id>/enrol", methods=["POST"])
@auth.role_required("learner")
def self_enrol(course_id):
    db = auth.get_db()
    enrolment_id, error = enrol(db, g.user["id"], course_id, "self")
    if error:
        flash(error)
        return redirect(url_for("enrolment.catalogue"))
    cohort = courses.cohort_row(db, course_id)
    flash(f"You are enrolled on {cohort['title']} — {cohort['cohort']}.")
    return redirect(url_for("learner_home"))


@bp.route("/enrolments/<enrolment_id>/withdraw", methods=["GET", "POST"])
@auth.role_required("learner")
def self_withdraw(enrolment_id):
    db = auth.get_db()
    rows = runs(db, "e.enrolment_id = :id AND e.learner_id = :me", id=enrolment_id, me=g.user["id"])
    if not rows:
        abort(404)
    if request.method == "POST":
        flash(withdraw(db, enrolment_id, "self") or f"You have withdrawn from {rows[0]['title']} — {rows[0]['cohort']}.")
        return redirect(url_for("learner_home"))
    return render_template("withdraw_confirm.html", run=rows[0])


# --- administrators (client admins only reach their own client's learners) ------------------

def scoped_learner_id(learner_id):
    scope = auth.client_scope()
    row = auth.get_db().execute("SELECT client_id FROM learners WHERE learner_id = ?", (learner_id,)).fetchone()
    if row is None or (scope and row["client_id"] != scope):
        abort(404)
    return learner_id


@bp.route("/admin/learners/<learner_id>/enrol", methods=["POST"])
@auth.role_required("administrator")
def admin_enrol(learner_id):
    scoped_learner_id(learner_id)
    db = auth.get_db()
    enrolment_id, error = enrol(db, learner_id, request.form.get("course_id", ""), g.user["id"])
    flash(error or "Enrolled.")
    return redirect(url_for("people.learner", learner_id=learner_id))


@bp.route("/admin/enrolments/<enrolment_id>/withdraw", methods=["POST"])
@auth.role_required("administrator")
def admin_withdraw(enrolment_id):
    db = auth.get_db()
    row = db.execute("SELECT learner_id FROM enrolments WHERE enrolment_id = ?", (enrolment_id,)).fetchone()
    if row is None:
        abort(404)
    scoped_learner_id(row["learner_id"])
    flash(withdraw(db, enrolment_id, g.user["id"]) or "Withdrawn.")
    return redirect(url_for("people.learner", learner_id=row["learner_id"]))


# --- instructors: who is on their cohort -----------------------------------------------------

@bp.route("/teach/<course_id>/learners")
@auth.role_required("instructor")
def roster(course_id):
    cohort = courses.teaching_cohort(course_id)
    # shortcut: the whole roster on one page (a cohort has under 2,000 enrolments); page it if that grows.
    return render_template("roster.html", cohort=cohort, rows=runs(auth.get_db(), "e.course_id = :c", c=course_id))
