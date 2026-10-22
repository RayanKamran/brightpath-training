import csv
import io
import shutil
import sqlite3
import tempfile
import time
import unittest
from contextlib import closing
from pathlib import Path

import auth
import importer
import reports
import test_assessments  # module import, so its test class isn't collected a second time here
from test_auth import AppTestCase

ADMIN = "imran.doyle@brightpath.example"            # S001, BrightPath
CLIENT_ADMIN = "pablo.kowalski@harbourbank.example"  # S004, administrator for CL01 (Northwind) in the sample
INSTRUCTOR = "ana.grey@brightpath.example"           # S008: data-2025-10, data-2026-10 (current), data-2026-02 (past)
OTHER_INSTRUCTOR = "kian.mackay@brightpath.example"  # S010, teaches nothing

BASE = test_assessments.EXTRA
EXTRA = {
    **BASE,
    "learners.csv": BASE["learners.csv"]
    + "108,Nadia Nodept,nadia@example.com,CL02,,2025-05-03,S001,active\n"
    + '109,"=HYPERLINK(""http://x"")",formula@example.com,CL01,HR,2025-05-03,S001,active\n',
    "enrolments.csv": BASE["enrolments.csv"]
    + "E9,102,writing-2025-10,2025-05-01,,Distinction,0,0,S001\n"
    + "E10,105,writing-2025-10,2025-05-01,,Fail,0,0,S001\n"
    + "E11,108,writing-2025-10,2025-05-01,,Pass,0,0,S001\n"
    + "E12,109,writing-2026-10,2026-09-01,,Pass,0,0,S001\n",
    "attempts.csv": BASE["attempts.csv"] + "A7,9001,103,data-2026-10,2099-02-01,90,\n",
}
# All 12 enrolments, by client / department (worked out by hand):
#   Northwind (CL01) HR: E1 Pass, E5 In progress, E6 In progress, E9 Distinction, E12 Pass -> 3 / 3 = 100.0%
#   Harbour Bank (CL02) HR: E3 Fail+withdrawn_on = Withdrawn, E8 In progress -> 0 / 1 = 0.0%
#   Harbour Bank (CL02) No department: E11 Pass -> 100.0%; Harbour total 1 / 2 = 50.0%
#   Orchard (CL03) Sales: E10 Fail -> 0.0%;  Tiny Co (CL04) Finance: E4 Withdrawn (no date) -> 0.0%
#   No client: E2, E7 Withdrawn -> 0.0%
#   Grand total: 12 = Pass 3, Distinction 1, Fail 1, Withdrawn 4, In progress 3 -> 4 / 9 = 44.4%


class ReportsTest(AppTestCase):
    EXTRA = EXTRA

    def as_user(self, email):
        self.sign_out()
        self.sign_in(email)

    def rows(self, scope=None, course=None):
        with closing(auth.connect(self.db)) as db:
            return {(r["level"], r["label"]): r for r in reports.completion(db, scope, course)}

    def counts(self, row):
        return [row["enrolments"]] + [row["counts"][c] for c in reports.OUTCOMES] + [row["pct"]]

    def csv_rows(self, response):
        self.assertEqual(response.mimetype, "text/csv")
        self.assertIn("attachment", response.headers["Content-Disposition"])
        return list(csv.reader(io.StringIO(response.get_data(as_text=True))))

    # --- completion -------------------------------------------------------------

    def test_completion_counts_and_percentages(self):
        rows = self.rows()
        self.assertEqual(self.counts(rows[("total", "All clients")]), [12, 3, 1, 1, 4, 3, "44.4%"])
        self.assertEqual(self.counts(rows[("client", "Northwind Logistics")]), [5, 2, 1, 0, 0, 2, "100.0%"])
        self.assertEqual(self.counts(rows[("department", "Northwind Logistics / HR")]), [5, 2, 1, 0, 0, 2, "100.0%"])
        self.assertEqual(self.counts(rows[("client", "Harbour Bank")]), [3, 1, 0, 0, 1, 1, "50.0%"])
        self.assertEqual(self.counts(rows[("department", "Harbour Bank / HR")]), [2, 0, 0, 0, 1, 1, "0.0%"])
        self.assertEqual(self.counts(rows[("department", "Harbour Bank / No department")]), [1, 1, 0, 0, 0, 0, "100.0%"])
        self.assertEqual(self.counts(rows[("client", "No client")]), [2, 0, 0, 0, 2, 0, "0.0%"])
        self.assertEqual(reports.pct(dict.fromkeys(reports.OUTCOMES, 0) | {"In progress": 5}), "—")

    def test_totals_add_up(self):
        rows = list(self.rows().values())
        clients = [r for r in rows if r["level"] == "client"]
        self.assertEqual(sum(r["enrolments"] for r in clients), 12)
        for client in clients:
            depts = [r for r in rows if r["level"] == "department" and r["label"].startswith(client["label"] + " /")]
            self.assertEqual(sum(r["enrolments"] for r in depts), client["enrolments"])

    def test_course_filter(self):
        rows = self.rows(course="Technical Writing")
        self.assertEqual(self.counts(rows[("total", "All clients")]), [4, 2, 1, 1, 0, 0, "75.0%"])
        self.assertNotIn(("client", "No client"), rows)

    def test_admin_page_and_csv(self):
        self.sign_in(ADMIN)
        page = self.client.get("/admin/reports/completion").text
        for text in ["All clients", "44.4%", "Northwind Logistics", "Harbour Bank / No department", "No client"]:
            self.assertIn(text, page)
        data = self.csv_rows(self.client.get("/admin/reports/completion/csv"))
        self.assertEqual(data[0], ["Client", "Department", "Enrolments", "Pass", "Distinction", "Fail", "Withdrawn",
                                   "In progress", "Completion %"])
        self.assertIn(["All clients", "", "12", "3", "1", "1", "4", "3", "44.4%"], data)
        self.assertIn(["Harbour Bank", "No department", "1", "1", "0", "0", "0", "0", "100.0%"], data)
        filtered = self.csv_rows(self.client.get("/admin/reports/completion/csv?course=Technical+Writing"))
        self.assertIn(["All clients", "", "4", "2", "1", "1", "0", "0", "75.0%"], filtered)

    def test_client_admin_sees_only_their_client(self):
        self.sign_in(CLIENT_ADMIN)
        page = self.client.get("/admin/reports/completion").text
        self.assertIn("Northwind Logistics", page)
        for other in ["Harbour Bank", "Orchard", "Tiny Co", "No client", "All clients"]:
            self.assertNotIn(other, page)
        data = self.csv_rows(self.client.get("/admin/reports/completion/csv"))
        self.assertEqual([r[:2] for r in data[1:]], [["Northwind Logistics", ""], ["Northwind Logistics", "HR"]])

    def test_completion_is_for_administrators_only(self):
        for email in [INSTRUCTOR, "ayesha@example.com"]:
            self.as_user(email)
            self.assertEqual(self.client.get("/admin/reports/completion").status_code, 403)
            self.assertEqual(self.client.get("/admin/reports/completion/csv").status_code, 403)

    # --- instructor results -----------------------------------------------------

    def test_results_grid(self):
        self.sign_in(INSTRUCTOR)
        page = self.client.get("/teach/results/data-2026-10").text
        self.assertIn("weights are not used", page)
        for text in ["Imported quiz", "Imported draft", "Old essay", "90 (late)", "unmarked", "77",
                     "90 · 2 of 3", "77 · 1 of 3", "— · 0 of 3", "2026-10-10"]:
            self.assertIn(text, page)
        data = self.csv_rows(self.client.get("/teach/results/data-2026-10/csv"))
        self.assertEqual(data[0][:5], ["Learner", "Email", "Attempt", "Outcome", "Withdrawn on"])
        self.assertIn("Imported quiz (9001)", data[0])
        by_name = {r[0]: r for r in data[1:]}
        self.assertEqual(by_name["Arjun Bhatti"][5:], ["90 (late)", "", "unmarked", "90", "2", "3"])
        self.assertEqual(by_name["Ayesha Farooq"][2], "2")  # her retake: attempt 2 on this course
        self.assertEqual(by_name["Eoin Okafor"][4], "2026-10-10")

    def test_formula_cells_are_escaped(self):
        self.sign_in(INSTRUCTOR)
        # writing-2026-10's only learner has a formula-like name: give Ana that cohort and download it
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("INSERT INTO course_staff VALUES ('writing-2026-10', 'S008', 'lead', '2026-10-01', NULL)")
            db.commit()
        self.assertIn("=HYPERLINK", self.client.get("/teach/results/writing-2026-10").text)  # plain text on the page
        data = self.csv_rows(self.client.get("/teach/results/writing-2026-10/csv"))
        self.assertEqual(data[1][0], "'=HYPERLINK(\"http://x\")")

    def test_results_cohorts_include_past_and_nothing_else(self):
        self.sign_in(INSTRUCTOR)
        page = self.client.get("/teach/results").text
        for course in ["data-2025-10", "data-2026-02", "data-2026-10"]:
            self.assertIn(f"/teach/results/{course}", page)
        self.assertNotIn("/teach/results/writing-2025-10", page)
        self.assertEqual(self.client.get("/teach/results/data-2026-02").status_code, 200)  # past cohort
        self.assertEqual(self.client.get("/teach/results/writing-2025-10").status_code, 403)
        self.assertEqual(self.client.get("/teach/results/writing-2025-10/csv").status_code, 403)
        self.as_user(OTHER_INSTRUCTOR)
        self.assertEqual(self.client.get("/teach/results/data-2026-10").status_code, 403)
        self.as_user(ADMIN)
        self.assertEqual(self.client.get("/teach/results/data-2026-10").status_code, 403)

    def test_results_paging_and_full_csv(self):
        self.sign_in(INSTRUCTOR)
        old, reports.PAGE_SIZE = reports.PAGE_SIZE, 2
        try:
            first = self.client.get("/teach/results/data-2026-10").text
            second = self.client.get("/teach/results/data-2026-10?page=2").text
        finally:
            reports.PAGE_SIZE = old
        self.assertIn("Arjun Bhatti", first)
        self.assertNotIn("Eoin Okafor", first)
        self.assertIn("Eoin Okafor", second)
        self.assertIn("Page 2 of 2", second)
        self.assertEqual(len(self.csv_rows(self.client.get("/teach/results/data-2026-10/csv"))), 1 + 3)


class RealDataSpeedTest(unittest.TestCase):
    """Both reports and both CSVs on the real seed data (all 173,912 attempts) in under 2 seconds each."""

    @classmethod
    def setUpClass(cls):
        cls.dir = Path(tempfile.mkdtemp())
        cls.db_path = cls.dir / "real.db"
        importer.import_all(cls.db_path, importer.SEED_DIR)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir)

    def timed(self, fn):
        start = time.perf_counter()
        fn()
        return time.perf_counter() - start

    def test_reports_are_fast(self):
        with closing(auth.connect(self.db_path)) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM attempts").fetchone()[0], 173912)
            largest = db.execute("SELECT course_id FROM enrolments GROUP BY course_id ORDER BY COUNT(*) DESC "
                                 "LIMIT 1").fetchone()[0]
            for name, fn in [("completion", lambda: reports.completion(db, None, None)),
                             ("completion csv", lambda: reports.completion_csv_rows(reports.completion(db, None, None))),
                             ("results", lambda: reports.results(db, largest)),
                             ("results csv", lambda: reports.results_csv_rows(reports.results(db, largest)))]:
                with self.subTest(report=name):
                    self.assertLess(self.timed(fn), 2.0)


if __name__ == "__main__":
    unittest.main()
