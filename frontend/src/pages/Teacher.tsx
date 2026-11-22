import { useEffect, useState, type FormEvent } from "react";
import { useDialogFocus } from "../components/useDialogFocus";
import { exams } from "../data";
import { apiRequest } from "../api";
import { demoSession } from "../state";
import { Button, Icon, navigate } from "../components/ui";
import { Metric, PageTitle, Shell } from "../components/workspace";

export function TeacherDashboard() {
  return (
    <Shell role="teacher" route="teacher">
      <PageTitle
        eyebrow="TEACHER OVERVIEW"
        title="Welcome back, Dr. Ford."
        subtitle="Your examination workspace is active and up to date."
        action={
          <Button onClick={() => navigate("create")} icon="plus">
            Create examination
          </Button>
        }
      />
      <div className="metric-grid">
        <Metric label="DRAFTS" value="04" note="2 edited this week" icon="file" />
        <Metric label="PUBLISHED" value="12" note="3 currently active" icon="spark" tone="violet" />
        <Metric
          label="SUBMISSIONS"
          value="186"
          note="+24 since yesterday"
          icon="users"
          tone="green"
        />
        <Metric
          label="AVG. SCORE"
          value="78%"
          note="Across published exams"
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
              <strong>186</strong>
              <span>Active</span>
            </div>
            <div>
              <strong>64</strong>
              <span>Submitted</span>
            </div>
            <div>
              <strong>82</strong>
              <span>In progress</span>
            </div>
            <div>
              <strong>40</strong>
              <span>Pending</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>QUESTION ANALYTICS</span>
              <h2>Difficulty review</h2>
            </div>
          </div>
          <div className="difficulty-bars">
            {[
              { label: "Easy", value: 18, color: "#14b8a6" },
              { label: "Moderate", value: 42, color: "#2563eb" },
              { label: "Difficult", value: 74, color: "#142b4a" },
            ].map((item) => (
              <div className="difficulty-bar" key={item.label}>
                <div className="difficulty-meta">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <i style={{ width: `${item.value}%`, background: item.color }}></i>
              </div>
            ))}
          </div>
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
              <strong>76%</strong>
            </div>
            <div>
              <span>Highest</span>
              <strong>92%</strong>
            </div>
            <div>
              <span>Pass rate</span>
              <strong>86%</strong>
            </div>
          </div>
          <div className="subject-bars">
            {[
              ["Biology", 82],
              ["Mathematics", 74],
              ["History", 68],
            ].map(([subject, value]) => (
              <div className="subject-bar" key={subject}>
                <span>{subject}</span>
                <div>
                  <i style={{ width: `${value}%` }}></i>
                </div>
                <b>{value}%</b>
              </div>
            ))}
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
            {exams.slice(0, 4).map((x, i) => (
              <div className="table-row" key={x.id}>
                <span>
                  <i style={{ background: x.accent }}></i>
                  <b>{x.title}</b>
                  <small>{x.code}</small>
                </span>
                <span>{[42, 38, 29, 47][i]} students</span>
                <span>
                  <strong>
                    {[81, 74, 0, 84][i] || "—"}
                    {i !== 2 && "%"}
                  </strong>
                </span>
                <span>
                  <em className={`status ${x.status.toLowerCase()}`}>{x.status}</em>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>What changed</h2>
            </div>
          </div>
          {[
            "Maya Chen submitted Biology",
            "3 questions added to MAT–210",
            "History exam was published",
            "Physics results exported",
          ].map((x, i) => (
            <div className="activity" key={x}>
              <i>{i + 1}</i>
              <div>
                <b>{x}</b>
                <small>{["4 min ago", "1 hour ago", "Yesterday", "May 23"][i]}</small>
              </div>
            </div>
          ))}
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
  useDialogFocus(editing, () => setEditing(false), ".drawer");
  const loadExams = async () => {
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
        {loadError && <p className="form-error" role="alert">{loadError}</p>}
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
                  aria-label={`Edit ${x.title} (demo only)`}
                  onClick={() => setEditing(true)}
                >
                  <Icon name="more" />
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
                  setFormError(error instanceof Error ? error.message : "The examination could not be saved.");
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
                    <option>Biology</option>
                    <option>Mathematics</option>
                    <option>History</option>
                  </select>
                </label>
                <label>
                  Code
                  <input name="code" placeholder="BIO-205" required />
                </label>
                <label>
                  Duration (minutes)
                  <input name="durationMinutes" type="number" min="1" max="600" defaultValue="60" required />
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
              {formError && <p className="form-error" role="alert">{formError}</p>}
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
  useDialogFocus(open, () => setOpen(false), ".drawer");

  useEffect(() => {
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
        setLoadError(error instanceof Error ? error.message : "The question bank could not be loaded."),
      );
  }, []);

  useEffect(() => {
    if (!selectedExamId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest<{ questions: QuestionRecord[] }>(`/questions?examId=${encodeURIComponent(selectedExamId)}`)
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

  return (
    <Shell role="teacher" route="bank">
      <PageTitle
        eyebrow="QUESTION BANK"
        title="Ideas, organised for reuse."
        subtitle="Build a question library that powers timed, automatically graded tests."
        action={
          <div className="button-pair">
            <Button variant="secondary" onClick={() => setToast("Question import requires a CSV import workflow.")}>
              Import questions
            </Button>
            <Button onClick={() => { setFormError(""); setOpen(true); }} icon="plus" disabled={examOptions.length === 0}>
              Add question
            </Button>
          </div>
        }
      />
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
          {examOptions.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
        </select>
        <select aria-label="Filter by difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="difficult">Difficult</option>
        </select>
      </div>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <section className="panel question-table">
        {loading && <p className="tool-empty">Loading questions…</p>}
        {!loading && !loadError && shown.length === 0 && <p className="tool-empty">No questions yet. Add the first question to this exam.</p>}
        {shown.map((question) => (
          <div className="question-row" key={question.id}>
            <div>
              <span>
                {question.topic} · <em className={question.difficulty}>{question.difficulty}</em>
              </span>
              <b>{question.prompt}</b>
              <small>Multiple choice · {question.points} marks</small>
            </div>
            <span className="question-answer-key">Answer {String.fromCharCode(65 + question.correctOption)}</span>
          </div>
        ))}
      </section>
      {open && (
        <div className="drawer-backdrop">
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="question-drawer-title">
            <div className="drawer-head">
              <div><span>QUESTION EDITOR</span><h2 id="question-drawer-title">Write with precision.</h2></div>
              <button onClick={() => setOpen(false)} aria-label="Close question editor"><Icon name="x" /></button>
            </div>
            <form onSubmit={saveQuestion}>
              <label>Examination
                <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                  {examOptions.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
                </select>
              </label>
              <div className="form-grid">
                <label>Topic<input name="topic" required placeholder="e.g. Cell structure" /></label>
                <label>Difficulty
                  <select name="difficulty" defaultValue="moderate">
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult</option>
                  </select>
                </label>
              </div>
              <label>Question<textarea name="prompt" required placeholder="Write the question…" /></label>
              <b className="form-label">ANSWER OPTIONS · SELECT THE CORRECT ANSWER</b>
              {[0, 1, 2, 3].map((index) => (
                <label className="answer-edit" key={index}>
                  <input type="radio" name="correctOption" value={index} required />
                  <span>{String.fromCharCode(65 + index)}</span>
                  <input name={`option${index}`} required placeholder={`Option ${String.fromCharCode(65 + index)}`} />
                </label>
              ))}
              <label>Explanation<textarea name="explanation" placeholder="Explain why this answer is correct." /></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="drawer-actions">
                <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save question"}</Button>
              </div>
            </form>
          </aside>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />{toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")}><Icon name="x" size={16} /></button>
        </div>
      )}
    </Shell>
  );
}

export function Analytics() {
  return (
    <Shell role="teacher" route="analytics">
      <PageTitle
        eyebrow="RESULTS & ANALYTICS"
        title="See where learning lands."
        subtitle="Cell Biology & Genetics · 42 submissions"
        action={
          <Button variant="secondary" disabled>
            Export results
          </Button>
        }
      />
      <div className="metric-grid">
        <Metric label="PARTICIPATION" value="42/44" note="95% completion" icon="users" />
        <Metric label="AVERAGE" value="81%" note="Class performance" icon="chart" tone="violet" />
        <Metric label="HIGHEST" value="96%" note="Top score" icon="spark" tone="green" />
        <Metric label="AVG. TIME" value="38m" note="of 45 minutes" icon="clock" tone="gold" />
      </div>
      <div className="breakdown-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>QUESTION PERFORMANCE</span>
              <h2>Accuracy by question</h2>
            </div>
          </div>
          <div className="bar-chart">
            {[78, 92, 61, 84, 73, 95, 55, 88, 80, 69, 91, 76].map((n, i) => (
              <div key={i}>
                <i style={{ height: `${n}%` }}></i>
                <span>{i + 1}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>NEEDS ATTENTION</span>
              <h2>Most missed</h2>
            </div>
          </div>
          {[
            ["Question 7", "Cell transport", "55%"],
            ["Question 3", "Genetics", "61%"],
            ["Question 10", "DNA replication", "69%"],
          ].map((x) => (
            <div className="missed" key={x[0]}>
              <strong>{x[2]}</strong>
              <div>
                <b>{x[0]}</b>
                <span>{x[1]}</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}
