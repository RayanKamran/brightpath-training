import shutil
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

import auth
import importer
from app import app
from test_importer import SAMPLE

EXTRA = {
    "clients.csv": "CL02,Harbour Bank,Financial services,harbourbank.example,2024-06-01,,7000\n",
    "staff.csv": "S003,Imran Price,imran.price@brightpath.example,administrator,,,2025-08-01,2020-03-31\n"
                 "S004,Pablo Kowalski,pablo.kowalski@harbourbank.example,administrator,CL01,,2025-01-20,\n",
    "courses.csv": "data-2026-02,Data Analysis,Data,\"Numbers, honestly.\",Feb 2026,2026-02-01,2026-09-30,241\n",
    "course_staff.csv": "data-2026-02,S008,lead,2026-02-01,2026-03-01\n",
    "learners.csv": "102,Mariam Byrne,Mariam.Byrne@example.com,CL01,HR,2025-05-03,S001,deactivated\n"
                    "103,Arjun Bhatti,arjun@example.com,CL02,HR,2025-05-03,S001,active\n",
}


class AppTestCase(unittest.TestCase):
    """Sample data imported into a temp DB, plus a test client that sends CSRF tokens."""
    EXTRA = EXTRA

    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        seed = self.dir / "seed"
        seed.mkdir()
        for name, text in SAMPLE.items():
            (seed / name).write_text(text + self.EXTRA.get(name, ""), encoding="utf-8")
        self.db = self.dir / "test.db"
        importer.import_all(self.db, seed)
        with closing(auth.connect(self.db)) as db:
            auth.seed_default_passwords(db)
        app.config.update(DB_PATH=self.db, UPLOAD_DIR=self.dir / "uploads", TESTING=True)
        self.client = app.test_client()

    def tearDown(self):
        shutil.rmtree(self.dir)

    def post(self, path, data=None, **kwargs):
        with self.client.session_transaction() as s:
            token = s.setdefault("csrf", "test-token")
        return self.client.post(path, data={**(data or {}), "csrf_token": token}, **kwargs)

    def sign_in(self, email, password="brightpath"):
        return self.post("/signin", data={"email": email, "password": password}, follow_redirects=True)

    def sign_out(self):
        self.post("/signout")


class AuthTest(AppTestCase):

    def test_each_role_lands_on_its_own_home(self):
        cases = [
            ("imran.doyle@brightpath.example", "/admin", ["Imran Doyle", "BrightPath", "4 learners"]),
            ("ana.grey@brightpath.example", "/instructor", ["Ana Grey", "Data Analysis", "Oct 2025"]),
            ("ayesha@example.com", "/learner", ["Ayesha Farooq", "Data Analysis", "Pass"]),
        ]
        for email, home, texts in cases:
            with self.subTest(email=email):
                r = self.sign_in(email)
                self.assertEqual(r.request.path, home)
                for text in texts:
                    self.assertIn(text, r.text)
                self.sign_out()

    def test_instructor_sees_only_current_assignments(self):
        r = self.sign_in("ana.grey@brightpath.example")
        self.assertNotIn("Feb 2026", r.text)

    def test_wrong_password_and_unknown_email_get_the_same_message(self):
        for email, password in [("ayesha@example.com", "nope"), ("nobody@example.com", "brightpath")]:
            r = self.sign_in(email, password)
            self.assertEqual(r.request.path, "/signin")
            self.assertIn(auth.WRONG, r.text)

    def test_deactivated_and_left_cannot_sign_in(self):
        for email in ["mariam.byrne@example.com", "imran.price@brightpath.example"]:
            with self.subTest(email=email):
                r = self.sign_in(email)
                self.assertEqual(r.request.path, "/signin")
                self.assertIn(auth.DEACTIVATED, r.text)
                r = self.sign_in(email, "wrong")
                self.assertIn(auth.WRONG, r.text)
                self.assertNotIn(auth.DEACTIVATED, r.text)

    def test_other_roles_pages_are_refused_by_the_server(self):
        for email, refused in [("ayesha@example.com", ["/admin", "/instructor", "/admin/data"]),
                               ("ana.grey@brightpath.example", ["/admin", "/learner"]),
                               ("imran.doyle@brightpath.example", ["/instructor", "/learner"])]:
            self.sign_in(email)
            for path in refused:
                with self.subTest(email=email, path=path):
                    self.assertEqual(self.client.get(path).status_code, 403)
            self.sign_out()

    def test_signed_out_is_sent_to_sign_in(self):
        for path in ["/", "/admin", "/instructor", "/learner", "/admin/data"]:
            r = self.client.get(path)
            self.assertEqual(r.status_code, 302)
            self.assertTrue(r.location.endswith("/signin"))

    def test_client_admin_is_scoped_to_their_client(self):
        r = self.sign_in("pablo.kowalski@harbourbank.example")
        self.assertEqual(r.request.path, "/admin")
        self.assertIn("Northwind Logistics", r.text)
        self.assertIn("2 learners", r.text)
        self.assertEqual(self.client.get("/admin/data").status_code, 403)
        self.sign_out()
        self.sign_in("imran.doyle@brightpath.example")
        self.assertEqual(self.client.get("/admin/data").status_code, 200)

    def test_deactivated_while_signed_in_is_signed_out(self):
        self.sign_in("ayesha@example.com")
        self.assertEqual(self.client.get("/learner").status_code, 200)
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("UPDATE learners SET account_status = 'deactivated' WHERE learner_id = '100'")
            db.commit()
        r = self.client.get("/learner")
        self.assertEqual(r.status_code, 302)
        self.assertTrue(r.location.endswith("/signin"))

    def test_sign_out(self):
        self.sign_in("ayesha@example.com")
        self.sign_out()
        self.assertEqual(self.client.get("/learner").status_code, 302)

    def test_email_is_case_insensitive(self):
        r = self.sign_in("  Ayesha@Example.COM ")
        self.assertEqual(r.request.path, "/learner")

    def test_passwords_are_hashed_and_reseeding_keeps_changes(self):
        with closing(auth.connect(self.db)) as db:
            hashes = [h for (h,) in db.execute("SELECT hash FROM passwords")]
            self.assertEqual(len(hashes), 4 + 4)  # staff + learners in the sample
            self.assertNotIn("brightpath", hashes)
            db.execute("UPDATE passwords SET hash = 'changed' WHERE email = 'ayesha@example.com'")
            db.commit()
            auth.seed_default_passwords(db)
            self.assertEqual(db.execute("SELECT hash FROM passwords WHERE email = 'ayesha@example.com'")
                             .fetchone()[0], "changed")


if __name__ == "__main__":
    unittest.main()
