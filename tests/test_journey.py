"""The first build's one journey, on the real seed data. If this fails, the floor is broken.

Admin creates a learner -> an instructor builds and publishes a cohort with a page and a
2-question quiz -> the learner enrols and scores 100 -> the instructor sees that score.
"""
import re
import shutil
import tempfile
import unittest
from contextlib import closing
from datetime import date, timedelta
from pathlib import Path

import auth
import importer
from app import app

ADMIN = "imran.doyle@brightpath.example"
INSTRUCTOR = "niamh.price@brightpath.example"
LEARNER = "robin.okoye@example.com"


class JourneyTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.dir = Path(tempfile.mkdtemp())
        cls.db = cls.dir / "journey.db"
        importer.import_all(cls.db, importer.SEED_DIR)
        with closing(auth.connect(cls.db)) as db:
            auth.seed_default_passwords(db)
        app.config.update(DB_PATH=cls.db, UPLOAD_DIR=cls.dir / "uploads", TESTING=True)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir)

    def post(self, path, data=None):
        with self.client.session_transaction() as s:
            token = s.setdefault("csrf", "test-token")
        return self.client.post(path, data={**(data or {}), "csrf_token": token}, follow_redirects=True)

    def as_user(self, email, password="brightpath"):
        self.client = app.test_client()
        r = self.post("/signin", {"email": email, "password": password})
        self.assertEqual(r.status_code, 200)

    def test_the_one_journey(self):
        # 1. The BrightPath administrator creates the learner.
        self.as_user(ADMIN)
        r = self.post("/admin/learners/new", {"full_name": "Robin Okoye", "email": LEARNER,
                                              "password": "robin-start-pw"})
        self.assertIn("Robin Okoye created.", r.text)

        # 2. The instructor creates a cohort, a published page and a published 2-question quiz.
        self.as_user(INSTRUCTOR)
        start = date.today()
        r = self.post("/teach/new", {"title": "Data Storytelling", "cohort": "Mar 2027",
                                     "starts_on": start.isoformat(),
                                     "ends_on": (start + timedelta(days=90)).isoformat()})
        self.assertIn("created as a draft", r.text)
        course_id = r.request.path.split("/")[2]

        r = self.post(f"/teach/{course_id}/pages", {"title": "Welcome"})
        page_path = r.request.path
        self.post(page_path, {"title": "Welcome", "body": "Stories beat spreadsheets."})
        self.assertIn("Page is now published.", self.post(f"{page_path}/status", {"action": "publish"}).text)

        r = self.post(f"/teach/{course_id}/assessments/new", {"type": "Quiz", "title": "Story check"})
        quiz_path = r.request.path
        assessment_id = quiz_path.rsplit("/", 1)[1]
        for text in ("Best chart for a trend?", "Lead with?"):
            self.assertIn("Question added.", self.post(f"{quiz_path}/questions",
                                                       {"text": text, "options": "Right\nWrong", "correct": 1}).text)
        self.assertIn("Now published.", self.post(f"{quiz_path}/status", {"action": "publish"}).text)
        self.assertIn("Cohort is now published.", self.post(f"/teach/{course_id}/status", {"action": "publish"}).text)

        # 3. The learner signs in, enrols, reads the page and scores 100.
        self.as_user(LEARNER, "robin-start-pw")
        self.assertIn("Data Storytelling", self.client.get("/courses").text)
        self.assertIn("You are enrolled on Data Storytelling", self.post(f"/courses/{course_id}/enrol").text)
        self.assertIn("Stories beat spreadsheets.", self.client.get(page_path.replace("/teach/", "/learn/")).text)
        take = f"/learn/{course_id}/assessments/{assessment_id}"
        form = self.client.get(take).text
        qids = sorted(set(re.findall(r'name="q(\d+)"', form)))
        self.assertEqual(len(qids), 2, "the quiz should show two questions")
        self.assertIn("You scored 100.", self.post(take, {f"q{q}": 1 for q in qids}).text)

        # 4. The instructor sees Robin's 100 in the results report.
        self.as_user(INSTRUCTOR)
        results = self.client.get(f"/teach/results/{course_id}").text
        robin = re.search(r"<tr>\s*<td>Robin Okoye</td>.*?</tr>", results, re.S)
        self.assertIsNotNone(robin, "Robin should have a row in the results")
        self.assertIn("<td>100</td>", robin.group())


if __name__ == "__main__":
    unittest.main()
