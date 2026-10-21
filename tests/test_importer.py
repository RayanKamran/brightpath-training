import io
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path

import importer

SAMPLE = {
    "clients.csv": """client_id,name,industry,email_domain,contract_start,contract_end,seats
CL01,Northwind Logistics,Logistics,northwind.example,2024-06-01,,6000
""",
    "staff.csv": """staff_id,full_name,email,role,client_id,specialism,joined_on,left_on
S001,Imran Doyle,imran.doyle@brightpath.example,administrator,,,2024-11-01,
S008,Ana Grey,ana.grey@brightpath.example,instructor,,Data,2025-01-01,
""",
    "courses.csv": """course_id,title,category,description,cohort,starts_on,ends_on,length_days
data-2025-10,Data Analysis,Data,"Numbers, honestly.",Oct 2025,2025-10-01,2026-06-19,261
""",
    "course_staff.csv": """course_id,staff_id,role,assigned_on,unassigned_on
data-2025-10,S008,lead,2025-10-01,
""",
    "learners.csv": """learner_id,full_name,email,client_id,department,account_created_on,created_by,account_status
100,Ayesha Farooq,ayesha@example.com,CL01,HR,2025-04-13,S001,active
101,Eoin Okafor,eoin@example.com,,,,self-signup,active
""",
    "assessments.csv": """assessment_id,course_id,type,title,due_on,weight_pct,author_id,status,published_on
1752,data-2025-10,Assignment,Assignment 1,2025-10-20,10,S008,published,2025-09-14
1753,data-2025-10,Quiz,Quiz 1,,12.5,,draft,
""",
    "enrolments.csv": """enrolment_id,learner_id,course_id,enrolled_on,withdrawn_on,outcome,previous_attempts,activity_clicks,enrolled_by
E1,100,data-2025-10,2025-04-25,,Pass,0,934,S001
E2,101,data-2025-10,,2025-10-13,Withdrawn,0,281,self
""",
    "attempts.csv": """attempt_id,assessment_id,learner_id,course_id,submitted_on,score,graded_by
A1,1752,100,data-2025-10,2025-10-19,78,S008
A2,1753,100,data-2025-10,2025-10-21,,
A3,1753,101,data-2025-10,2025-10-22,64,
""",
}
EXPECTED = {"clients": 1, "staff": 2, "courses": 1, "course_staff": 1,
            "learners": 2, "assessments": 2, "enrolments": 2, "attempts": 3}


class ImporterTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.seed = self.dir / "seed"
        self.seed.mkdir()
        for name, text in SAMPLE.items():
            (self.seed / name).write_text(text, encoding="utf-8")
        self.db = self.dir / "instance" / "test.db"

    def tearDown(self):
        shutil.rmtree(self.dir)

    def run_import(self, **kw):
        return {r["table"]: r for r in importer.import_all(self.db, self.seed, **kw)}

    def counts(self):
        db = sqlite3.connect(self.db)
        try:
            return {t: db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in importer.TABLES}
        finally:
            db.close()

    def append(self, name, line):
        with open(self.seed / name, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def test_clean_import_loads_every_row(self):
        report = self.run_import()
        self.assertEqual(self.counts(), EXPECTED)
        self.assertTrue(all(r["rejected"] == [] and r["present"] == 0 for r in report.values()))

    def test_blank_score_loads_as_ungraded(self):
        report = self.run_import()
        self.assertEqual(report["attempts"]["ungraded"], 1)
        db = sqlite3.connect(self.db)
        self.assertIsNone(db.execute("SELECT score FROM attempts WHERE attempt_id='A2'").fetchone()[0])
        db.close()

    def test_bad_rows_are_rejected_with_reasons(self):
        self.append("enrolments.csv", "E3,999,data-2025-10,2025-05-01,,Pass,0,10,self")
        self.append("enrolments.csv", "E1,101,data-2025-10,2025-05-01,,Pass,0,10,self")
        self.append("enrolments.csv", "E4,101,data-2025-10,2025-13-40,,Pass,0,10,self")
        self.append("attempts.csv", "A4,1752,101,data-2025-10,2025-10-19,abc,S008")
        report = self.run_import()
        reasons = [reason for _, reason in report["enrolments"]["rejected"]]
        self.assertEqual(len(reasons), 3)
        self.assertIn("unknown learner_id '999'", reasons[0])
        self.assertIn("duplicate enrolment_id 'E1'", reasons[1])
        self.assertIn("bad date in enrolled_on '2025-13-40'", reasons[2])
        self.assertIn("score 'abc' is not a whole number", report["attempts"]["rejected"][0][1])
        self.assertEqual(self.counts(), EXPECTED)

    def test_rejection_reasons_are_printed(self):
        self.append("enrolments.csv", "E3,999,data-2025-10,2025-05-01,,Pass,0,10,self")
        self.append("enrolments.csv", "E1,101,data-2025-10,2025-05-01,,Pass,0,10,self")
        self.append("enrolments.csv", "E4,101,data-2025-10,2025-13-40,,Pass,0,10,self")
        out = io.StringIO()
        importer.print_report(importer.import_all(self.db, self.seed), out)
        text = out.getvalue()
        self.assertIn("line 4: unknown learner_id '999'", text)
        self.assertIn("line 5: duplicate enrolment_id 'E1'", text)
        self.assertIn("line 6: bad date in enrolled_on '2025-13-40'", text)
        self.assertIn("1 attempts loaded ungraded", text)
        self.assertIn("3 rejected", text)

    def test_second_run_inserts_nothing(self):
        self.run_import()
        report = self.run_import()
        self.assertEqual(self.counts(), EXPECTED)
        for table, r in report.items():
            self.assertEqual((r["inserted"], r["present"], r["rejected"]), (0, EXPECTED[table], []))

    def test_rerun_keeps_changes_made_in_the_database(self):
        self.run_import()
        db = sqlite3.connect(self.db)
        db.execute("UPDATE attempts SET score = 90 WHERE attempt_id = 'A2'")
        db.commit()
        self.run_import()
        self.assertEqual(db.execute("SELECT score FROM attempts WHERE attempt_id='A2'").fetchone()[0], 90)
        db.close()

    def test_reset_starts_fresh(self):
        self.run_import()
        db = sqlite3.connect(self.db)
        db.execute("DELETE FROM learners WHERE learner_id = '101'")
        db.execute("INSERT INTO clients (client_id, name) VALUES ('CL99', 'Extra')")
        db.commit()
        db.close()
        report = self.run_import(reset=True)
        self.assertEqual(self.counts(), EXPECTED)
        self.assertEqual(report["learners"]["inserted"], 2)


if __name__ == "__main__":
    unittest.main()
