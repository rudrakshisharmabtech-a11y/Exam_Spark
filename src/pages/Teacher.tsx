import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDialogFocus } from "../components/useDialogFocus";
import {
  courseSubjects,
  demoClassStudents,
  demoTeacherAnalytics,
  demoTeacherMonitor,
  demoTeacherQuestionAnalytics,
  exams,
} from "../data";
import { apiRequest } from "../api";
import { csvCell, parseCsv } from "../csv";
import { demoSession, getCurrentUser, isDemoUser } from "../state";
import {
  addDemoExam,
  addDemoQuestions,
  getDemoExams,
  getDemoQuestionBank,
  updateDemoExamStatus,
  type DemoQuestion,
} from "../demoData";
import { Button, Icon, navigate } from "../components/ui";
import { Metric, PageTitle, Shell } from "../components/workspace";

export function TeacherDashboard() {
  const currentUser = getCurrentUser();
  type ExamRecord = {
    id: number;
    title: string;
    code: string;
    subject: string;
    status: string;
  };
  type MonitorRecord = {
    examId: number;
    title: string;
    attempts: number | string;
    submitted: number | string;
    inProgress: number | string;
    pending: number | string;
  };
  type AnalyticsRecord = {
    examId: number;
    title: string;
    subject: string;
    submissions: number | string;
    averagePercentage: number | string | null;
    highestPercentage: number | string | null;
    passing: number | string;
  };
  type QuestionRecord = {
    examId: number;
    examTitle: string;
    questionId: number;
    topic: string;
    prompt: string;
    responses: number | string;
    incorrect: number | string;
    incorrectRate: number | string | null;
  };
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [monitorRecords, setMonitorRecords] = useState<MonitorRecord[]>([]);
  const [analyticsRecords, setAnalyticsRecords] = useState<AnalyticsRecord[]>([]);
  const [questionRecords, setQuestionRecords] = useState<QuestionRecord[]>([]);
  const [dashboardErrors, setDashboardErrors] = useState<string[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (isDemoUser()) {
      try {
        setExamRecords(
          getDemoExams().map((exam) => ({
            id: exam.id,
            title: exam.title,
            code: exam.code,
            subject: exam.subject,
            status:
              exam.status === "Live" || exam.status === "Upcoming"
                ? "published"
                : exam.status === "Completed"
                  ? "closed"
                  : "draft",
          })),
        );
        setMonitorRecords(demoTeacherMonitor);
        setAnalyticsRecords(demoTeacherAnalytics);
        setQuestionRecords(demoTeacherQuestionAnalytics);
      } catch (error) {
        setDashboardErrors([
          error instanceof Error ? error.message : "Demo dashboard data could not be loaded.",
        ]);
      } finally {
        setDashboardLoading(false);
      }
      return () => {
        active = false;
      };
    }
    Promise.allSettled([
      apiRequest<{ exams: ExamRecord[] }>("/exams"),
      apiRequest<{ exams: MonitorRecord[] }>("/teacher/monitor"),
      apiRequest<{ exams: AnalyticsRecord[] }>("/teacher/analytics"),
      apiRequest<{ questions: QuestionRecord[] }>("/teacher/question-analytics"),
    ]).then((results) => {
      if (!active) return;
      const errors: string[] = [];
      const [examsResult, monitorResult, analyticsResult, questionsResult] = results;
      if (examsResult.status === "fulfilled") setExamRecords(examsResult.value.exams);
      else
        errors.push(
          examsResult.reason instanceof Error
            ? examsResult.reason.message
            : "Exam data could not be loaded.",
        );
      if (monitorResult.status === "fulfilled") setMonitorRecords(monitorResult.value.exams);
      else
        errors.push(
          monitorResult.reason instanceof Error
            ? monitorResult.reason.message
            : "Live attempts could not be loaded.",
        );
      if (analyticsResult.status === "fulfilled") setAnalyticsRecords(analyticsResult.value.exams);
      else
        errors.push(
          analyticsResult.reason instanceof Error
            ? analyticsResult.reason.message
            : "Class analytics could not be loaded.",
        );
      if (questionsResult.status === "fulfilled")
        setQuestionRecords(questionsResult.value.questions);
      else
        errors.push(
          questionsResult.reason instanceof Error
            ? questionsResult.reason.message
            : "Question analytics could not be loaded.",
        );
      setDashboardErrors(errors);
      setDashboardLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const number = (value: number | string | null | undefined) => Number(value || 0);
  const monitorTotals = monitorRecords.reduce(
    (total, exam) => ({
      attempts: total.attempts + number(exam.attempts),
      submitted: total.submitted + number(exam.submitted),
      inProgress: total.inProgress + number(exam.inProgress),
      pending: total.pending + number(exam.pending),
    }),
    { attempts: 0, submitted: 0, inProgress: 0, pending: 0 },
  );
  const totalSubmissions = analyticsRecords.reduce(
    (sum, exam) => sum + number(exam.submissions),
    0,
  );
  const averageScore = totalSubmissions
    ? Math.round(
        analyticsRecords.reduce(
          (sum, exam) => sum + number(exam.averagePercentage) * number(exam.submissions),
          0,
        ) / totalSubmissions,
      )
    : 0;
  const highestScore = Math.max(
    0,
    ...analyticsRecords.map((exam) => number(exam.highestPercentage)),
  );
  const passPercentage = totalSubmissions
    ? Math.round(
        (analyticsRecords.reduce((sum, exam) => sum + number(exam.passing), 0) / totalSubmissions) *
          100,
      )
    : 0;
  const subjectStats = [...new Set(analyticsRecords.map((exam) => exam.subject))].map((subject) => {
    const records = analyticsRecords.filter((exam) => exam.subject === subject);
    const submissions = records.reduce((sum, exam) => sum + number(exam.submissions), 0);
    return {
      subject,
      average: submissions
        ? Math.round(
            records.reduce(
              (sum, exam) => sum + number(exam.averagePercentage) * number(exam.submissions),
              0,
            ) / submissions,
          )
        : 0,
    };
  });
  const respondedQuestions = questionRecords.filter((question) => number(question.responses) > 0);
  const difficultyStats = [
    { label: "Easy", color: "#14b8a6", test: (rate: number) => rate < 30 },
    { label: "Moderate", color: "#2563eb", test: (rate: number) => rate >= 30 && rate < 65 },
    { label: "Difficult", color: "#142b4a", test: (rate: number) => rate >= 65 },
  ].map(({ label, color, test }) => {
    const records = respondedQuestions.filter((question) => test(number(question.incorrectRate)));
    return {
      label,
      color,
      count: records.length,
      averageIncorrect: records.length
        ? Math.round(
            records.reduce((sum, question) => sum + number(question.incorrectRate), 0) /
              records.length,
          )
        : 0,
    };
  });
  const mostMissed = respondedQuestions
    .slice()
    .sort((a, b) => number(b.incorrectRate) - number(a.incorrectRate))[0];

  return (
    <Shell role="teacher" route="teacher">
      <PageTitle
        eyebrow="TEACHER OVERVIEW"
        title={`Welcome back, ${currentUser?.name || "Dr. Elias Ford"}.`}
        subtitle="Your examination workspace is active and up to date."
        action={
          <Button onClick={() => navigate("create")} icon="plus">
            Create examination
          </Button>
        }
      />
      {dashboardErrors.length > 0 && (
        <p className="form-error" role="alert">
          {dashboardErrors.join(" ")}
        </p>
      )}
      <div className="metric-grid">
        <Metric
          label="DRAFTS"
          value={
            dashboardLoading
              ? "…"
              : String(examRecords.filter((exam) => exam.status === "draft").length)
          }
          note="Saved examinations"
          icon="file"
        />
        <Metric
          label="PUBLISHED"
          value={
            dashboardLoading
              ? "…"
              : String(examRecords.filter((exam) => exam.status === "published").length)
          }
          note="Currently published"
          icon="spark"
          tone="violet"
        />
        <Metric
          label="SUBMISSIONS"
          value={dashboardLoading ? "…" : String(totalSubmissions)}
          note="Submitted attempts"
          icon="users"
          tone="green"
        />
        <Metric
          label="AVG. SCORE"
          value={dashboardLoading ? "…" : `${averageScore}%`}
          note="Across submitted attempts"
          icon="chart"
          tone="gold"
        />
      </div>
      <div className="teacher-analytics-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>LIVE MONITOR</span>
              <h2>Exam attempts</h2>
            </div>
          </div>
          <div className="monitor-stats">
            <div>
              <strong>{dashboardLoading ? "…" : monitorTotals.attempts}</strong>
              <span>Attempts</span>
            </div>
            <div>
              <strong>{dashboardLoading ? "…" : monitorTotals.submitted}</strong>
              <span>Submitted</span>
            </div>
            <div>
              <strong>{dashboardLoading ? "…" : monitorTotals.inProgress}</strong>
              <span>In progress</span>
            </div>
            <div>
              <strong>{dashboardLoading ? "…" : monitorTotals.pending}</strong>
              <span>Pending</span>
            </div>
          </div>
          <small className="analytics-note">
            Pending counts expired attempts; not-started roster counts require exam enrollment data.
          </small>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>QUESTION ANALYTICS</span>
              <h2>Difficulty review</h2>
            </div>
          </div>
          <div className="difficulty-bars">
            {difficultyStats.map((item) => (
              <div className="difficulty-bar" key={item.label}>
                <div className="difficulty-meta">
                  <span>
                    {item.label} · {item.count} questions
                  </span>
                  <strong>{item.averageIncorrect}% incorrect</strong>
                </div>
                <i style={{ width: `${item.averageIncorrect}%`, background: item.color }}></i>
              </div>
            ))}
          </div>
          {mostMissed && (
            <p className="analytics-note">
              Most missed: {mostMissed.topic} ({number(mostMissed.incorrectRate)}% incorrect)
            </p>
          )}
          {respondedQuestions.length === 0 && !dashboardLoading && (
            <p className="analytics-note">
              Difficulty classifications appear after students submit attempts.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>CLASS OVERVIEW</span>
              <h2>Performance</h2>
            </div>
          </div>
          <div className="class-summary">
            <div>
              <span>Average</span>
              <strong>{dashboardLoading ? "…" : `${averageScore}%`}</strong>
            </div>
            <div>
              <span>Highest</span>
              <strong>{dashboardLoading ? "…" : `${highestScore}%`}</strong>
            </div>
            <div>
              <span>Pass rate</span>
              <strong>{dashboardLoading ? "…" : `${passPercentage}%`}</strong>
            </div>
          </div>
          <div className="subject-bars">
            {subjectStats.map(({ subject, average }) => (
              <div className="subject-bar" key={subject}>
                <span>{subject}</span>
                <div>
                  <i style={{ width: `${average}%` }}></i>
                </div>
                <b>{average}%</b>
              </div>
            ))}
            {subjectStats.length === 0 && !dashboardLoading && (
              <p className="analytics-note">
                Subject comparisons appear after students submit attempts.
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="dashboard-grid teacher-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>EXAMINATION FLOW</span>
              <h2>Your examinations</h2>
            </div>
            <button onClick={() => navigate("create")}>
              Manage all <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="history-table">
            <div className="table-row table-head">
              <span>Examination</span>
              <span>Participation</span>
              <span>Average</span>
              <span>Status</span>
            </div>
            {examRecords.slice(0, 4).map((x) => (
              <div className="table-row" key={x.id}>
                <span>
                  <i
                    style={{
                      background:
                        exams.find((exam) => exam.subject === x.subject)?.accent ?? "var(--violet)",
                    }}
                  ></i>
                  <b>{x.title}</b>
                  <small>{x.code}</small>
                </span>
                <span>
                  {number(analyticsRecords.find((exam) => exam.examId === x.id)?.submissions)}{" "}
                  submissions
                </span>
                <span>
                  <strong>
                    {number(
                      analyticsRecords.find((exam) => exam.examId === x.id)?.averagePercentage,
                    )}
                    {analyticsRecords.some((exam) => exam.examId === x.id) ? "%" : "—"}
                  </strong>
                </span>
                <span>
                  <em
                    className={`status ${x.status === "published" ? "live" : x.status === "closed" ? "completed" : "draft"}`}
                  >
                    {x.status}
                  </em>
                </span>
              </div>
            ))}
            {examRecords.length === 0 && !dashboardLoading && (
              <p className="analytics-note">Create your first examination to see it here.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>What changed</h2>
            </div>
          </div>
          {examRecords.slice(0, 4).map((exam, i) => (
            <div className="activity" key={exam.id}>
              <i>{i + 1}</i>
              <div>
                <b>{exam.title}</b>
                <small>
                  {exam.subject} · {exam.status}
                </small>
              </div>
            </div>
          ))}
          {examRecords.length === 0 && !dashboardLoading && (
            <p className="analytics-note">Your examination activity will appear here.</p>
          )}
        </section>
      </div>
      <div className="dashboard-grid teacher-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>DEMO CLASS ROSTER</span>
              <h2>Student progress</h2>
            </div>
            <small>Sample results · Section A</small>
          </div>
          <div className="history-table">
            <div className="table-row table-head">
              <span>Student</span>
              <span>Section</span>
              <span>Exams completed</span>
              <span>Average score</span>
            </div>
            {demoClassStudents.map((student) => (
              <div className="table-row" key={student.name}>
                <span><b>{student.name}</b></span>
                <span>{student.section}</span>
                <span>{student.examsCompleted}</span>
                <span><strong>{student.averageScore}%</strong></span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function ExamManagement() {
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [records, setRecords] = useState<typeof exams>([]);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null);
  useDialogFocus(editing, () => setEditing(false), ".drawer");
  const loadExams = async () => {
    if (isDemoUser()) {
      setRecords(getDemoExams());
      return;
    }
    const result = await apiRequest<{
      exams: Array<{
        id: number;
        title: string;
        code: string;
        subject: string;
        duration: number;
        marks: number;
        questionCount: number;
        status: "draft" | "published" | "closed";
        startsAt: string | null;
        endsAt: string | null;
      }>;
    }>("/exams");
    setRecords(
      result.exams.map((item) => ({
        id: item.id,
        title: item.title,
        code: item.code,
        subject: item.subject,
        duration: Number(item.duration),
        questions: Number(item.questionCount),
        marks: Number(item.marks),
        date: item.startsAt ? new Date(item.startsAt).toLocaleString() : "Not scheduled",
        status:
          item.status === "closed"
            ? "Completed"
            : item.status === "draft"
              ? "Draft"
              : item.startsAt && new Date(item.startsAt) > new Date()
                ? "Upcoming"
                : "Live",
        accent: exams.find((exam) => exam.subject === item.subject)?.accent ?? "var(--violet)",
      })),
    );
  };
  async function changeExamStatus(exam: (typeof exams)[number]) {
    const status =
      exam.status === "Draft" ? "published" : exam.status === "Completed" ? "draft" : "closed";
    setStatusSavingId(exam.id);
    try {
      if (isDemoUser()) {
        if (status === "published" && getDemoQuestionBank(exam.id).length === 0) {
          setToast("Add at least one question before publishing this examination.");
          return;
        }
        setRecords(
          updateDemoExamStatus(
            exam.id,
            status === "published" ? "Live" : status === "closed" ? "Completed" : "Draft",
          ),
        );
        setToast(`"${exam.title}" moved to ${status}.`);
        return;
      }
      await apiRequest(`/exams/${exam.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadExams();
      setToast(`"${exam.title}" moved to ${status}.`);
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "The examination status could not be changed.",
      );
    } finally {
      setStatusSavingId(null);
    }
  }
  useEffect(() => {
    loadExams().catch((error: unknown) =>
      setLoadError(error instanceof Error ? error.message : "Examinations could not be loaded."),
    );
  }, []);
  const shown = records.filter(
    (exam) =>
      (status === "All" || exam.status === status) &&
      `${exam.title} ${exam.code} ${exam.subject}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <Shell role="teacher" route="create">
      <PageTitle
        eyebrow="EXAMINATION MANAGEMENT"
        title="Build and publish with clarity."
        subtitle="Create, schedule and maintain every examination."
        action={
          <Button onClick={() => setEditing(true)} icon="plus">
            New examination
          </Button>
        }
      />
      <div className="search-strip">
        <div className="search-box">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search examinations…"
          />
        </div>
        <div className="filter-tabs">
          {["All", "Draft", "Live", "Upcoming", "Completed"].map((item) => (
            <button
              className={status === item ? "active" : ""}
              onClick={() => setStatus(item)}
              key={item}
            >
              {item === "Live" ? "Published" : item === "Upcoming" ? "Scheduled" : item}
            </button>
          ))}
        </div>
      </div>
      <section className="panel">
        {loadError && (
          <p className="form-error" role="alert">
            {loadError}
          </p>
        )}
        <div className="history-table management">
          <div className="table-row table-head">
            <span>Examination</span>
            <span>Questions</span>
            <span>Availability</span>
            <span>Status</span>
            <span></span>
          </div>
          {shown.map((x) => (
            <div className="table-row" key={x.id}>
              <span>
                <i style={{ background: x.accent }}></i>
                <b>{x.title}</b>
                <small>
                  {x.code} · {x.marks} marks
                </small>
              </span>
              <span>{x.questions}</span>
              <span>{x.date}</span>
              <span>
                <em className={`status ${x.status.toLowerCase()}`}>{x.status}</em>
              </span>
              <span>
                <button
                  className="icon-btn"
                  aria-label={`${x.status === "Draft" ? "Publish" : x.status === "Completed" ? "Return to draft" : "Close"} ${x.title}`}
                  title={
                    x.status === "Draft"
                      ? "Publish examination"
                      : x.status === "Completed"
                        ? "Return to draft"
                        : "Close examination"
                  }
                  disabled={statusSavingId === x.id}
                  onClick={() => void changeExamStatus(x)}
                >
                  <Icon
                    name={x.status === "Draft" ? "check" : x.status === "Completed" ? "file" : "x"}
                  />
                </button>
              </span>
            </div>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="empty-results compact">
            <Icon name="file" size={26} />
            <h2>{loadError ? "Examinations could not be loaded." : "No examinations found."}</h2>
            <button
              className="text-btn"
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
      {editing && (
        <div className="drawer-backdrop">
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-drawer-title"
          >
            <div className="drawer-head">
              <div>
                <span>NEW EXAMINATION</span>
                <h2 id="exam-drawer-title">Set the foundation.</h2>
              </div>
              <button onClick={() => setEditing(false)}>
                <Icon name="x" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setSaving(true);
                setFormError("");
                try {
                  if (isDemoUser()) {
                    const exam = addDemoExam({
                      title: String(form.get("title")).trim(),
                      subject: String(form.get("subject")).trim(),
                      code: String(form.get("code")).trim(),
                      duration: Number(form.get("durationMinutes")),
                      marks: Number(form.get("totalMarks")),
                      startsAt: String(form.get("startsAt") || ""),
                    });
                    demoSession.selectedExamId = exam.id;
                    demoSession.selectedExamDetails = exam;
                    await loadExams();
                    setEditing(false);
                    setToast("Draft saved in this browser. Add questions before publishing.");
                    navigate("bank");
                    return;
                  }
                  const result = await apiRequest<{ examId: number }>("/exams", {
                    method: "POST",
                    body: JSON.stringify({
                      title: String(form.get("title")).trim(),
                      subject: String(form.get("subject")).trim(),
                      code: String(form.get("code")).trim(),
                      durationMinutes: Number(form.get("durationMinutes")),
                      totalMarks: Number(form.get("totalMarks")),
                      startsAt: String(form.get("startsAt") || "") || null,
                      endsAt: String(form.get("endsAt") || "") || null,
                    }),
                  });
                  demoSession.selectedExamId = result.examId;
                  demoSession.selectedExamDetails = null;
                  await loadExams();
                  setEditing(false);
                  setToast("Draft saved. Add questions to publish it.");
                  navigate("bank");
                } catch (error) {
                  setFormError(
                    error instanceof Error ? error.message : "The examination could not be saved.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              <label>
                Examination title
                <input name="title" required placeholder="e.g. Environmental Science I" />
              </label>
              <div className="form-grid">
                <label>
                  Subject
                  <select name="subject">
                    {courseSubjects.map((subject) => <option key={subject}>{subject}</option>)}
                  </select>
                </label>
                <label>
                  Code
                  <input name="code" placeholder="DBMS-302" required />
                </label>
                <label>
                  Duration (minutes)
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    max="600"
                    defaultValue="60"
                    required
                  />
                </label>
                <label>
                  Total marks
                  <input name="totalMarks" type="number" min="1" defaultValue="100" required />
                </label>
              </div>
              <label>
                Description<textarea placeholder="What does this examination cover?"></textarea>
              </label>
              <label>
                Instructions<textarea placeholder="Add rules and preparation guidance…"></textarea>
              </label>
              <div className="drawer-section">
                <b>AVAILABILITY</b>
                <div className="form-grid">
                  <label>
                    Opens
                    <input name="startsAt" type="datetime-local" />
                  </label>
                  <label>
                    Closes
                    <input name="endsAt" type="datetime-local" />
                  </label>
                </div>
              </div>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="drawer-actions">
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon="arrow" disabled={saving}>
                  {saving ? "Saving…" : "Save draft"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" />
          {toast}
          <button onClick={() => setToast("")}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </Shell>
  );
}

type QuestionRecord = {
  id: number;
  examId: number;
  topic: string;
  difficulty: "easy" | "moderate" | "difficult";
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string | null;
  points: number;
};

export function QuestionBank() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [examOptions, setExamOptions] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedExamId, setSelectedExamId] = useState(String(demoSession.selectedExamId));
  const [rows, setRows] = useState<QuestionRecord[]>([]);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const importInput = useRef<HTMLInputElement>(null);
  useDialogFocus(open, () => setOpen(false), ".drawer");

  useEffect(() => {
    if (isDemoUser()) {
      try {
        const records = getDemoExams().map(({ id, title }) => ({ id, title }));
        setExamOptions(records);
        setSelectedExamId((current) =>
          records.some((item) => String(item.id) === current)
            ? current
            : String(records[0]?.id ?? ""),
        );
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "The demo examinations could not be loaded.");
      }
      return;
    }
    apiRequest<{ exams: Array<{ id: number; title: string }> }>("/exams")
      .then(({ exams: records }) => {
        setExamOptions(records);
        setSelectedExamId((current) =>
          records.some((item) => String(item.id) === current)
            ? current
            : String(records[0]?.id ?? ""),
        );
      })
      .catch((error: unknown) =>
        setLoadError(
          error instanceof Error ? error.message : "The question bank could not be loaded.",
        ),
      );
  }, []);

  useEffect(() => {
    if (!selectedExamId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isDemoUser()) {
      try {
        setRows(getDemoQuestionBank(Number(selectedExamId)));
        setLoadError("");
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Demo questions could not be loaded.");
      } finally {
        setLoading(false);
      }
      return;
    }
    apiRequest<{ questions: QuestionRecord[] }>(
      `/questions?examId=${encodeURIComponent(selectedExamId)}`,
    )
      .then(({ questions: records }) => setRows(records))
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "Questions could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, [selectedExamId, refreshVersion]);

  const shown = rows.filter(
    (item) =>
      (difficulty === "all" || item.difficulty === difficulty) &&
      `${item.prompt} ${item.topic}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const options = [0, 1, 2, 3].map((index) => String(form.get(`option${index}`)).trim());
    setSaving(true);
    setFormError("");
    try {
      if (isDemoUser()) {
        const difficulty = String(form.get("difficulty"));
        if (difficulty !== "easy" && difficulty !== "moderate" && difficulty !== "difficult") {
          throw new Error("Choose a valid question difficulty.");
        }
        addDemoQuestions(Number(selectedExamId), [{
          topic: String(form.get("topic")).trim(),
          difficulty,
          prompt: String(form.get("prompt")).trim(),
          options,
          correctOption: Number(form.get("correctOption")),
          explanation: String(form.get("explanation")).trim(),
          points: 1,
        }]);
        formElement.reset();
        setOpen(false);
        setToast("Question saved to this browser's demo question bank.");
        setRefreshVersion((value) => value + 1);
        return;
      }
      await apiRequest("/questions", {
        method: "POST",
        body: JSON.stringify({
          examId: Number(selectedExamId),
          topic: String(form.get("topic")).trim(),
          difficulty: String(form.get("difficulty")),
          prompt: String(form.get("prompt")).trim(),
          options,
          correctOption: Number(form.get("correctOption")),
          explanation: String(form.get("explanation")).trim(),
        }),
      });
      formElement.reset();
      setOpen(false);
      setToast("Question saved to the database.");
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Question could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file: File) {
    setImportError("");
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      const headers = rows[0]?.map((header) => header.toLowerCase().replace(/[\s_-]+/g, "")) ?? [];
      const column = (key: string) => headers.indexOf(key);
      const required = ["topic", "difficulty", "prompt", "optiona", "optionb", "correctoption"];
      const missing = required.filter((key) => column(key) < 0);
      if (missing.length) {
        throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
      }
      const questions: Omit<DemoQuestion, "id" | "examId">[] = rows.slice(1).map((cells, index) => {
        const get = (key: string) => {
          const position = column(key);
          return position < 0 ? "" : (cells[position] ?? "").trim();
        };
        const optionValues = ["optiona", "optionb", "optionc", "optiond"].map(get);
        const lastOption = optionValues.reduce<number>(
          (last, value, optionIndex) => (value.length > 0 ? optionIndex : last),
          -1,
        );
        if (lastOption < 1 || optionValues.slice(0, lastOption + 1).some((value) => !value)) {
          throw new Error(`Row ${index + 2} must include at least two consecutive answer options.`);
        }
        const correct = get("correctoption").toUpperCase();
        const correctOption = /^[A-F]$/.test(correct)
          ? correct.charCodeAt(0) - 65
          : Number(correct);
        const difficulty = get("difficulty").toLowerCase();
        if (difficulty !== "easy" && difficulty !== "moderate" && difficulty !== "difficult") {
          throw new Error(`Row ${index + 2} must use easy, moderate, or difficult for difficulty.`);
        }
        if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption > lastOption) {
          throw new Error(
            `Row ${index + 2} has an invalid correctOption. Use A-${String.fromCharCode(65 + lastOption)} or a zero-based index.`,
          );
        }
        const pointsText = get("points");
        const points = pointsText ? Number(pointsText) : 1;
        if (!Number.isFinite(points) || points <= 0) {
          throw new Error(`Row ${index + 2} must have a positive points value.`);
        }
        return {
          topic: get("topic"),
          difficulty,
          prompt: get("prompt"),
          options: optionValues.slice(0, lastOption + 1),
          correctOption,
          explanation: get("explanation"),
          points,
        };
      });
      if (questions.length === 0)
        throw new Error("Add at least one question after the CSV header.");
      if (isDemoUser()) {
        addDemoQuestions(Number(selectedExamId), questions);
        setToast(`${questions.length} question${questions.length === 1 ? "" : "s"} imported to this browser.`);
        setRefreshVersion((value) => value + 1);
        return;
      }
      const result = await apiRequest<{ imported: number }>("/questions/import", {
        method: "POST",
        body: JSON.stringify({ examId: Number(selectedExamId), questions }),
      });
      setToast(`${result.imported} question${result.imported === 1 ? "" : "s"} imported.`);
      setRefreshVersion((value) => value + 1);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "The CSV questions could not be imported.",
      );
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
    }
  }

  function downloadCsvTemplate() {
    const headers = [
      "topic",
      "difficulty",
      "prompt",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
      "correctOption",
      "explanation",
      "points",
    ];
    const sample = [
      "Database normalization",
      "moderate",
      "Which normal form removes partial dependencies on a composite key?",
      "First normal form",
      "Second normal form",
      "",
      "",
      "B",
      "Second normal form removes partial dependencies on a candidate key.",
      "1",
    ];
    const blob = new Blob(
      [[headers, sample].map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "examspark-questions-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell role="teacher" route="bank">
      <PageTitle
        eyebrow="QUESTION BANK"
        title="Ideas, organised for reuse."
        subtitle="Build a question library that powers timed, automatically graded tests."
        action={
          <div className="button-pair">
            <Button variant="secondary" onClick={downloadCsvTemplate}>
              Download CSV template
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportError("");
                importInput.current?.click();
              }}
              icon="file"
              disabled={!selectedExamId || importing}
            >
              {importing ? "Importing…" : "Import questions"}
            </Button>
            <Button
              onClick={() => {
                setFormError("");
                setOpen(true);
              }}
              icon="plus"
              disabled={examOptions.length === 0}
            >
              Add question
            </Button>
            <input
              ref={importInput}
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose a question CSV file"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
          </div>
        }
      />
      {importError && (
        <p className="form-error" role="alert">
          {importError}
        </p>
      )}
      <div className="search-strip">
        <div className="search-box">
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search question text or topic…"
          />
        </div>
        <select
          aria-label="Select examination"
          value={selectedExamId}
          onChange={(event) => {
            setSelectedExamId(event.target.value);
            demoSession.selectedExamId = Number(event.target.value);
          }}
        >
          {examOptions.map((item) => (
            <option value={item.id} key={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="difficult">Difficult</option>
        </select>
      </div>
      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}
      <section className="panel question-table">
        {loading && <p className="tool-empty">Loading questions…</p>}
        {!loading && !loadError && shown.length === 0 && (
          <p className="tool-empty">No questions yet. Add the first question to this exam.</p>
        )}
        {shown.map((question) => (
          <div className="question-row" key={question.id}>
            <div>
              <span>
                {question.topic} · <em className={question.difficulty}>{question.difficulty}</em>
              </span>
              <b>{question.prompt}</b>
              <small>Multiple choice · {question.points} marks</small>
            </div>
            <span className="question-answer-key">
              Answer {String.fromCharCode(65 + question.correctOption)}
            </span>
          </div>
        ))}
      </section>
      {open && (
        <div className="drawer-backdrop">
          <aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-drawer-title"
          >
            <div className="drawer-head">
              <div>
                <span>QUESTION EDITOR</span>
                <h2 id="question-drawer-title">Write with precision.</h2>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close question editor">
                <Icon name="x" />
              </button>
            </div>
            <form onSubmit={saveQuestion}>
              <label>
                Examination
                <select
                  value={selectedExamId}
                  onChange={(event) => setSelectedExamId(event.target.value)}
                >
                  {examOptions.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Topic
                  <input name="topic" required placeholder="e.g. Database normalization" />
                </label>
                <label>
                  Difficulty
                  <select name="difficulty" defaultValue="moderate">
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult</option>
                  </select>
                </label>
              </div>
              <label>
                Question
                <textarea name="prompt" required placeholder="Write the question…" />
              </label>
              <b className="form-label">ANSWER OPTIONS · SELECT THE CORRECT ANSWER</b>
              {[0, 1, 2, 3].map((index) => (
                <label className="answer-edit" key={index}>
                  <input type="radio" name="correctOption" value={index} required />
                  <span>{String.fromCharCode(65 + index)}</span>
                  <input
                    name={`option${index}`}
                    required
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </label>
              ))}
              <label>
                Explanation
                <textarea name="explanation" placeholder="Explain why this answer is correct." />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="drawer-actions">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save question"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </Shell>
  );
}

export function Analytics() {
  type AnalyticsExam = {
    examId: number;
    title: string;
    subject: string;
    submissions: number | string;
    averagePercentage: number | string | null;
    highestPercentage: number | string | null;
    passing: number | string;
  };
  type AnalyticsQuestion = {
    questionId: number;
    examTitle: string;
    topic: string;
    prompt: string;
    responses: number | string;
    incorrectRate: number | string | null;
  };
  const [records, setRecords] = useState<AnalyticsExam[]>([]);
  const [questions, setQuestions] = useState<AnalyticsQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (isDemoUser()) {
      setRecords(demoTeacherAnalytics);
      setQuestions(demoTeacherQuestionAnalytics);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    Promise.all([
      apiRequest<{ exams: AnalyticsExam[] }>("/teacher/analytics"),
      apiRequest<{ questions: AnalyticsQuestion[] }>("/teacher/question-analytics"),
    ])
      .then(([examResult, questionResult]) => {
        if (!active) return;
        setRecords(examResult.exams);
        setQuestions(questionResult.questions);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Analytics could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const number = (value: number | string | null | undefined) => Number(value || 0);
  const submissionCount = records.reduce((sum, record) => sum + number(record.submissions), 0);
  const average = submissionCount
    ? Math.round(
        records.reduce(
          (sum, record) => sum + number(record.averagePercentage) * number(record.submissions),
          0,
        ) / submissionCount,
      )
    : 0;
  const highest = Math.max(0, ...records.map((record) => number(record.highestPercentage)));
  const passing = submissionCount
    ? Math.round(
        (records.reduce((sum, record) => sum + number(record.passing), 0) * 100) / submissionCount,
      )
    : 0;
  const answeredQuestions = questions.filter((question) => number(question.responses) > 0);
  const mostMissed = answeredQuestions
    .slice()
    .sort((a, b) => number(b.incorrectRate) - number(a.incorrectRate))
    .slice(0, 3);

  function downloadResults() {
    const data = [
      ["exam", "subject", "submissions", "averagePercentage", "highestPercentage", "passing"],
      ...records.map((record) => [
        record.title,
        record.subject,
        number(record.submissions),
        number(record.averagePercentage),
        number(record.highestPercentage),
        number(record.passing),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "examspark-results-summary.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell role="teacher" route="analytics">
      <PageTitle
        eyebrow="RESULTS & ANALYTICS"
        title="See where learning lands."
        subtitle={`${records.length} examinations · ${submissionCount} submissions`}
        action={
          <Button
            variant="secondary"
            onClick={downloadResults}
            disabled={loading || records.length === 0}
          >
            Export results
          </Button>
        }
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="metric-grid">
        <Metric
          label="SUBMISSIONS"
          value={loading ? "…" : String(submissionCount)}
          note={`${records.length} examinations`}
          icon="users"
        />
        <Metric
          label="AVERAGE"
          value={loading ? "…" : `${average}%`}
          note="Class performance"
          icon="chart"
          tone="violet"
        />
        <Metric
          label="HIGHEST"
          value={loading ? "…" : `${highest}%`}
          note="Top score"
          icon="spark"
          tone="green"
        />
        <Metric
          label="PASS RATE"
          value={loading ? "…" : `${passing}%`}
          note="At least 50% score"
          icon="check"
          tone="gold"
        />
      </div>
      {isDemoUser() && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>DEMO STUDENT RESULTS</span>
              <h2>Class performance</h2>
            </div>
            <small>Sample scores · Section A</small>
          </div>
          <div className="history-table">
            <div className="table-row table-head">
              <span>Student</span>
              <span>Section</span>
              <span>Exams completed</span>
              <span>Average score</span>
            </div>
            {demoClassStudents.map((student) => (
              <div className="table-row" key={student.name}>
                <span><b>{student.name}</b></span>
                <span>{student.section}</span>
                <span>{student.examsCompleted}</span>
                <span><strong>{student.averageScore}%</strong></span>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="breakdown-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>QUESTION PERFORMANCE</span>
              <h2>Accuracy by question</h2>
            </div>
          </div>
          <div className="bar-chart">
            {answeredQuestions.slice(0, 12).map((question) => {
              const accuracy = Math.max(0, 100 - number(question.incorrectRate));
              return (
                <div
                  key={`${question.examTitle}-${question.questionId}`}
                  title={`${question.examTitle}: ${question.topic} · ${accuracy}% correct`}
                >
                  <i style={{ height: `${accuracy}%` }}></i>
                  <span>{question.questionId}</span>
                </div>
              );
            })}
          </div>
          {answeredQuestions.length === 0 && (
            <p className="analytics-note">
              {loading
                ? "Loading question results…"
                : "Question performance appears after students submit attempts."}
            </p>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>NEEDS ATTENTION</span>
              <h2>Most missed</h2>
            </div>
          </div>
          {mostMissed.map((question) => (
            <div className="missed" key={`${question.examTitle}-${question.questionId}`}>
              <strong>{number(question.incorrectRate)}%</strong>
              <div>
                <b>Question {question.questionId}</b>
                <span>
                  {question.topic} · {question.examTitle}
                </span>
              </div>
            </div>
          ))}
          {mostMissed.length === 0 && (
            <p className="analytics-note">
              {loading ? "Loading results…" : "No question has received a response yet."}
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
