"""Instructors build cohorts and their pages; learners read what is published. Nothing here deletes a row or file."""
import re
import uuid
from datetime import date, datetime
from pathlib import Path

from flask import Blueprint, abort, current_app, flash, g, redirect, render_template, request, send_file, url_for

import auth

bp = Blueprint("courses", __name__)
MAX_FILE_MB = 10
MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024
# Allowed uploads: extension -> (kind, mimetype, how the file's bytes must start)
FILE_TYPES = {
    "png": ("image", "image/png", (b"\x89PNG\r\n\x1a\n",)),
    "jpg": ("image", "image/jpeg", (b"\xff\xd8\xff",)),
    "jpeg": ("image", "image/jpeg", (b"\xff\xd8\xff",)),
    "gif": ("image", "image/gif", (b"GIF87a", b"GIF89a")),
    "pdf": ("pdf", "application/pdf", (b"%PDF-",)),
}


# Either field marks a withdrawal: some imported rows have only one of them.
WITHDRAWN = "(e.outcome = 'Withdrawn' OR e.withdrawn_on IS NOT NULL)"


def can_read(db, learner_id, course_id):
    """Is the learner enrolled on the cohort and not withdrawn?"""
    return db.execute(f"SELECT 1 FROM enrolments e WHERE e.learner_id = ? AND e.course_id = ? AND NOT {WITHDRAWN}",
                      (learner_id, course_id)).fetchone() is not None


def now():
    return datetime.now().isoformat(" ", "minutes")


def cohort_row(db, course_id):
    return db.execute(
        "SELECT c.*, COALESCE(s.status, 'published') AS status, "
        "(SELECT COUNT(*) FROM enrolments e WHERE e.course_id = c.course_id) AS enrolled "
        "FROM courses c LEFT JOIN course_status s USING (course_id) WHERE c.course_id = ?", (course_id,)).fetchone()


def teaching_cohort(course_id):
    """The cohort, if the signed-in instructor is currently assigned to it (403 otherwise)."""
    db = auth.get_db()
    cohort = cohort_row(db, course_id)
    if cohort is None:
        abort(404)
    if not auth.teaches(db, g.user["id"], course_id):
        abort(403)
    return cohort


def teaching_page(course_id, page_id):
    cohort = teaching_cohort(course_id)
    page = auth.get_db().execute("SELECT * FROM pages WHERE id = ? AND course_id = ?", (page_id, course_id)).fetchone()
    if page is None:
        abort(404)
    return cohort, page


def learning_cohort(course_id):
    """The cohort, if it is published and the signed-in learner is enrolled and not withdrawn (404 otherwise)."""
    db = auth.get_db()
    cohort = cohort_row(db, course_id)
    if cohort is None or cohort["status"] != "published" or not can_read(db, g.user["id"], course_id):
        abort(404)
    return cohort


def page_files(db, page_id):
    """Files still on the page: images first, then PDFs, each in upload order."""
    return db.execute("SELECT * FROM page_files WHERE page_id = ? AND removed_at IS NULL "
                      "ORDER BY kind = 'pdf', id", (page_id,)).fetchall()


def copy_sources(db, cohort):
    """Earlier cohorts of the same course (same title) that pages can be copied from."""
    return db.execute("SELECT course_id, cohort FROM courses WHERE title = ? AND starts_on < ? "
                      "ORDER BY starts_on DESC", (cohort["title"], cohort["starts_on"])).fetchall()


def save_upload(upload):
    """Check an uploaded file (type, real signature, size) and store it on disk.
    Returns ((original_name, stored_name, kind, size), None) or (None, reason)."""
    name = Path(upload.filename).name
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in FILE_TYPES:
        return None, "Only PNG, JPG, GIF and PDF files can be uploaded."
    kind, _, signatures = FILE_TYPES[ext]
    data = upload.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        return None, f"That file is larger than {MAX_FILE_MB} MB."
    if not data.startswith(signatures):
        return None, f"{name} isn't really a {ext.upper()} file."
    folder = Path(current_app.config["UPLOAD_DIR"])
    folder.mkdir(parents=True, exist_ok=True)
    stored = f"{uuid.uuid4().hex}.{ext}"
    (folder / stored).write_bytes(data)
    return (name, stored, kind, len(data)), None


def valid_date(value):
    try:
        return date.fromisoformat(value).isoformat()
    except (TypeError, ValueError):
        return None


# --- instructors ----------------------------------------------------------------------------

@bp.route("/teach/new", methods=["GET", "POST"])
@auth.role_required("instructor")
def cohort_new():
    db, form, error = auth.get_db(), request.form, None
    if request.method == "POST":
        title, label = form.get("title", "").strip(), form.get("cohort", "").strip()
        starts, ends = valid_date(form.get("starts_on")), valid_date(form.get("ends_on"))
        if not title or not label:
            error = "Enter a title and a cohort label."
        elif not starts or not ends:
            error = "Enter a start and an end date."
        elif ends < starts:
            error = "The end date must be on or after the start date."
        else:
            base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") + "-" + starts[:7]
            course_id, n = base, 1
            while db.execute("SELECT 1 FROM courses WHERE course_id = ?", (course_id,)).fetchone():
                n += 1
                course_id = f"{base}-{n}"
            days = (date.fromisoformat(ends) - date.fromisoformat(starts)).days
            db.execute("INSERT INTO courses (course_id, title, category, description, cohort, starts_on, ends_on, "
                       "length_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                       (course_id, title, form.get("category", "").strip() or None,
                        form.get("description", "").strip() or None, label, starts, ends, days))
            db.execute("INSERT INTO course_status (course_id, status) VALUES (?, 'draft')", (course_id,))
            db.execute("INSERT INTO course_staff (course_id, staff_id, role, assigned_on) VALUES (?, ?, 'lead', ?)",
                       (course_id, g.user["id"], date.today().isoformat()))
            db.commit()
            flash(f"{title} — {label} created as a draft. You are its lead.")
            return redirect(url_for("courses.cohort", course_id=course_id))
    titles = [t for (t,) in db.execute("SELECT DISTINCT title FROM courses ORDER BY title")]
    return render_template("teach_new.html", error=error, form=form, titles=titles)


@bp.route("/teach/<course_id>")
@auth.role_required("instructor")
def cohort(course_id):
    cohort = teaching_cohort(course_id)
    db = auth.get_db()
    pages = db.execute("SELECT p.*, (SELECT COUNT(*) FROM page_files f WHERE f.page_id = p.id "
                       "AND f.removed_at IS NULL) AS files FROM pages p WHERE course_id = ? ORDER BY id",
                       (course_id,)).fetchall()
    return render_template("teach_cohort.html", cohort=cohort, pages=pages, sources=copy_sources(db, cohort))


@bp.route("/teach/<course_id>/status", methods=["POST"])
@auth.role_required("instructor")
def cohort_status(course_id):
    cohort = teaching_cohort(course_id)
    action = request.form.get("action")
    if action not in ("publish", "unpublish"):
        abort(400)
    if action == "unpublish" and cohort["enrolled"]:
        flash(f"This cohort has {cohort['enrolled']:,} enrolments, so it can't be unpublished.")
    else:
        db = auth.get_db()
        status = "published" if action == "publish" else "draft"
        db.execute("INSERT INTO course_status (course_id, status) VALUES (?, ?) "
                   "ON CONFLICT (course_id) DO UPDATE SET status = excluded.status", (course_id, status))
        db.commit()
        flash(f"Cohort is now {status}.")
    return redirect(url_for("courses.cohort", course_id=course_id))


@bp.route("/teach/<course_id>/pages", methods=["POST"])
@auth.role_required("instructor")
def page_new(course_id):
    teaching_cohort(course_id)
    title = request.form.get("title", "").strip()
    if not title:
        flash("Enter a page title.")
        return redirect(url_for("courses.cohort", course_id=course_id))
    db = auth.get_db()
    cur = db.execute("INSERT INTO pages (course_id, title, created_by, created_at, updated_by, updated_at) "
                     "VALUES (?, ?, ?, ?, ?, ?)", (course_id, title, g.user["id"], now(), g.user["id"], now()))
    db.commit()
    return redirect(url_for("courses.page_edit", course_id=course_id, page_id=cur.lastrowid))


@bp.route("/teach/<course_id>/copy", methods=["POST"])
@auth.role_required("instructor")
def copy_pages(course_id):
    cohort = teaching_cohort(course_id)
    db, source = auth.get_db(), request.form.get("source")
    if source not in {s["course_id"] for s in copy_sources(db, cohort)}:
        abort(400)
    pages = db.execute("SELECT * FROM pages WHERE course_id = ? ORDER BY id", (source,)).fetchall()
    for p in pages:
        new_id = db.execute("INSERT INTO pages (course_id, title, body, created_by, created_at, updated_by, updated_at) "
                            "VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (course_id, p["title"], p["body"], g.user["id"], now(), g.user["id"], now())).lastrowid
        # The copy points at the same file on disk; files are never deleted, so sharing is safe.
        db.execute("INSERT INTO page_files (page_id, kind, original_name, stored_name, size, uploaded_by, uploaded_at) "
                   "SELECT ?, kind, original_name, stored_name, size, ?, ? FROM page_files "
                   "WHERE page_id = ? AND removed_at IS NULL ORDER BY id", (new_id, g.user["id"], now(), p["id"]))
    db.commit()
    flash(f"Copied {len(pages)} page{'' if len(pages) == 1 else 's'} as drafts.")
    return redirect(url_for("courses.cohort", course_id=course_id))


@bp.route("/teach/<course_id>/pages/<int:page_id>", methods=["GET", "POST"])
@auth.role_required("instructor")
def page_edit(course_id, page_id):
    cohort, page = teaching_page(course_id, page_id)
    db = auth.get_db()
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        if not title:
            flash("Enter a page title.")
        else:
            db.execute("UPDATE pages SET title = ?, body = ?, updated_by = ?, updated_at = ? WHERE id = ?",
                       (title, request.form.get("body", ""), g.user["id"], now(), page_id))
            db.commit()
            flash("Page saved.")
        return redirect(url_for("courses.page_edit", course_id=course_id, page_id=page_id))
    return render_template("teach_page.html", cohort=cohort, page=page, files=page_files(db, page_id),
                           max_mb=MAX_FILE_MB)


@bp.route("/teach/<course_id>/pages/<int:page_id>/status", methods=["POST"])
@auth.role_required("instructor")
def page_status(course_id, page_id):
    teaching_page(course_id, page_id)
    action = request.form.get("action")
    if action not in ("publish", "unpublish"):
        abort(400)
    db = auth.get_db()
    status = "published" if action == "publish" else "draft"
    db.execute("UPDATE pages SET status = ?, updated_by = ?, updated_at = ? WHERE id = ?",
               (status, g.user["id"], now(), page_id))
    db.commit()
    flash(f"Page is now {status}.")
    return redirect(url_for("courses.page_edit", course_id=course_id, page_id=page_id))


@bp.route("/teach/<course_id>/pages/<int:page_id>/files", methods=["POST"])
@auth.role_required("instructor")
def file_upload(course_id, page_id):
    teaching_page(course_id, page_id)
    back = redirect(url_for("courses.page_edit", course_id=course_id, page_id=page_id))
    upload = request.files.get("file")
    if not upload or not upload.filename:
        flash("Choose a file to upload.")
        return back
    saved, error = save_upload(upload)
    if error:
        flash(error)
        return back
    name, stored, kind, size = saved
    db = auth.get_db()
    db.execute("INSERT INTO page_files (page_id, kind, original_name, stored_name, size, uploaded_by, uploaded_at) "
               "VALUES (?, ?, ?, ?, ?, ?, ?)", (page_id, kind, name, stored, size, g.user["id"], now()))
    db.commit()
    flash(f"{name} uploaded.")
    return back


@bp.route("/teach/<course_id>/pages/<int:page_id>/files/<int:file_id>/remove", methods=["POST"])
@auth.role_required("instructor")
def file_remove(course_id, page_id, file_id):
    teaching_page(course_id, page_id)
    db = auth.get_db()
    db.execute("UPDATE page_files SET removed_by = ?, removed_at = ? WHERE id = ? AND page_id = ? "
               "AND removed_at IS NULL", (g.user["id"], now(), file_id, page_id))
    db.commit()
    flash("File removed from the page (it is kept on the server).")
    return redirect(url_for("courses.page_edit", course_id=course_id, page_id=page_id))


# --- learners -------------------------------------------------------------------------------

@bp.route("/learn/<course_id>")
@auth.role_required("learner")
def learn_cohort(course_id):
    cohort = learning_cohort(course_id)
    db = auth.get_db()
    pages = db.execute("SELECT id, title FROM pages WHERE course_id = ? AND status = 'published' ORDER BY id",
                       (course_id,)).fetchall()
    # Published assessments, plus drafts where this learner already has (imported) scores: their history.
    assessments = db.execute(
        "SELECT a.assessment_id, a.title, a.type, a.due_on, a.status, COUNT(t.attempt_id) AS used, "
        "MAX(t.score) AS best FROM assessments a LEFT JOIN attempts t "
        "ON t.assessment_id = a.assessment_id AND t.learner_id = ? WHERE a.course_id = ? "
        "GROUP BY a.assessment_id HAVING a.status = 'published' OR COUNT(t.attempt_id) > 0 "
        "ORDER BY a.due_on IS NULL, a.due_on, a.title", (g.user["id"], course_id)).fetchall()
    return render_template("learn_cohort.html", cohort=cohort, pages=pages, assessments=assessments)


@bp.route("/learn/<course_id>/pages/<int:page_id>")
@auth.role_required("learner")
def learn_page(course_id, page_id):
    cohort = learning_cohort(course_id)
    db = auth.get_db()
    page = db.execute("SELECT * FROM pages WHERE id = ? AND course_id = ? AND status = 'published'",
                      (page_id, course_id)).fetchone()
    if page is None:
        abort(404)
    return render_template("learn_page.html", cohort=cohort, page=page, files=page_files(db, page_id))


# --- files (same rules as the page they're on) ----------------------------------------------

@bp.route("/files/<int:file_id>")
@auth.role_required("instructor", "learner")
def file(file_id):
    db = auth.get_db()
    f = db.execute("SELECT f.*, p.course_id, p.status AS page_status FROM page_files f JOIN pages p "
                   "ON p.id = f.page_id WHERE f.id = ? AND f.removed_at IS NULL", (file_id,)).fetchone()
    if f is None:
        abort(404)
    if g.user["role"] == "instructor":
        allowed = auth.teaches(db, g.user["id"], f["course_id"])
    else:
        cohort = cohort_row(db, f["course_id"])
        allowed = (f["page_status"] == "published" and cohort["status"] == "published"
                   and can_read(db, g.user["id"], f["course_id"]))
    if not allowed:
        abort(404)
    ext = f["stored_name"].rsplit(".", 1)[-1]
    response = send_file(Path(current_app.config["UPLOAD_DIR"]) / f["stored_name"], mimetype=FILE_TYPES[ext][1],
                         download_name=f["original_name"], as_attachment=False)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
