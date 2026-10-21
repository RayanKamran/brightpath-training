"""Administrators manage learners and instructor assignments. Nothing here ever deletes a row."""
import sqlite3
from datetime import date, datetime

from flask import Blueprint, abort, flash, g, redirect, render_template, request, url_for
from werkzeug.security import generate_password_hash

import auth

bp = Blueprint("people", __name__, url_prefix="/admin")
PAGE_SIZE = 50
MIN_PASSWORD = 8
ROLES = ("lead", "co-instructor")


def today():
    return date.today().isoformat()


# --- rules shared by create, move and reactivate ------------------------------------------

def clients(db, client_id=None):
    """Clients with their active-learner count ('used'), or the one client asked for."""
    rows = db.execute(
        "SELECT c.client_id, c.name, c.seats, c.contract_end, COUNT(l.learner_id) AS used FROM clients c "
        "LEFT JOIN learners l ON l.client_id = c.client_id AND l.account_status = 'active' "
        "WHERE :id IS NULL OR c.client_id = :id GROUP BY c.client_id ORDER BY c.name", {"id": client_id}).fetchall()
    return rows if client_id is None else (rows[0] if rows else None)


def contract_ended(client):
    if client["contract_end"] and client["contract_end"] < today():
        return f"This client's contract ended on {client['contract_end']}."


def seat_warning(client, adding=0):
    used = client["used"] + adding
    if used > client["seats"]:
        return f"{client['name']} is using {used:,} of {client['seats']:,} seats."


def client_choices(db):
    """Template values for the client dropdown: all clients, and which ones can't be chosen."""
    rows = clients(db)
    return {"clients": rows, "ended_ids": {c["client_id"] for c in rows if contract_ended(c)}}


def departments(db):
    return [d for (d,) in db.execute("SELECT DISTINCT department FROM learners WHERE department IS NOT NULL "
                                     "ORDER BY department")]


def scoped_learner(db, learner_id):
    """The learner, if this administrator may see them; otherwise 404 (without saying whether they exist)."""
    learner = db.execute(
        "SELECT l.*, c.name AS client_name FROM learners l LEFT JOIN clients c USING (client_id) "
        "WHERE l.learner_id = :id AND (:scope IS NULL OR l.client_id = :scope)",
        {"id": learner_id, "scope": auth.client_scope()}).fetchone()
    if learner is None:
        abort(404)
    return learner


def log(db, learner_id, field, old, new):
    db.execute("INSERT INTO learner_history (learner_id, field, old, new, changed_by, changed_at) "
               "VALUES (?, ?, ?, ?, ?, ?)",
               (learner_id, field, old, new, g.user["id"], datetime.now().isoformat(" ", "minutes")))


def flash_warning(db, client_id):
    warning = client_id and seat_warning(clients(db, client_id))
    if warning:
        flash(warning)


def brightpath_only():
    if auth.client_scope():
        abort(403)


# --- learners -------------------------------------------------------------------------------

@bp.route("/learners")
@auth.role_required("administrator")
def learners():
    db = auth.get_db()
    q = request.args.get("q", "").strip()
    page = max(request.args.get("page", 1, type=int), 1)
    where = ("(:scope IS NULL OR l.client_id = :scope) "
             "AND (:q = '' OR l.full_name LIKE :like OR l.email LIKE :like)")
    params = {"scope": auth.client_scope(), "q": q, "like": f"%{q}%"}
    total = db.execute(f"SELECT COUNT(*) FROM learners l WHERE {where}", params).fetchone()[0]
    rows = db.execute(
        f"SELECT l.learner_id, l.full_name, l.email, l.department, l.account_status, c.name AS client_name "
        f"FROM learners l LEFT JOIN clients c USING (client_id) WHERE {where} "
        f"ORDER BY l.full_name, l.learner_id LIMIT :limit OFFSET :offset",
        {**params, "limit": PAGE_SIZE, "offset": (page - 1) * PAGE_SIZE}).fetchall()
    return render_template("learners.html", rows=rows, q=q, page=page, total=total,
                           pages=max((total + PAGE_SIZE - 1) // PAGE_SIZE, 1))


@bp.route("/learners/new", methods=["GET", "POST"])
@auth.role_required("administrator")
def learner_new():
    db, scope, form = auth.get_db(), auth.client_scope(), request.form
    error = None
    if request.method == "POST":
        client_id = form.get("client_id", scope) or None
        if scope and client_id != scope:
            abort(403)
        name, email = form.get("full_name", "").strip(), form.get("email", "").strip()
        department, password = form.get("department") or None, form.get("password", "")
        client = client_id and clients(db, client_id)
        if not name or "@" not in email:
            error = "Enter a name and a valid email."
        elif len(password) < MIN_PASSWORD:
            error = f"The starting password must be at least {MIN_PASSWORD} characters."
        elif department and department not in departments(db):
            error = "Choose a department from the list."
        elif client_id and not client:
            error = "Choose a client from the list."
        elif client and contract_ended(client):
            error = contract_ended(client)
        elif auth.find_by_email(db, email):
            error = "Someone already uses that email."
        else:
            learner_id = str(db.execute("SELECT COALESCE(MAX(CAST(learner_id AS INTEGER)), 0) + 1 "
                                        "FROM learners").fetchone()[0])
            db.execute("INSERT INTO learners (learner_id, full_name, email, client_id, department, "
                       "account_created_on, created_by, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')",
                       (learner_id, name, email, client_id, department, today(), g.user["id"]))
            db.execute("INSERT INTO passwords (email, hash) VALUES (?, ?)",
                       (email.lower(), generate_password_hash(password)))
            log(db, learner_id, "created", None,
                f"{client['name'] if client else 'no client'}, {department or 'no department'}")
            db.commit()
            flash(f"{name} created.")
            flash_warning(db, client_id)
            return redirect(url_for("people.learner", learner_id=learner_id))
    own = scope and clients(db, scope)
    return render_template("learner_new.html", error=error, form=form, departments=departments(db), own=own,
                           warning=own and (contract_ended(own) or seat_warning(own, adding=1)),
                           **({"clients": None} if scope else client_choices(db)))


@bp.route("/learners/<learner_id>")
@auth.role_required("administrator")
def learner(learner_id):
    db = auth.get_db()
    row = scoped_learner(db, learner_id)
    history = db.execute("SELECT h.*, s.full_name AS by_name FROM learner_history h "
                         "LEFT JOIN staff s ON s.staff_id = h.changed_by WHERE h.learner_id = ? "
                         "ORDER BY h.id DESC", (learner_id,)).fetchall()
    return render_template("learner.html", learner=row, history=history, departments=departments(db),
                           **({"clients": None} if auth.client_scope() else client_choices(db)))


@bp.route("/learners/<learner_id>/placement", methods=["POST"])
@auth.role_required("administrator")
def learner_placement(learner_id):
    db, scope = auth.get_db(), auth.client_scope()
    row = scoped_learner(db, learner_id)
    client_id = request.form.get("client_id", scope or row["client_id"]) or None
    if scope and client_id != scope:
        abort(403)
    department = request.form.get("department") or None
    client = client_id and clients(db, client_id)
    error = None
    if department and department not in departments(db):
        error = "Choose a department from the list."
    elif client_id and not client:
        error = "Choose a client from the list."
    elif client_id != row["client_id"] and client and contract_ended(client):
        error = contract_ended(client)
    if error:
        flash(error)
        return redirect(url_for("people.learner", learner_id=learner_id))
    if client_id != row["client_id"]:
        db.execute("UPDATE learners SET client_id = ? WHERE learner_id = ?", (client_id, learner_id))
        log(db, learner_id, "client", row["client_name"] or "no client", client["name"] if client else "no client")
    if department != row["department"]:
        db.execute("UPDATE learners SET department = ? WHERE learner_id = ?", (department, learner_id))
        log(db, learner_id, "department", row["department"] or "no department", department or "no department")
    db.commit()
    if client_id != row["client_id"] and row["account_status"] == "active":
        flash_warning(db, client_id)
    return redirect(url_for("people.learner", learner_id=learner_id))


@bp.route("/learners/<learner_id>/status", methods=["POST"])
@auth.role_required("administrator")
def learner_status(learner_id):
    db = auth.get_db()
    row = scoped_learner(db, learner_id)
    action, status = request.form.get("action"), row["account_status"]
    if action == "deactivate" and status == "active":
        new = "deactivated"
    elif action == "reactivate" and status == "deactivated":
        client = row["client_id"] and clients(db, row["client_id"])
        if client and contract_ended(client):
            flash(contract_ended(client))
            return redirect(url_for("people.learner", learner_id=learner_id))
        new = "active"
    else:
        abort(400)
    db.execute("UPDATE learners SET account_status = ? WHERE learner_id = ?", (new, learner_id))
    log(db, learner_id, "status", status, new)
    db.commit()
    if new == "active":
        flash_warning(db, row["client_id"])
    return redirect(url_for("people.learner", learner_id=learner_id))


# --- instructors on cohorts (BrightPath administrators only) ------------------------------

def current_instructors(db):
    return db.execute("SELECT staff_id, full_name FROM staff WHERE role = 'instructor' "
                      "AND (left_on IS NULL OR left_on >= ?) ORDER BY full_name", (today(),)).fetchall()


@bp.route("/cohorts")
@auth.role_required("administrator")
def cohorts():
    brightpath_only()
    db = auth.get_db()
    current = {}
    for r in db.execute("SELECT cs.course_id, cs.role, s.full_name FROM course_staff cs JOIN staff s USING (staff_id) "
                        "WHERE cs.unassigned_on IS NULL ORDER BY cs.role DESC, s.full_name"):
        current.setdefault(r["course_id"], []).append(f"{r['full_name']} ({r['role']})")
    courses = db.execute("SELECT course_id, title, cohort FROM courses ORDER BY title, starts_on").fetchall()
    return render_template("cohorts.html", courses=courses, current=current)


def render_cohort(db, course_id, confirm=None):
    course = db.execute("SELECT * FROM courses WHERE course_id = ?", (course_id,)).fetchone()
    if course is None:
        abort(404)
    rows = db.execute("SELECT cs.*, s.full_name FROM course_staff cs JOIN staff s USING (staff_id) "
                      "WHERE cs.course_id = ? ORDER BY cs.assigned_on DESC, cs.role", (course_id,)).fetchall()
    return render_template("cohort.html", course=course, rows=rows, instructors=current_instructors(db),
                           roles=ROLES, today=today(), confirm=confirm)


@bp.route("/cohorts/<course_id>")
@auth.role_required("administrator")
def cohort(course_id):
    brightpath_only()
    return render_cohort(auth.get_db(), course_id)


def valid_date(value):
    try:
        return date.fromisoformat(value).isoformat()
    except (TypeError, ValueError):
        return None


@bp.route("/cohorts/<course_id>/assign", methods=["POST"])
@auth.role_required("administrator")
def assign(course_id):
    brightpath_only()
    db, form = auth.get_db(), request.form
    staff_id, role, on = form.get("staff_id"), form.get("role"), valid_date(form.get("on"))
    if role not in ROLES or not on:
        abort(400)
    names = {r["staff_id"]: r["full_name"] for r in current_instructors(db)}
    old_lead = role == "lead" and db.execute(
        "SELECT cs.staff_id, cs.assigned_on, s.full_name FROM course_staff cs JOIN staff s USING (staff_id) "
        "WHERE cs.course_id = ? AND cs.role = 'lead' AND cs.unassigned_on IS NULL", (course_id,)).fetchone()
    error = None
    if staff_id not in names:
        error = "Choose a current instructor."
    elif db.execute("SELECT 1 FROM course_staff WHERE course_id = ? AND staff_id = ? AND role = ? "
                    "AND unassigned_on IS NULL", (course_id, staff_id, role)).fetchone():
        error = f"{names[staff_id]} is already a current {role} on this cohort."
    elif old_lead and on < old_lead["assigned_on"]:
        error = f"The new lead can't start before {old_lead['full_name']} did ({old_lead['assigned_on']})."
    if error:
        flash(error)
        return redirect(url_for("people.cohort", course_id=course_id))
    if old_lead and not form.get("confirm"):
        return render_cohort(db, course_id, confirm=dict(
            message=f"This will take {old_lead['full_name']} off as lead from {on}.",
            staff_id=staff_id, role=role, on=on))
    try:
        if old_lead:
            db.execute("UPDATE course_staff SET unassigned_on = ? WHERE course_id = ? AND staff_id = ? "
                       "AND assigned_on = ?", (on, course_id, old_lead["staff_id"], old_lead["assigned_on"]))
        db.execute("INSERT INTO course_staff (course_id, staff_id, role, assigned_on) VALUES (?, ?, ?, ?)",
                   (course_id, staff_id, role, on))
        db.commit()
        flash(f"{names[staff_id]} assigned as {role} from {on}.")
    except sqlite3.IntegrityError:
        db.rollback()
        flash(f"{names[staff_id]} already has an assignment on this cohort starting {on}.")
    return redirect(url_for("people.cohort", course_id=course_id))


@bp.route("/cohorts/<course_id>/unassign", methods=["POST"])
@auth.role_required("administrator")
def unassign(course_id):
    brightpath_only()
    db, form = auth.get_db(), request.form
    on = valid_date(form.get("on"))
    row = db.execute("SELECT cs.assigned_on, s.full_name FROM course_staff cs JOIN staff s USING (staff_id) "
                     "WHERE cs.course_id = ? AND cs.staff_id = ? AND cs.assigned_on = ? AND cs.unassigned_on IS NULL",
                     (course_id, form.get("staff_id"), form.get("assigned_on"))).fetchone()
    if not row or not on:
        abort(400)
    if on < row["assigned_on"]:
        flash(f"{row['full_name']} can't be taken off before they were assigned ({row['assigned_on']}).")
    else:
        db.execute("UPDATE course_staff SET unassigned_on = ? WHERE course_id = ? AND staff_id = ? AND assigned_on = ?",
                   (on, course_id, form.get("staff_id"), row["assigned_on"]))
        db.commit()
        flash(f"{row['full_name']} taken off from {on}.")
    return redirect(url_for("people.cohort", course_id=course_id))
