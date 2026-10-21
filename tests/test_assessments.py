import io
import json
import sqlite3
import unittest
from contextlib import closing
from datetime import date

import test_courses
import test_enrolment  # module imports, so their test classes aren't collected a second time here
from test_auth import AppTestCase

INSTRUCTOR = "ana.grey@brightpath.example"         # S008, lead of data-2026-10
OTHER_INSTRUCTOR = "kian.mackay@brightpath.example"  # S010, teaches nothing
AYESHA = "ayesha@example.com"   # 100: enrolled on data-2026-10; imported score 77 on draft assignment 9002
ARJUN = "arjun@example.com"     # 103: enrolled; imported attempt (40) on open quiz 9001; unmarked imported 9003
EOIN = "eoin@example.com"       # 101: withdrawn from data-2026-10
TOM = "tom@tiny.example"        # 104: not enrolled on data-2026-10

BASE = test_enrolment.ENROLMENT_EXTRA
EXTRA = {
    **BASE,
    "enrolments.csv": BASE["enrolments.csv"]
    + "E6,100,data-2026-10,2026-09-01,,In progress,1,0,self\n"
    + "E7,101,data-2026-10,2026-09-01,2026-10-10,Withdrawn,0,0,self\n"
    + "E8,103,data-2026-10,2026-09-01,,In progress,1,0,self\n",
    "assessments.csv": test_courses.CoursesTest.EXTRA.get("assessments.csv", "")
    + "9001,data-2026-10,Quiz,Imported quiz,2099-01-01,10,S008,published,2026-09-01\n"
    + "9002,data-2026-10,Assignment,Imported draft,2099-01-01,20,S008,draft,\n"
    + "9003,data-2026-10,Assignment,Old essay,2099-01-01,20,S008,published,2026-09-01\n",
    "attempts.csv": "A4,9001,103,data-2026-10,2026-10-05,40,\n"
    + "A5,9002,100,data-2026-10,2026-10-06,77,S008\n"
    + "A6,9003,103,data-2026-10,2026-10-07,,\n",
}
QUESTIONS = [("2 + 2?", ["3", "4", "5"], 2), ("Capital of France?", ["Paris", "Rome"], 1), ("Red + blue?", ["Purple", "Green"], 1)]


class AssessmentsTest(AppTestCase):
    EXTRA = EXTRA

    def query(self, sql, *args):
        with closing(sqlite3.connect(self.db)) as db:
            return db.execute(sql, args).fetchall()

    def as_user(self, email):
        self.sign_out()
        self.sign_in(email)

    def create(self, kind="Quiz", title="Week 1 quiz", due="2099-01-01", questions=QUESTIONS, publish=True):
        """As Ana: create an assessment (with questions) on data-2026-10; returns its id."""
        self.as_user(INSTRUCTOR)
        r = self.post("/teach/data-2026-10/assessments/new",
                      data={"type": kind, "title": title, "due_on": due, "weight_pct": "10"}, follow_redirects=True)
        aid = r.request.path.rsplit("/", 1)[-1]
        if kind != "Assignment":
            for text, options, correct in questions:
                self.add_question(aid, text, options, correct)
        if publish:
            self.post(f"/teach/data-2026-10/assessments/{aid}/status", data={"action": "publish"})
        return aid

    def add_question(self, aid, text, options, correct):
        return self.post(f"/teach/data-2026-10/assessments/{aid}/questions",
                         data={"text": text, "options": "\n".join(options), "correct": str(correct)},
                         follow_redirects=True)

    def take(self, aid, choices):
        """Submit a quiz as the signed-in learner; choices are 1-based option numbers, in question order."""
        ids = [q for (q,) in self.query("SELECT id FROM questions WHERE assessment_id = ? AND removed_at IS NULL "
                                        "ORDER BY id", aid)]
        return self.post(f"/learn/data-2026-10/assessments/{aid}",
                         data={f"q{q}": str(c) for q, c in zip(ids, choices)}, follow_redirects=True)

    def submit(self, aid, body="", file=None):
        data = {"body": body}
        if file:
            data["file"] = (io.BytesIO(file[1]), file[0])
        return self.post(f"/learn/data-2026-10/assessments/{aid}", data=data, content_type="multipart/form-data",
                         follow_redirects=True)

    def mark(self, attempt_id, score, feedback="", aid=None):
        aid = aid or self.query("SELECT assessment_id FROM attempts WHERE attempt_id = ?", attempt_id)[0][0]
        return self.post(f"/teach/data-2026-10/assessments/{aid}/attempts/{attempt_id}",
                         data={"score": str(score), "feedback": feedback}, follow_redirects=True)

    def scores(self, aid, learner):
        # rowid = insertion order; ids mix the CSV's "A4" style with the app's "A000007", so they don't sort.
        return [s for (s,) in self.query("SELECT score FROM attempts WHERE assessment_id = ? AND learner_id = ? "
                                         "ORDER BY rowid", aid, learner)]

    # --- quizzes and final exams --------------------------------------------------

    def test_quiz_needs_questions_and_is_marked_automatically(self):
        aid = self.create(questions=[], publish=False)
        r = self.post(f"/teach/data-2026-10/assessments/{aid}/status", data={"action": "publish"}, follow_redirects=True)
        self.assertIn("Add at least one question before publishing.", r.text)
        for text, options, correct in QUESTIONS:
            self.add_question(aid, text, options, correct)
        self.post(f"/teach/data-2026-10/assessments/{aid}/status", data={"action": "publish"})
        self.as_user(AYESHA)
        r = self.take(aid, [2, 1, 2])
        self.assertIn("You scored 67", r.text)
        (attempt_id, submitted, score, graded_by), = self.query(
            "SELECT attempt_id, submitted_on, score, graded_by FROM attempts WHERE assessment_id = ?", aid)
        self.assertEqual((attempt_id, submitted, score, graded_by), ("A000007", date.today().isoformat(), 67, None))
        answers = json.loads(self.query("SELECT answers FROM attempt_details WHERE attempt_id = 'A000007'")[0][0])
        self.assertEqual([(a["chosen"], a["correct"]) for a in answers], [(2, 2), (1, 1), (2, 1)])

    def test_three_attempts_best_counts_and_final_exam_has_one(self):
        aid = self.create()
        self.as_user(AYESHA)
        for choices in ([1, 2, 2], [2, 1, 1], [2, 1, 2]):  # 0, 100, 67
            self.take(aid, choices)
        self.assertEqual(self.scores(aid, "100"), [0, 100, 67])
        r = self.take(aid, [2, 1, 1])
        self.assertIn("No attempts left", r.text)
        self.assertIn("Best score: 100", r.text)
        self.assertEqual(len(self.scores(aid, "100")), 3)
        exam = self.create(kind="Final exam", title="Final")
        self.as_user(AYESHA)
        self.take(exam, [1, 1, 1])
        self.assertIn("No attempts left", self.take(exam, [2, 1, 1]).text)
        self.assertEqual(len(self.scores(exam, "100")), 1)

    def test_late_first_attempt_accepted_but_no_retake_after_due_date(self):
        aid = self.create(due="2020-01-01")
        self.as_user(AYESHA)
        r = self.take(aid, [2, 1, 1])
        self.assertIn("late", r.text)
        self.assertEqual(self.scores(aid, "100"), [100])
        self.assertIn("The due date has passed, so there are no retakes.", self.take(aid, [2, 1, 1]).text)
        self.assertEqual(self.scores(aid, "100"), [100])

    def test_imported_attempt_counts_as_attempt_one(self):
        self.as_user(ARJUN)
        page = self.client.get("/learn/data-2026-10/assessments/9001").text
        self.assertIn("No questions yet", page)
        self.assertIn("1 of 3 attempts used", page)
        self.as_user(INSTRUCTOR)
        self.add_question("9001", "2 + 2?", ["3", "4"], 2)
        self.as_user(ARJUN)
        self.take("9001", [2])
        self.take("9001", [1])
        self.assertIn("No attempts left", self.take("9001", [2]).text)
        self.assertEqual(self.scores("9001", "103"), [40, 100, 0])

    def test_editing_a_question_never_remarks_earlier_attempts(self):
        aid = self.create(questions=[("2 + 2?", ["3", "4"], 1)])  # wrong key: says 3
        self.as_user(AYESHA)
        self.take(aid, [2])
        self.assertEqual(self.scores(aid, "100"), [0])
        self.as_user(INSTRUCTOR)
        qid = self.query("SELECT id FROM questions WHERE assessment_id = ?", aid)[0][0]
        self.post(f"/teach/data-2026-10/assessments/{aid}/questions/{qid}",
                  data={"text": "2 + 2?", "options": "3\n4", "correct": "2"})
        self.as_user(AYESHA)
        self.take(aid, [2])
        self.assertEqual(self.scores(aid, "100"), [0, 100])
        first = json.loads(self.query("SELECT answers FROM attempt_details WHERE attempt_id = 'A000007'")[0][0])
        self.assertEqual(first[0]["correct"], 1)  # the snapshot keeps the key it was marked against

    def test_draft_cannot_be_opened_but_imported_scores_show(self):
        aid = self.create(publish=False)
        self.as_user(AYESHA)
        self.assertEqual(self.client.get(f"/learn/data-2026-10/assessments/{aid}").status_code, 404)
        self.assertEqual(self.take(aid, [2, 1, 1]).status_code, 404)
        self.assertEqual(self.client.get("/learn/data-2026-10/assessments/9002").status_code, 404)
        page = self.client.get("/learn/data-2026-10").text
        self.assertIn("Imported draft — score 77 (imported)", page)
        self.assertNotIn("Week 1 quiz", page)
        self.assertEqual(self.scores(aid, "100"), [])

    def test_only_enrolled_learners_and_assigned_instructors(self):
        aid = self.create()
        for email in [EOIN, TOM]:
            with self.subTest(email=email):
                self.as_user(email)
                self.assertEqual(self.client.get(f"/learn/data-2026-10/assessments/{aid}").status_code, 404)
                self.assertEqual(self.take(aid, [2, 1, 1]).status_code, 404)
        self.as_user(OTHER_INSTRUCTOR)
        for path in ["/teach/data-2026-10/assessments", f"/teach/data-2026-10/assessments/{aid}",
                     f"/teach/data-2026-10/assessments/{aid}/attempts"]:
            self.assertEqual(self.client.get(path).status_code, 403)
        self.assertEqual(self.mark("A6", 90).status_code, 403)

    # --- assignments --------------------------------------------------------------

    def test_assignment_needs_text_or_a_valid_file(self):
        aid = self.create(kind="Assignment", title="Essay")
        self.as_user(AYESHA)
        self.assertIn("Write something or attach a file.", self.submit(aid).text)
        self.assertIn("isn&#39;t really a PDF", self.submit(aid, file=("essay.pdf", b"not a pdf")).text)
        self.assertEqual(self.scores(aid, "100"), [])
        self.submit(aid, file=("essay.pdf", test_courses.PDF))
        (stored,), = self.query("SELECT stored_name FROM attempt_details")
        self.assertTrue((self.dir / "uploads" / stored).exists())

    def test_assignment_resubmission_waits_for_marking_and_best_counts(self):
        aid = self.create(kind="Assignment", title="Essay")
        self.as_user(AYESHA)
        self.submit(aid, body="First draft")
        self.assertIn("waiting to be marked", self.submit(aid, body="Second draft").text)
        first = self.query("SELECT attempt_id FROM attempts WHERE assessment_id = ?", aid)[0][0]
        self.as_user(INSTRUCTOR)
        self.assertIn("First draft", self.client.get(f"/teach/data-2026-10/assessments/{aid}/attempts/{first}").text)
        self.assertIn("Score must be a whole number from 0 to 100.", self.mark(first, 101).text)
        self.mark(first, 72, "Good start")
        self.assertIn("already been marked", self.mark(first, 99).text)
        self.as_user(AYESHA)
        page = self.client.get(f"/learn/data-2026-10/assessments/{aid}").text
        self.assertIn("72", page)
        self.assertIn("Good start", page)
        self.submit(aid, body="Second draft")
        second = self.query("SELECT attempt_id FROM attempts WHERE assessment_id = ? ORDER BY rowid DESC", aid)[0][0]
        self.as_user(INSTRUCTOR)
        self.mark(second, 85)
        self.as_user(AYESHA)
        self.submit(aid, body="Third draft")
        third = self.query("SELECT attempt_id FROM attempts WHERE assessment_id = ? ORDER BY rowid DESC", aid)[0][0]
        self.as_user(INSTRUCTOR)
        self.mark(third, 60)
        self.as_user(AYESHA)
        r = self.submit(aid, body="Fourth")
        self.assertIn("No attempts left", r.text)
        self.assertIn("Best score: 85", r.text)
        self.assertEqual(self.scores(aid, "100"), [72, 85, 60])
        self.assertEqual(self.query("SELECT DISTINCT graded_by FROM attempts WHERE assessment_id = ?", aid), [("S008",)])

    def test_imported_ungraded_submission_can_be_marked_once(self):
        self.as_user(INSTRUCTOR)
        self.mark("A6", 50, "Marked late")
        self.assertEqual(self.query("SELECT score, graded_by FROM attempts WHERE attempt_id = 'A6'"), [(50, "S008")])
        self.assertIn("already been marked", self.mark("A6", 90).text)
        self.assertEqual(self.scores("9003", "103"), [50])

    def test_submission_file_access(self):
        aid = self.create(kind="Assignment", title="Essay")
        self.as_user(AYESHA)
        self.submit(aid, body="See file", file=("essay.pdf", test_courses.PDF))
        attempt_id = self.query("SELECT attempt_id FROM attempts WHERE assessment_id = ?", aid)[0][0]
        for email, status in [(AYESHA, 200), (INSTRUCTOR, 200), (ARJUN, 404), (OTHER_INSTRUCTOR, 404)]:
            with self.subTest(email=email):
                self.as_user(email)
                r = self.client.get(f"/submissions/{attempt_id}/file")
                self.assertEqual(r.status_code, status)
                r.close()

    def test_instructor_sees_every_attempt_and_none_are_lost(self):
        before = self.query("SELECT COUNT(*) FROM attempts")[0][0]
        aid = self.create(due="2020-01-01")
        self.as_user(AYESHA)
        self.take(aid, [2, 1, 1])
        self.as_user(INSTRUCTOR)
        page = self.client.get(f"/teach/data-2026-10/assessments/{aid}/attempts").text
        self.assertIn("Ayesha Farooq", page)
        self.assertIn("late", page)
        draft = self.client.get("/teach/data-2026-10/assessments/9002/attempts").text
        self.assertIn("Ayesha Farooq", draft)  # draft assessments' imported attempts too
        self.assertIn("77", draft)
        self.assertEqual(self.query("SELECT COUNT(*) FROM attempts")[0][0], before + 1)


if __name__ == "__main__":
    unittest.main()
