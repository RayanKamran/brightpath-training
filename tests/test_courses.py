import io
import re
import sqlite3
import unittest
from contextlib import closing

from test_auth import AppTestCase
from test_people import PEOPLE_EXTRA

INSTRUCTOR = "ana.grey@brightpath.example"       # S008, current lead of data-2025-10
OTHER_INSTRUCTOR = "kian.mackay@brightpath.example"  # S010, teaches nothing
LEARNER = "ayesha@example.com"                   # 100, enrolled on data-2025-10
NOT_ENROLLED = "arjun@example.com"               # 103

PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 32
JPG = b"\xff\xd8\xff\xe0" + b"\0" * 32
GIF = b"GIF89a" + b"\0" * 32
PDF = b"%PDF-1.4\n" + b"\0" * 32


class CoursesTest(AppTestCase):
    EXTRA = {**PEOPLE_EXTRA, "courses.csv": PEOPLE_EXTRA["courses.csv"]
             + 'writing-2025-10,Technical Writing,Communication,"Words.",Oct 2025,2025-10-01,2026-06-19,261\n'}

    def query(self, sql, *args):
        with closing(sqlite3.connect(self.db)) as db:
            return db.execute(sql, args).fetchall()

    def new_page(self, course="data-2025-10", title="Week 1", body="Hello"):
        self.post(f"/teach/{course}/pages", data={"title": title})
        page_id = self.query("SELECT MAX(id) FROM pages")[0][0]
        self.post(f"/teach/{course}/pages/{page_id}", data={"title": title, "body": body})
        return page_id

    def set_page(self, page_id, action, course="data-2025-10"):
        return self.post(f"/teach/{course}/pages/{page_id}/status", data={"action": action}, follow_redirects=True)

    def upload(self, page_id, name, data, course="data-2025-10"):
        return self.post(f"/teach/{course}/pages/{page_id}/files", data={"file": (io.BytesIO(data), name)},
                         content_type="multipart/form-data", follow_redirects=True)

    def create_cohort(self, **fields):
        data = dict(title="Data Analysis", category="Data", description="Numbers.", cohort="Feb 2027",
                    starts_on="2027-02-01", ends_on="2027-09-30")
        data.update(fields)
        return self.post("/teach/new", data=data, follow_redirects=True)

    def as_learner(self, email=LEARNER):
        self.sign_out()
        self.sign_in(email)

    # --- cohorts --------------------------------------------------------------

    def test_instructor_creates_cohort_as_draft_lead(self):
        self.sign_in(INSTRUCTOR)
        r = self.create_cohort()
        self.assertEqual(r.request.path, "/teach/data-analysis-2027-02")
        self.assertEqual(self.query("SELECT status FROM course_status WHERE course_id = 'data-analysis-2027-02'"),
                         [("draft",)])
        self.assertEqual(self.query("SELECT staff_id, role, unassigned_on FROM course_staff "
                                    "WHERE course_id = 'data-analysis-2027-02'"), [("S008", "lead", None)])
        home = self.client.get("/instructor").text
        self.assertIn("Feb 2027", home)
        self.assertIn("draft", home)

    def test_create_cohort_checks_dates(self):
        self.sign_in(INSTRUCTOR)
        r = self.create_cohort(ends_on="2027-01-01")
        self.assertIn("The end date must be on or after the start date.", r.text)
        self.assertEqual(self.query("SELECT 1 FROM courses WHERE cohort = 'Feb 2027'"), [])

    def test_only_assigned_instructors_can_edit(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        self.assertEqual(self.client.get("/teach/data-2026-02").status_code, 403)  # Ana's assignment ended
        self.sign_out()
        self.sign_in(OTHER_INSTRUCTOR)
        for path in ["/teach/data-2025-10", f"/teach/data-2025-10/pages/{page_id}"]:
            self.assertEqual(self.client.get(path).status_code, 403)
        for path, data in [("/teach/data-2025-10/pages", {"title": "X"}),
                           ("/teach/data-2025-10/status", {"action": "unpublish"}),
                           (f"/teach/data-2025-10/pages/{page_id}", {"title": "X", "body": "hacked"}),
                           (f"/teach/data-2025-10/pages/{page_id}/status", {"action": "publish"})]:
            self.assertEqual(self.post(path, data=data).status_code, 403)
        self.assertEqual(self.upload(page_id, "a.png", PNG).status_code, 403)
        self.assertEqual(self.query("SELECT body, status FROM pages"), [("Hello", "draft")])
        self.as_learner()
        self.assertEqual(self.client.get("/teach/data-2025-10").status_code, 403)

    def test_learners_never_see_draft_pages(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page(title="Week 6: Regression")
        self.as_learner()
        self.assertNotIn("Week 6", self.client.get("/learn/data-2025-10").text)
        self.assertEqual(self.client.get(f"/learn/data-2025-10/pages/{page_id}").status_code, 404)
        self.sign_out()
        self.sign_in(INSTRUCTOR)
        self.set_page(page_id, "publish")
        self.as_learner()
        self.assertIn("Week 6", self.client.get("/learn/data-2025-10").text)
        self.assertEqual(self.client.get(f"/learn/data-2025-10/pages/{page_id}").status_code, 200)
        self.sign_out()
        self.sign_in(INSTRUCTOR)
        self.set_page(page_id, "unpublish")
        self.as_learner()
        self.assertEqual(self.client.get(f"/learn/data-2025-10/pages/{page_id}").status_code, 404)
        self.assertEqual(self.query("SELECT status FROM pages WHERE id = ?", page_id), [("draft",)])

    def test_published_page_in_draft_cohort_is_hidden(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        self.set_page(page_id, "publish")
        with closing(sqlite3.connect(self.db)) as db:
            db.execute("INSERT INTO course_status VALUES ('data-2025-10', 'draft')")
            db.commit()
        self.as_learner()
        self.assertEqual(self.client.get("/learn/data-2025-10").status_code, 404)
        self.assertEqual(self.client.get(f"/learn/data-2025-10/pages/{page_id}").status_code, 404)

    def test_learner_not_enrolled_sees_nothing(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        self.set_page(page_id, "publish")
        self.as_learner(NOT_ENROLLED)
        self.assertEqual(self.client.get("/learn/data-2025-10").status_code, 404)
        self.assertEqual(self.client.get(f"/learn/data-2025-10/pages/{page_id}").status_code, 404)

    def test_cohort_with_learners_cannot_be_unpublished(self):
        self.sign_in(INSTRUCTOR)
        r = self.post("/teach/data-2025-10/status", data={"action": "unpublish"}, follow_redirects=True)
        self.assertIn("can&#39;t be unpublished", r.text)
        self.assertEqual(self.query("SELECT * FROM course_status"), [])
        self.create_cohort()
        self.post("/teach/data-analysis-2027-02/status", data={"action": "publish"})
        self.post("/teach/data-analysis-2027-02/status", data={"action": "unpublish"})
        self.assertEqual(self.query("SELECT status FROM course_status"), [("draft",)])

    def test_text_is_escaped_and_keeps_paragraphs(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page(body="<script>alert(1)</script>\n\nSecond paragraph")
        self.set_page(page_id, "publish")
        self.as_learner()
        page = self.client.get(f"/learn/data-2025-10/pages/{page_id}").text
        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;\n\nSecond paragraph", page)
        self.assertNotIn("<script>alert", page)
        self.assertIn("white-space: pre-line", page)

    def test_copy_only_from_earlier_cohorts_of_the_same_course(self):
        self.sign_in(INSTRUCTOR)
        source = self.new_page(title="Week 1", body="Copied text")
        self.upload(source, "chart.png", PNG)
        self.set_page(source, "publish")
        self.create_cohort()
        page = self.client.get("/teach/data-analysis-2027-02").text
        offered = re.findall(r'<option value="([^"]+)"', page)
        self.assertEqual(sorted(offered), ["data-2025-10", "data-2026-02"])
        self.assertEqual(self.post("/teach/data-analysis-2027-02/copy", data={"source": "writing-2025-10"})
                         .status_code, 400)
        self.post("/teach/data-analysis-2027-02/copy", data={"source": "data-2025-10"})
        self.assertEqual(self.query("SELECT title, body, status FROM pages WHERE course_id = 'data-analysis-2027-02'"),
                         [("Week 1", "Copied text", "draft")])
        self.assertEqual(len(self.query("SELECT 1 FROM page_files")), 2)
        self.assertEqual(len(self.query("SELECT DISTINCT stored_name FROM page_files")), 1)
        later = self.client.get("/teach/data-2025-10").text  # an earlier cohort can't copy from a later one
        self.assertNotIn('value="data-analysis-2027-02"', later)

    # --- files ------------------------------------------------------------------

    def test_files_are_shown_images_then_pdfs(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        for name, data in [("b.gif", GIF), ("notes.pdf", PDF), ("a.png", PNG), ("c.jpg", JPG)]:
            self.assertIn("uploaded", self.upload(page_id, name, data).text)
        self.set_page(page_id, "publish")
        self.as_learner()
        page = self.client.get(f"/learn/data-2025-10/pages/{page_id}").text
        order = re.findall(r'alt="([^"]+)"|>(notes\.pdf)<', page)
        self.assertEqual([a or b for a, b in order], ["b.gif", "a.png", "c.jpg", "notes.pdf"])
        self.assertLess(page.index("Hello"), page.index('alt="b.gif"'))

    def test_bad_uploads_are_refused(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        self.assertIn("Only PNG, JPG, GIF and PDF files", self.upload(page_id, "tool.exe", b"MZ" + b"\0" * 10).text)
        self.assertIn("isn&#39;t really a PNG", self.upload(page_id, "fake.png", b"just some text").text)
        self.assertIn("larger than 10 MB", self.upload(page_id, "big.pdf", b"%PDF-" + b"\0" * (11 * 1024 * 1024)).text)
        self.assertEqual(self.query("SELECT * FROM page_files"), [])

    def test_file_access_follows_page_rules(self):
        self.sign_in(INSTRUCTOR)
        page_id = self.new_page()
        self.upload(page_id, "notes.pdf", PDF)
        file_id, stored = self.query("SELECT id, stored_name FROM page_files")[0]
        r = self.client.get(f"/files/{file_id}")  # instructor preview of a draft page's file
        self.assertEqual(r.status_code, 200)
        r.close()
        self.as_learner()
        self.assertEqual(self.client.get(f"/files/{file_id}").status_code, 404)   # page is a draft
        self.sign_out()
        self.sign_in(INSTRUCTOR)
        self.set_page(page_id, "publish")
        self.as_learner()
        r = self.client.get(f"/files/{file_id}")
        self.assertEqual((r.status_code, r.mimetype), (200, "application/pdf"))
        self.assertIn("inline", r.headers["Content-Disposition"])
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        r.close()
        self.as_learner(NOT_ENROLLED)
        self.assertEqual(self.client.get(f"/files/{file_id}").status_code, 404)
        self.sign_out()
        self.sign_in(OTHER_INSTRUCTOR)
        self.assertEqual(self.client.get(f"/files/{file_id}").status_code, 404)
        self.assertEqual(self.post(f"/teach/data-2025-10/pages/{page_id}/files/{file_id}/remove").status_code, 403)
        self.sign_out()
        self.sign_in(INSTRUCTOR)
        self.post(f"/teach/data-2025-10/pages/{page_id}/files/{file_id}/remove")
        self.as_learner()
        self.assertEqual(self.client.get(f"/files/{file_id}").status_code, 404)
        self.assertEqual(self.query("SELECT removed_by FROM page_files"), [("S008",)])
        self.assertTrue((self.dir / "uploads" / stored).exists())


if __name__ == "__main__":
    unittest.main()
