"""Quizzes, final exams and assignments. Every attempt is a new row; a score, once given, is never changed."""
import json
import math
from datetime import date, datetime
from pathlib import Path

from flask import Blueprint, abort, current_app, flash, g, redirect, render_template, request, send_file, url_for

import auth
import courses

bp = Blueprint("assessments", __name__)
TYPES = ("Quiz", "Assignment", "Final exam")


def today():
    return date.today().isoformat()


def now():
    return datetime.now().isoformat(" ", "minutes")


def max_attempts(a):
    return 1 if a["type"] == "Final exam" else 3


def auto_marked(a):
    return a["type"] != "Assignment"


def get_assessment(db, course_id, assessment_id):
    a = db.execute("SELECT * FROM assessments WHERE assessment_id = ? AND course_id = ?",
                   (assessment_id, course_id)).fetchone()
    if a is None:
        abort(404)
    return a


def questions(db, assessment_id):
    return [dict(q, options=json.loads(q["options"])) for q in db.execute(
        "SELECT * FROM questions WHERE assessment_id = ? AND removed_at IS NULL ORDER BY id", (assessment_id,))]


def is_late(a, submitted_on):
    return bool(a["due_on"] and submitted_on and submitted_on > a["due_on"])


def next_attempt_id(db):
    n = db.execute("SELECT COALESCE(MAX(CAST(SUBSTR(attempt_id, 2) AS INTEGER)), 0) + 1 FROM attempts "
                   "WHERE attempt_id LIKE 'A%'").fetchone()[0]
    return f"A{n:06d}"


def learner_status(db, a, cohort, learner_id):
    """The learner's attempts (oldest first, imported ones included) and whether they may make another."""
    tries = db.execute("SELECT t.*, d.body, d.original_name, d.stored_name, d.feedback FROM attempts t "
                       "LEFT JOIN attempt_details d USING (attempt_id) WHERE t.assessment_id = ? AND t.learner_id = ? "
                       "ORDER BY t.rowid", (a["assessment_id"], learner_id)).fetchall()
    scored = [t["score"] for t in tries if t["score"] is not None]
    reason = None
    if auto_marked(a) and not questions(db, a["assessment_id"]):
        reason = "No questions yet."
    elif len(tries) >= max_attempts(a):
        reason = "No attempts left."
    elif tries and a["due_on"] and today() > a["due_on"]:
        reason = "The due date has passed, so there are no retakes."
    elif cohort["ends_on"] < today():
        reason = "This cohort has ended."
    elif not auto_marked(a) and any(t["score"] is None for t in tries):
        reason = "Your last submission is waiting to be marked."
    return {"tries": [dict(t, late=is_late(a, t["submitted_on"])) for t in tries], "limit": max_attempts(a),
            "best": max(scored) if scored else None, "reason": reason}


# --- learners -----------------------------------------------------------------------------

def learner_assessment(course_id, assessment_id):
    """Cohort + published assessment the signed-in learner can see (404 otherwise, drafts included)."""
    cohort = courses.learning_cohort(course_id)
    a = get_assessment(auth.get_db(), course_id, assessment_id)
    if a["status"] != "published":
        abort(404)
    return cohort, a


@bp.route("/learn/<course_id>/assessments/<assessment_id>", methods=["GET", "POST"])
@auth.role_required("learner")
def take(course_id, assessment_id):
    cohort, a = learner_assessment(course_id, assessment_id)
    db, me = auth.get_db(), g.user["id"]
    if request.method == "POST":
        status = learner_status(db, a, cohort, me)
        if status["reason"]:
            flash(status["reason"])
        elif auto_marked(a):
            submit_quiz(db, a, me)
        else:
            submit_assignment(db, a, me)
        return redirect(url_for("assessments.take", course_id=course_id, assessment_id=assessment_id))
    return render_template("take.html", cohort=cohort, a=a, status=learner_status(db, a, cohort, me),
                           questions=questions(db, assessment_id))


def insert_attempt(db, a, learner_id, score, **details):
    attempt_id = next_attempt_id(db)
    db.execute("INSERT INTO attempts (attempt_id, assessment_id, learner_id, course_id, submitted_on, score) "
               "VALUES (?, ?, ?, ?, ?, ?)", (attempt_id, a["assessment_id"], learner_id, a["course_id"], today(), score))
    db.execute("INSERT INTO attempt_details (attempt_id, answers, body, original_name, stored_name, submitted_at) "
               "VALUES (?, ?, ?, ?, ?, ?)", (attempt_id, details.get("answers"), details.get("body"),
                                             details.get("original_name"), details.get("stored_name"), now()))
    db.commit()


def submit_quiz(db, a, learner_id):
    qs, answers = questions(db, a["assessment_id"]), []
    for q in qs:
        chosen = request.form.get(f"q{q['id']}", type=int)
        if chosen not in range(1, len(q["options"]) + 1):
            flash("Answer every question.")
            return
        answers.append({"question": q["text"], "options": q["options"], "chosen": chosen, "correct": q["correct"]})
    right = sum(x["chosen"] == x["correct"] for x in answers)
    score = math.floor(100 * right / len(answers) + 0.5)  # whole numbers, like the imported scores
    insert_attempt(db, a, learner_id, score, answers=json.dumps(answers))
    flash(f"You scored {score}." + (" (submitted late)" if is_late(a, today()) else ""))


def submit_assignment(db, a, learner_id):
    body, upload = request.form.get("body", "").strip(), request.files.get("file")
    saved = None
    if upload and upload.filename:
        saved, error = courses.save_upload(upload)
        if error:
            flash(error)
            return
    if not body and not saved:
        flash("Write something or attach a file.")
        return
    insert_attempt(db, a, learner_id, None, body=body or None,
                   original_name=saved and saved[0], stored_name=saved and saved[1])
    flash("Submitted. It's waiting to be marked." + (" (submitted late)" if is_late(a, today()) else ""))


@bp.route("/submissions/<attempt_id>/file")
@auth.role_required("learner", "instructor")
def submission_file(attempt_id):
    db = auth.get_db()
    row = db.execute("SELECT t.learner_id, t.course_id, d.original_name, d.stored_name FROM attempts t "
                     "JOIN attempt_details d USING (attempt_id) WHERE t.attempt_id = ?", (attempt_id,)).fetchone()
    if row is None or not row["stored_name"]:
        abort(404)
    allowed = (row["learner_id"] == g.user["id"] if g.user["role"] == "learner"
               else auth.teaches(db, g.user["id"], row["course_id"]))
    if not allowed:
        abort(404)
    ext = row["stored_name"].rsplit(".", 1)[-1]
    response = send_file(Path(current_app.config["UPLOAD_DIR"]) / row["stored_name"],
                         mimetype=courses.FILE_TYPES[ext][1], download_name=row["original_name"], as_attachment=False)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# --- instructors --------------------------------------------------------------------------

@bp.route("/teach/<course_id>/assessments")
@auth.role_required("instructor")
def index(course_id):
    cohort = courses.teaching_cohort(course_id)
    rows = auth.get_db().execute(
        "SELECT a.*, COUNT(t.attempt_id) AS attempts, SUM(t.attempt_id IS NOT NULL AND t.score IS NULL) AS unmarked, "
        "(SELECT COUNT(*) FROM questions q WHERE q.assessment_id = a.assessment_id AND q.removed_at IS NULL) AS questions "
        "FROM assessments a LEFT JOIN attempts t USING (assessment_id) WHERE a.course_id = ? "
        "GROUP BY a.assessment_id ORDER BY a.due_on IS NULL, a.due_on, a.title", (course_id,)).fetchall()
    return render_template("assessments.html", cohort=cohort, rows=rows, types=TYPES)


def read_details(form):
    """Validate title / due date / weight from a form; returns (values, error)."""
    title, due = form.get("title", "").strip(), form.get("due_on", "").strip()
    try:
        weight = float(form.get("weight_pct", "0") or 0)
    except ValueError:
        weight = -1
    if not title:
        return None, "Enter a title."
    if due and not courses.valid_date(due):
        return None, "Enter a valid due date."
    if not 0 <= weight <= 100:
        return None, "Weight must be a number from 0 to 100."
    return (title, due or None, weight), None


@bp.route("/teach/<course_id>/assessments/new", methods=["POST"])
@auth.role_required("instructor")
def new(course_id):
    courses.teaching_cohort(course_id)
    kind = request.form.get("type")
    values, error = read_details(request.form)
    if kind not in TYPES:
        error = "Choose quiz, assignment or final exam."
    if error:
        flash(error)
        return redirect(url_for("assessments.index", course_id=course_id))
    db = auth.get_db()
    assessment_id = str(db.execute("SELECT COALESCE(MAX(CAST(assessment_id AS INTEGER)), 0) + 1 "
                                   "FROM assessments").fetchone()[0])
    db.execute("INSERT INTO assessments (assessment_id, course_id, type, title, due_on, weight_pct, author_id, status) "
               "VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')", (assessment_id, course_id, kind, *values, g.user["id"]))
    db.commit()
    flash(f"{kind} created as a draft.")
    return redirect(url_for("assessments.edit", course_id=course_id, assessment_id=assessment_id))


@bp.route("/teach/<course_id>/assessments/<assessment_id>", methods=["GET", "POST"])
@auth.role_required("instructor")
def edit(course_id, assessment_id):
    cohort = courses.teaching_cohort(course_id)
    db = auth.get_db()
    a = get_assessment(db, course_id, assessment_id)
    if request.method == "POST":
        values, error = read_details(request.form)
        if error:
            flash(error)
        else:
            db.execute("UPDATE assessments SET title = ?, due_on = ?, weight_pct = ? WHERE assessment_id = ?",
                       (*values, assessment_id))
            db.commit()
            flash("Saved.")
        return redirect(url_for("assessments.edit", course_id=course_id, assessment_id=assessment_id))
    return render_template("assessment_edit.html", cohort=cohort, a=a, questions=questions(db, assessment_id),
                           auto=auto_marked(a))


@bp.route("/teach/<course_id>/assessments/<assessment_id>/status", methods=["POST"])
@auth.role_required("instructor")
def set_status(course_id, assessment_id):
    courses.teaching_cohort(course_id)
    db = auth.get_db()
    a = get_assessment(db, course_id, assessment_id)
    action = request.form.get("action")
    if action not in ("publish", "unpublish"):
        abort(400)
    if action == "publish" and auto_marked(a) and not questions(db, assessment_id):
        flash("Add at least one question before publishing.")
    else:
        status = "published" if action == "publish" else "draft"
        db.execute("UPDATE assessments SET status = ?, published_on = COALESCE(published_on, ?) "
                   "WHERE assessment_id = ?", (status, today() if status == "published" else None, assessment_id))
        db.commit()
        flash(f"Now {status}.")
    return redirect(url_for("assessments.edit", course_id=course_id, assessment_id=assessment_id))


def read_question(form):
    """Validate a question form; returns ((text, options_json, correct), error)."""
    text = form.get("text", "").strip()
    options = [line.strip() for line in form.get("options", "").splitlines() if line.strip()]
    correct = form.get("correct", type=int)
    if not text:
        return None, "Enter the question."
    if not 2 <= len(options) <= 6:
        return None, "Give between 2 and 6 options, one per line."
    if correct not in range(1, len(options) + 1):
        return None, f"The correct option must be a number from 1 to {len(options)}."
    return (text, json.dumps(options), correct), None


@bp.route("/teach/<course_id>/assessments/<assessment_id>/questions", methods=["POST"])
@bp.route("/teach/<course_id>/assessments/<assessment_id>/questions/<int:question_id>", methods=["POST"])
@auth.role_required("instructor")
def save_question(course_id, assessment_id, question_id=None):
    courses.teaching_cohort(course_id)
    db = auth.get_db()
    if not auto_marked(get_assessment(db, course_id, assessment_id)):
        abort(400)
    values, error = read_question(request.form)
    if error:
        flash(error)
    elif question_id is None:
        db.execute("INSERT INTO questions (assessment_id, text, options, correct, created_by, updated_by, updated_at) "
                   "VALUES (?, ?, ?, ?, ?, ?, ?)", (assessment_id, *values, g.user["id"], g.user["id"], now()))
        db.commit()
        flash("Question added.")
    else:
        # Earlier attempts keep their own snapshot, so editing never re-marks them.
        db.execute("UPDATE questions SET text = ?, options = ?, correct = ?, updated_by = ?, updated_at = ? "
                   "WHERE id = ? AND assessment_id = ?", (*values, g.user["id"], now(), question_id, assessment_id))
        db.commit()
        flash("Question saved. Earlier attempts keep the score they got.")
    return redirect(url_for("assessments.edit", course_id=course_id, assessment_id=assessment_id))


@bp.route("/teach/<course_id>/assessments/<assessment_id>/questions/<int:question_id>/remove", methods=["POST"])
@auth.role_required("instructor")
def remove_question(course_id, assessment_id, question_id):
    courses.teaching_cohort(course_id)
    db = auth.get_db()
    get_assessment(db, course_id, assessment_id)
    db.execute("UPDATE questions SET removed_at = ? WHERE id = ? AND assessment_id = ?", (now(), question_id, assessment_id))
    db.commit()
    flash("Question removed.")
    return redirect(url_for("assessments.edit", course_id=course_id, assessment_id=assessment_id))


@bp.route("/teach/<course_id>/assessments/<assessment_id>/attempts")
@auth.role_required("instructor")
def attempts(course_id, assessment_id):
    cohort = courses.teaching_cohort(course_id)
    db = auth.get_db()
    a = get_assessment(db, course_id, assessment_id)
    rows = db.execute(
        "SELECT t.*, l.full_name, s.full_name AS grader, "
        "ROW_NUMBER() OVER (PARTITION BY t.learner_id ORDER BY t.rowid) AS number "
        "FROM attempts t JOIN learners l USING (learner_id) LEFT JOIN staff s ON s.staff_id = t.graded_by "
        "WHERE t.assessment_id = ? ORDER BY l.full_name, t.rowid", (assessment_id,)).fetchall()
    # shortcut: one page for every attempt (about 1,800 at most per assessment); page it if that grows.
    return render_template("attempts.html", cohort=cohort, a=a, auto=auto_marked(a),
                           rows=[dict(r, late=is_late(a, r["submitted_on"])) for r in rows])


@bp.route("/teach/<course_id>/assessments/<assessment_id>/attempts/<attempt_id>", methods=["GET", "POST"])
@auth.role_required("instructor")
def mark(course_id, assessment_id, attempt_id):
    cohort = courses.teaching_cohort(course_id)
    db = auth.get_db()
    a = get_assessment(db, course_id, assessment_id)
    t = db.execute("SELECT t.*, l.full_name, d.body, d.original_name, d.stored_name, d.feedback FROM attempts t "
                   "JOIN learners l USING (learner_id) LEFT JOIN attempt_details d USING (attempt_id) "
                   "WHERE t.attempt_id = ? AND t.assessment_id = ?", (attempt_id, assessment_id)).fetchone()
    if t is None or auto_marked(a):
        abort(404)
    if request.method == "POST":
        score = request.form.get("score", type=int)
        if t["score"] is not None:
            flash("This submission has already been marked; a mark is never changed.")
        elif score is None or not 0 <= score <= 100:
            flash("Score must be a whole number from 0 to 100.")
        else:
            db.execute("UPDATE attempts SET score = ?, graded_by = ? WHERE attempt_id = ? AND score IS NULL",
                       (score, g.user["id"], attempt_id))
            db.execute("INSERT INTO attempt_details (attempt_id, feedback, marked_at) VALUES (?, ?, ?) "
                       "ON CONFLICT (attempt_id) DO UPDATE SET feedback = excluded.feedback, marked_at = excluded.marked_at",
                       (attempt_id, request.form.get("feedback", "").strip() or None, now()))
            db.commit()
            flash(f"Marked {score}.")
        return redirect(url_for("assessments.mark", course_id=course_id, assessment_id=assessment_id,
                                attempt_id=attempt_id))
    return render_template("mark.html", cohort=cohort, a=a, t=t, late=is_late(a, t["submitted_on"]))
