import io
import sqlite3
import unittest
from contextlib import closing
from datetime import date

import importer
import test_courses  # module import, so its test class isn't collected (and run) a second time here
from test_auth import AppTestCase

ADMIN = "imran.doyle@brightpath.example"            # S001, BrightPath
CLIENT_ADMIN = "pablo.kowalski@harbourbank.example"  # S004, CL01 in the sample
INSTRUCTOR = "ana.grey@brightpath.example"           # S008
AYESHA = "ayesha@example.com"     # 100, CL01: Pass on data-2025-10 (finished)
ARJUN = "arjun@example.com"       # 103, CL02: imported Fail *with* withdrawn_on on data-2025-10
TOM = "tom@tiny.example"          # 104, CL04: imported outcome Withdrawn *without* withdrawn_on
UMA = "uma@example.com"           # 107, CL01: unfinished run on data-2026-02, which has ended

BASE = test_courses.CoursesTest.EXTRA
ENROLMENT_EXTRA = {
    **BASE,
    "courses.csv": BASE["courses.csv"]
    + 'data-2026-10,Data Analysis,Data,"Numbers.",Oct 2026,2026-10-01,2099-06-20,0\n'
    + 'data-2098-02,Data Analysis,Data,"Numbers.",Feb 2098,2098-02-01,2098-09-30,0\n'
    + 'writing-2026-10,Technical Writing,Communication,"Words.",Oct 2026,2026-10-01,2099-01-01,0\n',
    "course_staff.csv": BASE["course_staff.csv"] + "data-2026-10,S008,lead,2026-10-01,\n",
    "learners.csv": BASE["learners.csv"] + "107,Uma Unfinished,uma@example.com,CL01,HR,2025-05-03,S001,active\n",
    "enrolments.csv": BASE.get("enrolments.csv", "")
    + "E3,103,data-2025-10,2025-05-01,2025-11-01,Fail,0,10,S001\n"
    + "E4,104,data-2025-10,2025-05-01,,Withdrawn,0,10,self\n"
    + "E5,107,data-2026-02,2026-01-10,,In progress,0,10,self\n",
}


class EnrolmentTest(AppTestCase):
    EXTRA = ENROLMENT_EXTRA

    def query(self, sql, *args):
        with closing(sqlite3.connect(self.db)) as db:
            return db.execute(sql, args).fetchall()

    def execute(self, sql, *args):
        with closing(sqlite3.connect(self.db)) as db:
            db.execute(sql, args)
            db.commit()

    def as_user(self, email):
        self.sign_out()
        self.sign_in(email)

    def enrol(self, course):
        return self.post(f"/courses/{course}/enrol", follow_redirects=True)

    def enrolment(self, learner, course):
        rows = self.query("SELECT enrolment_id, enrolled_by, outcome, previous_attempts, withdrawn_on "
                          "FROM enrolments WHERE learner_id = ? AND course_id = ?", learner, course)
        return rows[0] if rows else None

    def published_page(self, course):
        """Ana publishes a page with a PDF on the cohort; returns (page_id, file_id)."""
        self.as_user(INSTRUCTOR)
        self.post(f"/teach/{course}/pages", data={"title": "Week 1"})
        page_id = self.query("SELECT MAX(id) FROM pages")[0][0]
        self.post(f"/teach/{course}/pages/{page_id}/files", data={"file": (io.BytesIO(test_courses.PDF), "a.pdf")},
                  content_type="multipart/form-data")
        self.post(f"/teach/{course}/pages/{page_id}/status", data={"action": "publish"})
        return page_id, self.query("SELECT MAX(id) FROM page_files")[0][0]

    def can_read(self, course, page_id, file_id):
        page = self.client.get(f"/learn/{course}/pages/{page_id}").status_code
        r = self.client.get(f"/files/{file_id}")
        r.close()
        return page, r.status_code

    # --- self-enrolment ---------------------------------------------------------

    def test_learner_enrols_in_open_cohort_and_both_runs_show(self):
        self.sign_in(AYESHA)
        r = self.enrol("data-2026-10")
        self.assertIn("You are enrolled on Data Analysis — Oct 2026.", r.text)
        eid, by, outcome, attempts, withdrawn = self.enrolment("100", "data-2026-10")
        self.assertEqual((eid, by, outcome, attempts, withdrawn), ("E000006", "self", "In progress", 1, None))
        home = self.client.get("/learner").text
        self.assertIn("Oct 2025", home)
        self.assertIn("Oct 2026", home)
        self.assertIn("Attempt 2", home)

    def test_catalogue_lists_only_open_cohorts(self):
        self.execute("INSERT INTO course_status VALUES ('data-2098-02', 'draft')")
        self.sign_in(AYESHA)
        page = self.client.get("/courses").text
        self.assertIn("/courses/data-2026-10/enrol", page)
        self.assertIn("/courses/writing-2026-10/enrol", page)
        for closed in ["data-2026-02", "data-2025-10", "data-2098-02"]:
            self.assertNotIn(f"/courses/{closed}/enrol", page)

    def test_closed_cohorts_and_repeats_are_refused(self):
        self.execute("INSERT INTO course_status VALUES ('data-2098-02', 'draft')")
        self.sign_in(AYESHA)
        self.assertIn("isn&#39;t open for enrolment", self.enrol("data-2098-02").text)
        self.assertIn("ended on 2026-09-30", self.enrol("data-2026-02").text)
        self.enrol("data-2026-10")
        self.assertIn("already has an enrolment on Data Analysis — Oct 2026", self.enrol("data-2026-10").text)
        self.assertEqual(self.query("SELECT COUNT(*) FROM enrolments WHERE learner_id = '100'"), [(2,)])

    def test_active_run_blocks_another_cohort_of_the_same_course(self):
        self.sign_in(ARJUN)  # his imported run is withdrawn (by date), so he can retake
        self.enrol("data-2026-10")
        self.assertEqual(self.enrolment("103", "data-2026-10")[3], 1)
        r = self.enrol("data-2098-02")
        self.assertIn("already taking Data Analysis — Oct 2026", r.text)
        self.assertIsNone(self.enrolment("103", "data-2098-02"))
        self.enrol("writing-2026-10")  # a different course is fine
        self.assertIsNotNone(self.enrolment("103", "writing-2026-10"))
        eid = self.enrolment("103", "data-2026-10")[0]
        self.post(f"/enrolments/{eid}/withdraw")
        self.enrol("data-2098-02")
        self.assertEqual(self.enrolment("103", "data-2098-02")[3], 2)

    def test_unfinished_run_on_an_ended_cohort_does_not_block_a_retake(self):
        self.sign_in(UMA)
        r = self.enrol("data-2026-10")
        self.assertIn("You are enrolled", r.text)
        self.assertEqual(self.enrolment("107", "data-2026-10")[3], 1)
        self.assertEqual(self.enrolment("107", "data-2026-02")[2], "In progress")  # old run untouched

    # --- withdrawing -------------------------------------------------------------

    def test_learner_withdraws_and_loses_access_but_keeps_the_record(self):
        page_id, file_id = self.published_page("data-2026-10")
        self.as_user(AYESHA)
        self.enrol("data-2026-10")
        self.assertEqual(self.can_read("data-2026-10", page_id, file_id), (200, 200))
        eid = self.enrolment("100", "data-2026-10")[0]
        confirm = self.client.get(f"/enrolments/{eid}/withdraw").text
        self.assertIn("Withdraw from Data Analysis — Oct 2026? You'll lose access to its pages and quizzes.",
                      confirm)
        self.post(f"/enrolments/{eid}/withdraw")
        self.assertEqual(self.enrolment("100", "data-2026-10")[2:],
                         ("Withdrawn", 1, date.today().isoformat()))
        self.assertEqual(self.query("SELECT withdrawn_by FROM withdrawals WHERE enrolment_id = ?", eid), [("self",)])
        self.assertEqual(self.can_read("data-2026-10", page_id, file_id), (404, 404))
        home = self.client.get("/learner").text
        self.assertIn(f"Withdrawn {date.today().isoformat()} by self", home)
        self.assertIn("already has an enrolment on Data Analysis — Oct 2026", self.enrol("data-2026-10").text)

    def test_imported_withdrawals_by_either_field_lose_access(self):
        page_id, file_id = self.published_page("data-2025-10")
        for email, expected in [(AYESHA, (200, 200)), (ARJUN, (404, 404)), (TOM, (404, 404))]:
            with self.subTest(email=email):
                self.as_user(email)
                self.assertEqual(self.can_read("data-2025-10", page_id, file_id), expected)
        self.assertIn("by imported", self.client.get("/learner").text)  # Tom

    def test_cannot_withdraw_someone_elses_enrolment(self):
        self.sign_in(AYESHA)
        self.enrol("data-2026-10")
        eid = self.enrolment("100", "data-2026-10")[0]
        self.as_user(ARJUN)
        self.assertEqual(self.client.get(f"/enrolments/{eid}/withdraw").status_code, 404)
        self.assertEqual(self.post(f"/enrolments/{eid}/withdraw").status_code, 404)
        self.assertEqual(self.enrolment("100", "data-2026-10")[2], "In progress")

    def test_reimport_keeps_app_enrolments_and_withdrawals(self):
        self.sign_in(AYESHA)
        self.enrol("data-2026-10")
        eid = self.enrolment("100", "data-2026-10")[0]
        self.post(f"/enrolments/{eid}/withdraw")
        before = self.query("SELECT * FROM enrolments ORDER BY enrolment_id")
        report = {r["table"]: r for r in importer.import_all(self.db, self.dir / "seed")}
        self.assertEqual(report["enrolments"]["inserted"], 0)
        self.assertEqual(self.query("SELECT * FROM enrolments ORDER BY enrolment_id"), before)

    # --- administrators and instructors ----------------------------------------

    def test_admin_enrols_and_withdraws_and_is_named(self):
        self.sign_in(ADMIN)
        r = self.post("/admin/learners/103/enrol", data={"course_id": "data-2026-10"}, follow_redirects=True)
        self.assertEqual(self.enrolment("103", "data-2026-10")[1], "S001")
        self.assertIn(f"Enrolled {date.today().isoformat()} by Imran Doyle", r.text)
        eid = self.enrolment("103", "data-2026-10")[0]
        r = self.post(f"/admin/enrolments/{eid}/withdraw", follow_redirects=True)
        self.assertIn(f"Withdrawn {date.today().isoformat()} by Imran Doyle", r.text)
        self.assertIn("by imported", r.text)  # his earlier imported withdrawal on Oct 2025

    def test_admin_enrolment_follows_the_same_rules(self):
        self.execute("INSERT INTO course_status VALUES ('data-2098-02', 'draft')")
        self.sign_in(ADMIN)
        for course, message in [("data-2098-02", "isn&#39;t open for enrolment"), ("data-2026-02", "ended on")]:
            r = self.post("/admin/learners/100/enrol", data={"course_id": course}, follow_redirects=True)
            self.assertIn(message, r.text)
        r = self.post("/admin/learners/102/enrol", data={"course_id": "data-2026-10"}, follow_redirects=True)
        self.assertIn("account is deactivated", r.text)
        self.assertIsNone(self.enrolment("102", "data-2026-10"))

    def test_client_admin_only_reaches_their_own_learners(self):
        self.sign_in(CLIENT_ADMIN)
        self.post("/admin/learners/107/enrol", data={"course_id": "data-2026-10"})
        self.assertEqual(self.enrolment("107", "data-2026-10")[1], "S004")
        self.assertEqual(self.post("/admin/learners/103/enrol", data={"course_id": "data-2026-10"}).status_code, 404)
        self.assertEqual(self.post("/admin/enrolments/E3/withdraw").status_code, 404)  # Arjun is CL02
        self.assertIsNone(self.enrolment("103", "data-2026-10"))

    def test_instructor_sees_learners_but_cannot_withdraw(self):
        self.sign_in(INSTRUCTOR)
        page = self.client.get("/teach/data-2025-10/learners").text
        for text in ["Ayesha Farooq", "Eoin Okafor", "Arjun Bhatti", "Tom Tiny", "imported", "self"]:
            self.assertIn(text, page)
        self.assertEqual(self.post("/admin/enrolments/E1/withdraw").status_code, 403)
        self.assertEqual(self.post("/enrolments/E1/withdraw").status_code, 403)
        self.assertEqual(self.client.get("/teach/writing-2026-10/learners").status_code, 403)
        self.as_user(AYESHA)
        self.enrol("data-2026-10")
        self.as_user(INSTRUCTOR)
        self.assertIn("1 enrolment, withdrawn ones included.", self.client.get("/teach/data-2026-10/learners").text)
        self.assertIn("4 enrolments, withdrawn ones included.", self.client.get("/teach/data-2025-10/learners").text)


if __name__ == "__main__":
    unittest.main()
