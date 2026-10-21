import sqlite3
import unittest
from contextlib import closing

import importer
from test_auth import EXTRA, AppTestCase

ADMIN = "imran.doyle@brightpath.example"          # BrightPath administrator (S001)
CLIENT_ADMIN = "pablo.kowalski@harbourbank.example"  # administrator for CL01 in the sample

PEOPLE_EXTRA = {
    **EXTRA,
    "clients.csv": EXTRA["clients.csv"]
    + "CL03,Orchard Retail Group,Retail,orchardretail.example,2024-06-01,2020-06-30,3000\n"
    + "CL04,Tiny Co,Retail,tiny.example,2024-06-01,,1\n",
    "staff.csv": EXTRA["staff.csv"]
    + "S010,Kian Mackay,kian.mackay@brightpath.example,instructor,,Delivery,2024-12-01,\n"
    + "S006,Niamh Kowalski,niamh.kowalski@brightpath.example,instructor,,Data,2024-12-01,2020-05-15\n",
    "learners.csv": EXTRA["learners.csv"]
    + "104,Tom Tiny,tom@tiny.example,CL04,Finance,2025-05-03,S001,active\n"
    + "105,Olive Orchard,olive@orchard.example,CL03,Sales,2025-05-03,S001,deactivated\n",
}


class PeopleTest(AppTestCase):
    EXTRA = PEOPLE_EXTRA

    def query(self, sql, *args):
        with closing(sqlite3.connect(self.db)) as db:
            return db.execute(sql, args).fetchall()

    def count(self, table):
        return self.query(f"SELECT COUNT(*) FROM {table}")[0][0]

    def create(self, **fields):
        data = dict(full_name="New Person", email="new@example.com", client_id="CL01",
                    department="HR", password="starting-pw")
        data.update(fields)
        return self.post("/admin/learners/new", data=data, follow_redirects=True)

    # --- CSRF ---------------------------------------------------------------

    def test_posts_without_csrf_token_are_refused(self):
        r = self.client.post("/signin", data={"email": ADMIN, "password": "brightpath"})
        self.assertEqual(r.status_code, 400)
        self.sign_in(ADMIN)
        r = self.client.post("/admin/learners/new", data={"full_name": "X", "email": "x@example.com"})
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.query("SELECT 1 FROM learners WHERE email = 'x@example.com'"), [])

    # --- creating learners ---------------------------------------------------

    def test_admin_creates_a_learner_who_can_sign_in(self):
        self.sign_in(ADMIN)
        r = self.create()
        self.assertIn("New Person", r.text)
        self.assertIn("created", r.text)
        (learner_id, client, dept, by, status), = self.query(
            "SELECT learner_id, client_id, department, created_by, account_status FROM learners "
            "WHERE email = 'new@example.com'")
        self.assertEqual((learner_id, client, dept, by, status), ("106", "CL01", "HR", "S001", "active"))
        self.assertIn("New Person", self.client.get("/admin/learners?q=new@").text)
        self.sign_out()
        self.assertEqual(self.sign_in("new@example.com", "starting-pw").request.path, "/learner")

    def test_duplicate_email_is_refused(self):
        self.sign_in(ADMIN)
        for email in ["AYESHA@example.com", "Ana.Grey@brightpath.example"]:
            r = self.create(email=email)
            self.assertIn("Someone already uses that email", r.text)
        self.assertEqual(self.count("learners"), 6)

    def test_short_password_is_refused(self):
        self.sign_in(ADMIN)
        self.assertIn("at least 8 characters", self.create(password="short").text)

    def test_ended_contract_refused_and_disabled(self):
        self.sign_in(ADMIN)
        form = self.client.get("/admin/learners/new").text
        self.assertRegex(form, r'<option value="CL03" disabled>')
        r = self.create(client_id="CL03")
        self.assertIn("This client&#39;s contract ended on 2020-06-30.", r.text)
        self.assertEqual(self.query("SELECT 1 FROM learners WHERE email = 'new@example.com'"), [])

    def test_over_seats_is_allowed_with_warning(self):
        self.sign_in(ADMIN)
        r = self.create(client_id="CL04", department="Finance")
        self.assertIn("Tiny Co is using 2 of 1 seats.", r.text)
        self.assertEqual(len(self.query("SELECT 1 FROM learners WHERE client_id = 'CL04'")), 2)

    # --- client admin scope ----------------------------------------------------

    def test_client_admin_sees_only_their_client(self):
        self.sign_in(CLIENT_ADMIN)
        page = self.client.get("/admin/learners").text
        self.assertIn("Ayesha Farooq", page)       # CL01
        self.assertNotIn("Arjun Bhatti", page)     # CL02
        self.assertNotIn("Eoin Okafor", page)      # self-signup, no client
        for path in ["/admin/learners/103", "/admin/learners/101"]:
            self.assertEqual(self.client.get(path).status_code, 404)
        for path, data in [("/admin/learners/103/placement", {"department": "HR"}),
                           ("/admin/learners/103/status", {"action": "deactivate"})]:
            self.assertEqual(self.post(path, data=data).status_code, 404)
        self.assertEqual(self.query("SELECT account_status FROM learners WHERE learner_id = '103'"), [("active",)])

    def test_client_admin_creates_only_in_their_client(self):
        self.sign_in(CLIENT_ADMIN)
        self.assertEqual(self.create(client_id="CL02").status_code, 403)
        r = self.post("/admin/learners/new", data=dict(full_name="Own", email="own@example.com",
                                                       department="HR", password="starting-pw"),
                      follow_redirects=True)
        self.assertIn("Own", r.text)
        self.assertEqual(self.query("SELECT client_id FROM learners WHERE email = 'own@example.com'"), [("CL01",)])

    def test_client_admin_changes_department_only(self):
        self.sign_in(CLIENT_ADMIN)
        r = self.post("/admin/learners/100/placement", data={"client_id": "CL02", "department": "HR"})
        self.assertEqual(r.status_code, 403)
        r = self.post("/admin/learners/100/placement", data={"department": "Finance"}, follow_redirects=True)
        self.assertIn("HR → Finance", r.text)
        self.assertIn("Pablo Kowalski", r.text)
        self.assertEqual(self.query("SELECT client_id, department FROM learners WHERE learner_id = '100'"),
                         [("CL01", "Finance")])

    # --- moving, deactivating, reactivating ------------------------------------

    def test_admin_moves_self_signup_into_client(self):
        self.sign_in(ADMIN)
        r = self.post("/admin/learners/101/placement", data={"client_id": "CL02", "department": "Finance"},
                      follow_redirects=True)
        self.assertIn("no client → Harbour Bank", r.text)
        self.assertIn("no department → Finance", r.text)
        r = self.post("/admin/learners/101/placement", data={"client_id": "CL03", "department": "Finance"},
                      follow_redirects=True)
        self.assertIn("contract ended on 2020-06-30", r.text)
        self.assertEqual(self.query("SELECT client_id FROM learners WHERE learner_id = '101'"), [("CL02",)])

    def test_learner_in_ended_client_keeps_it_when_department_changes(self):
        self.sign_in(ADMIN)
        page = self.client.get("/admin/learners/105").text
        self.assertRegex(page, r'<option value="CL03" selected>')
        self.post("/admin/learners/105/placement", data={"client_id": "CL03", "department": "HR"})
        self.assertEqual(self.query("SELECT client_id, department FROM learners WHERE learner_id = '105'"),
                         [("CL03", "HR")])

    def test_deactivate_and_reactivate(self):
        self.sign_in(ADMIN)
        r = self.post("/admin/learners/100/status", data={"action": "deactivate"}, follow_redirects=True)
        self.assertIn("active → deactivated", r.text)
        self.sign_out()
        self.assertIn("deactivated", self.sign_in("ayesha@example.com").text)
        self.sign_in(ADMIN)
        r = self.post("/admin/learners/100/status", data={"action": "reactivate"}, follow_redirects=True)
        self.assertIn("deactivated → active", r.text)
        self.sign_out()
        r = self.sign_in("ayesha@example.com")
        self.assertEqual(r.request.path, "/learner")
        self.assertIn("Pass", r.text)  # old enrolment still there

    def test_reactivate_into_ended_contract_is_refused(self):
        self.sign_in(ADMIN)
        r = self.post("/admin/learners/105/status", data={"action": "reactivate"}, follow_redirects=True)
        self.assertIn("contract ended on 2020-06-30", r.text)
        self.assertEqual(self.query("SELECT account_status FROM learners WHERE learner_id = '105'"),
                         [("deactivated",)])

    def test_reactivate_over_seats_warns(self):
        self.sign_in(ADMIN)
        self.post("/admin/learners/104/status", data={"action": "deactivate"})
        self.create(client_id="CL04", department="Finance")
        r = self.post("/admin/learners/104/status", data={"action": "reactivate"}, follow_redirects=True)
        self.assertIn("Tiny Co is using 2 of 1 seats.", r.text)

    def test_nothing_is_deleted_and_reimport_keeps_new_learners(self):
        self.sign_in(ADMIN)
        before = self.count("learners")
        self.create()
        self.post("/admin/learners/100/status", data={"action": "deactivate"})
        self.post("/admin/learners/101/placement", data={"client_id": "CL02", "department": "HR"})
        self.assertEqual(self.count("learners"), before + 1)
        report = {r["table"]: r for r in importer.import_all(self.db, self.dir / "seed")}
        self.assertEqual(report["learners"]["inserted"], 0)
        self.assertEqual(self.count("learners"), before + 1)
        self.assertEqual(self.query("SELECT account_status FROM learners WHERE learner_id = '100'"),
                         [("deactivated",)])

    # --- cohorts ------------------------------------------------------------

    def current(self, course="data-2025-10"):
        return self.query("SELECT staff_id, role FROM course_staff WHERE course_id = ? AND unassigned_on IS NULL "
                          "ORDER BY role, staff_id", course)

    def test_assign_co_instructor(self):
        self.sign_in(ADMIN)
        self.post("/admin/cohorts/data-2025-10/assign",
                  data={"staff_id": "S010", "role": "co-instructor", "on": "2025-11-01"})
        self.assertEqual(self.current(), [("S010", "co-instructor"), ("S008", "lead")])

    def test_new_lead_asks_then_hands_over(self):
        self.sign_in(ADMIN)
        data = {"staff_id": "S010", "role": "lead", "on": "2025-12-01"}
        r = self.post("/admin/cohorts/data-2025-10/assign", data=data)
        self.assertIn("This will take Ana Grey off as lead from 2025-12-01.", r.text)
        self.assertEqual(self.current(), [("S008", "lead")])
        r = self.post("/admin/cohorts/data-2025-10/assign", data={**data, "confirm": "1"}, follow_redirects=True)
        self.assertEqual(self.current(), [("S010", "lead")])
        self.assertEqual(self.query("SELECT unassigned_on FROM course_staff WHERE staff_id = 'S008' "
                                    "AND course_id = 'data-2025-10'"), [("2025-12-01",)])
        self.assertIn("Ana Grey", r.text)
        self.assertIn("Kian Mackay", r.text)

    def test_take_off(self):
        self.sign_in(ADMIN)
        before = self.count("course_staff")
        r = self.post("/admin/cohorts/data-2025-10/unassign",
                      data={"staff_id": "S008", "assigned_on": "2025-10-01", "on": "2026-01-31"},
                      follow_redirects=True)
        self.assertEqual(self.current(), [])
        self.assertIn("2026-01-31", r.text)
        self.assertEqual(self.count("course_staff"), before)

    def test_instructor_who_left_cannot_be_assigned(self):
        self.sign_in(ADMIN)
        self.assertNotIn("Niamh Kowalski", self.client.get("/admin/cohorts/data-2025-10").text)
        r = self.post("/admin/cohorts/data-2025-10/assign",
                      data={"staff_id": "S006", "role": "co-instructor", "on": "2025-11-01"},
                      follow_redirects=True)
        self.assertIn("Choose a current instructor", r.text)
        self.assertEqual(self.current(), [("S008", "lead")])

    def test_cohorts_are_brightpath_only(self):
        self.sign_in(CLIENT_ADMIN)
        for path in ["/admin/cohorts", "/admin/cohorts/data-2025-10"]:
            self.assertEqual(self.client.get(path).status_code, 403)
        r = self.post("/admin/cohorts/data-2025-10/assign",
                      data={"staff_id": "S010", "role": "co-instructor", "on": "2025-11-01"})
        self.assertEqual(r.status_code, 403)

    def test_staff_who_left_are_marked_not_hidden(self):
        with closing(sqlite3.connect(self.db)) as db:  # an open row for someone who has left, as in the real data
            db.execute("INSERT INTO course_staff (course_id, staff_id, role, assigned_on) "
                       "VALUES ('data-2025-10', 'S006', 'co-instructor', '2025-10-01')")
            db.commit()
        self.sign_in(ADMIN)
        for path in ["/admin/cohorts", "/admin/cohorts/data-2025-10"]:
            with self.subTest(path=path):
                page = self.client.get(path).text
                self.assertIn("Niamh Kowalski (left 2020-05-15)", page)
                self.assertNotIn("Ana Grey (left", page)
        self.assertEqual(self.query("SELECT unassigned_on FROM course_staff WHERE staff_id = 'S006'"), [(None,)])

    def test_cohort_list_shows_nobody_assigned(self):
        self.sign_in(ADMIN)
        self.post("/admin/cohorts/data-2025-10/unassign",
                  data={"staff_id": "S008", "assigned_on": "2025-10-01", "on": "2026-01-31"})
        self.assertIn("nobody assigned", self.client.get("/admin/cohorts").text)


if __name__ == "__main__":
    unittest.main()
