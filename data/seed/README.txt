The Training Platform — the client's current spreadsheets
=========================================================

This is what the training company runs on today. Load it, query it, build on it.

Learners and their learning
  courses.csv       22 course cohorts (7 courses, several start dates each)
  assessments.csv   206 assignments, quizzes and final exams: due dates, weights,
                    who wrote each one, and whether it is published or still a draft
  learners.csv      28,785 learners: employer, department, account status, who created the account
  enrolments.csv    32,593 enrolments: dates, outcome, prior attempts, activity,
                    and whether the learner enrolled themselves or was assigned
  attempts.csv      173,912 submitted attempts with scores; assignments show who graded them

The people who run it
  clients.csv       7 corporate clients: contract dates and seats bought
  staff.csv         19 administrators and instructors. Some administrators work
                    for a client, not for the training company
  course_staff.csv  which instructors teach which cohort, and when that changed

Joins
  enrolments.learner_id -> learners      enrolments.course_id -> courses
  attempts.assessment_id -> assessments  learners.client_id   -> clients
  course_staff.course_id -> courses      course_staff.staff_id -> staff
  assessments.author_id, attempts.graded_by, learners.created_by,
  enrolments.enrolled_by -> staff  ('self' / 'self-signup' = no staff involved)

It is not tidy, and that is on purpose. People withdraw, skip quizzes, submit late
and retake courses; staff leave; one cohort has nobody assigned to teach it.

Source: learner behaviour is derived from the Open University Learning Analytics
Dataset (OULAD). Kuzilek J., Hlosta M., Zdrahal Z. Open University Learning Analytics
dataset. Sci. Data 4:170171 (2017). Licensed CC-BY 4.0. Names, emails, course titles
and dates are invented or shifted, and demographic columns were removed. Clients,
staff, course_staff and the staff columns on the other files are synthetic.
