"""Two fixed reports, each with a CSV download: completion by client and department (administrators), and
results per cohort (instructors). Every query is limited to what the viewer may see."""
import csv
import io
from datetime import date

from flask import Blueprint, Response, abort, g, render_template, request

import auth
from courses import WITHDRAWN

bp = Blueprint("reports", __name__)
OUTCOMES = ("Pass", "Distinction", "Fail", "Withdrawn", "In progress")
PAGE_SIZE = 100


def pct(counts):
    """Completion % = (Pass + Distinction) / (Pass + Distinction + Fail + Withdrawn); in progress is left out."""
    done = counts["Pass"] + counts["Distinction"]
    finished = done + counts["Fail"] + counts["Withdrawn"]
    return f"{100 * done / finished:.1f}%" if finished else "—"


def csv_response(filename, rows):
    out = io.StringIO()
    # A leading ' stops a cell such as =HYPERLINK(...) running as a formula when opened in a spreadsheet.
    csv.writer(out).writerows([["'" + v if v[:1] in ("=", "+", "-", "@") else v for v in map(str, row)]
                               for row in rows])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# --- completion by client and department (administrators) -----------------------------------

def completion(db, scope, course):
    """Rows for the completion report: a grand total (BrightPath admins only), then each client's total followed
    by its departments. Counts are of enrolments; scope limits it to one client, course to one course title."""
    groups = db.execute(
        f"SELECT l.client_id, cl.name AS client, l.department, x.outcome, COUNT(*) AS n FROM ("
        f"  SELECT e.learner_id, CASE WHEN {WITHDRAWN} THEN 'Withdrawn' "
        f"    WHEN e.outcome IN ('Pass', 'Distinction', 'Fail') THEN e.outcome ELSE 'In progress' END AS outcome "
        f"  FROM enrolments e JOIN courses c USING (course_id) WHERE :course IS NULL OR c.title = :course) x "
        f"JOIN learners l USING (learner_id) LEFT JOIN clients cl ON cl.client_id = l.client_id "
        f"WHERE :scope IS NULL OR l.client_id = :scope GROUP BY l.client_id, l.department, x.outcome",
        {"scope": scope, "course": course}).fetchall()

    def row(level, label, client="", department=""):
        return {"level": level, "label": label, "client": client, "department": department,
                "counts": dict.fromkeys(OUTCOMES, 0)}

    total, clients = row("total", "All clients", "All clients"), {}
    for g_ in groups:
        name = g_["client"] or "No client"
        client = clients.setdefault(g_["client_id"], (row("client", name, name), {}))
        dept_name = g_["department"] or "No department"
        dept = client[1].setdefault(dept_name, row("department", f"{name} / {dept_name}", name, dept_name))
        for r in (total, client[0], dept):
            r["counts"][g_["outcome"]] += g_["n"]
    ordered = [] if scope else [total]
    for client_id in sorted(clients, key=lambda c: (c is None, clients[c][0]["label"])):
        client_row, depts = clients[client_id]
        ordered.append(client_row)
        ordered += [depts[d] for d in sorted(depts, key=lambda d: (d == "No department", d))]
    for r in ordered:
        r["enrolments"], r["pct"] = sum(r["counts"].values()), pct(r["counts"])
    return ordered


def completion_csv_rows(rows):
    return [["Client", "Department", "Enrolments", *OUTCOMES, "Completion %"]] + [
        [r["client"], r["department"], r["enrolments"], *(r["counts"][o] for o in OUTCOMES), r["pct"]] for r in rows]


def completion_args():
    db = auth.get_db()
    titles = [t for (t,) in db.execute("SELECT DISTINCT title FROM courses ORDER BY title")]
    course = request.args.get("course") or None
    if course and course not in titles:
        abort(404)
    return db, titles, course


@bp.route("/admin/reports/completion")
@auth.role_required("administrator")
def completion_page():
    db, titles, course = completion_args()
    return render_template("completion.html", rows=completion(db, auth.client_scope(), course), titles=titles,
                           course=course, outcomes=OUTCOMES)


@bp.route("/admin/reports/completion/csv")
@auth.role_required("administrator")
def completion_csv():
    db, _, course = completion_args()
    rows = completion(db, auth.client_scope(), course)
    slug = (course or "all").lower().replace(" ", "-")
    return csv_response(f"completion-{slug}-{date.today().isoformat()}.csv", completion_csv_rows(rows))


# --- results per cohort (instructors) ---------------------------------------------------------

def results(db, course_id):
    """Every enrolment on the cohort with its best score on each assessment (drafts included)."""
    assessments = db.execute("SELECT assessment_id, title, type, status FROM assessments WHERE course_id = ? "
                             "ORDER BY due_on IS NULL, due_on, CAST(assessment_id AS INTEGER)", (course_id,)).fetchall()
    cells = {}
    for c in db.execute("SELECT t.learner_id, t.assessment_id, MAX(t.score) AS best, SUM(t.score IS NULL) AS unmarked, "
                        "MAX(a.due_on IS NOT NULL AND t.submitted_on > a.due_on) AS late "
                        "FROM attempts t JOIN assessments a USING (assessment_id) WHERE a.course_id = ? "
                        "GROUP BY t.learner_id, t.assessment_id", (course_id,)):
        cells[c["learner_id"], c["assessment_id"]] = c
    rows = []
    for e in db.execute("SELECT e.learner_id, l.full_name, l.email, e.previous_attempts, e.outcome, e.withdrawn_on "
                        "FROM enrolments e JOIN learners l USING (learner_id) WHERE e.course_id = ? "
                        "ORDER BY l.full_name, e.enrolment_id", (course_id,)):
        mine = [cells.get((e["learner_id"], a["assessment_id"])) for a in assessments]
        best = [c["best"] for c in mine if c and c["best"] is not None]
        rows.append({"name": e["full_name"], "email": e["email"], "attempt": (e["previous_attempts"] or 0) + 1,
                     "outcome": e["outcome"], "withdrawn_on": e["withdrawn_on"] or "",
                     "cells": [cell_text(c) for c in mine],
                     "average": round(sum(best) / len(best)) if best else None,
                     "attempted": sum(c is not None for c in mine)})
    return {"assessments": assessments, "rows": rows}


def cell_text(c):
    if c is None:
        return ""
    text = str(c["best"]) if c["best"] is not None else "unmarked"
    return text + " (late)" if c["late"] else text


def results_csv_rows(result):
    n = len(result["assessments"])
    return [["Learner", "Email", "Attempt", "Outcome", "Withdrawn on",
             *(f"{a['title']} ({a['assessment_id']})" for a in result["assessments"]),
             "Average", "Attempted", "Assessments"]] + [
        [r["name"], r["email"], r["attempt"], r["outcome"], r["withdrawn_on"], *r["cells"],
         "" if r["average"] is None else r["average"], r["attempted"], n] for r in result["rows"]]


def taught_cohort(course_id):
    """The cohort, if the signed-in instructor teaches or taught it (any assignment, current or past)."""
    db = auth.get_db()
    cohort = db.execute("SELECT * FROM courses WHERE course_id = ?", (course_id,)).fetchone()
    if cohort is None:
        abort(404)
    if not db.execute("SELECT 1 FROM course_staff WHERE course_id = ? AND staff_id = ?",
                      (course_id, g.user["id"])).fetchone():
        abort(403)
    return cohort


@bp.route("/teach/results")
@auth.role_required("instructor")
def results_index():
    cohorts = auth.get_db().execute(
        "SELECT DISTINCT c.course_id, c.title, c.cohort, c.starts_on, c.ends_on, "
        "(SELECT COUNT(*) FROM enrolments e WHERE e.course_id = c.course_id) AS enrolled "
        "FROM course_staff cs JOIN courses c USING (course_id) WHERE cs.staff_id = ? "
        "ORDER BY c.starts_on DESC, c.title", (g.user["id"],)).fetchall()
    return render_template("results_index.html", cohorts=cohorts)


@bp.route("/teach/results/<course_id>")
@auth.role_required("instructor")
def results_page(course_id):
    cohort = taught_cohort(course_id)
    result = results(auth.get_db(), course_id)
    pages = max((len(result["rows"]) + PAGE_SIZE - 1) // PAGE_SIZE, 1)
    page = min(max(request.args.get("page", 1, type=int), 1), pages)
    return render_template("results.html", cohort=cohort, assessments=result["assessments"], total=len(result["rows"]),
                           rows=result["rows"][(page - 1) * PAGE_SIZE:page * PAGE_SIZE], page=page, pages=pages)


@bp.route("/teach/results/<course_id>/csv")
@auth.role_required("instructor")
def results_csv(course_id):
    taught_cohort(course_id)
    return csv_response(f"results-{course_id}-{date.today().isoformat()}.csv",
                        results_csv_rows(results(auth.get_db(), course_id)))
