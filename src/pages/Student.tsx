import { useEffect, useState } from "react";
import {
  exams,
  questions,
  courseExamAnalyses,
  studentStudySnapshots,
  type Exam,
  type StudentExamAnalysis,
} from "../data";
import {
  demoSession,
  getCurrentUser,
  isDemoUser,
  getSavedQuestions,
  saveSavedQuestions,
  type ServerAttempt,
} from "../state";
import { getDemoExams, getDemoQuestionBank } from "../demoData";
import { apiRequest } from "../api";
import { Button, Icon, navigate } from "../components/ui";
import { PageTitle, Shell } from "../components/workspace";

export function StudentDashboard() {
  const featuredExam = exams[0]!;
  const currentUser = getCurrentUser();
  const studentName = currentUser?.name || "Rudrakshi Sharma";
  const featuredQuestionCount = isDemoUser()
    ? getDemoQuestionBank(featuredExam.id).length
    : questions.length;
  const [savedQuestions, setSavedQuestions] = useState<number[]>(() => getSavedQuestions());
  const analysis = courseExamAnalyses.find(
    (entry) => entry.student === "Rudrakshi Sharma" && entry.examId === featuredExam.id,
  );
  const studySnapshot = studentStudySnapshots.find(
    (entry) => entry.student === "Rudrakshi Sharma" && entry.examId === featuredExam.id,
  );
  const weeklyActivity = studySnapshot?.weeklyActivity ?? [];
  const activeDays = weeklyActivity.filter((entry) => entry.active).length;
  const streak = weeklyActivity.slice().reverse().findIndex((entry) => !entry.active);
  const currentStreak = streak === -1 ? weeklyActivity.length : streak;
  const topicCompletion =
    studySnapshot && studySnapshot.totalTopics > 0
      ? (studySnapshot.completedTopics / studySnapshot.totalTopics) * 100
      : 0;
  const readiness = Math.round(
    (studySnapshot?.practiceScore ?? 0) * 0.5 + topicCompletion * 0.35 + (activeDays / 7) * 100 * 0.15,
  );
  const weakTopics = analysis?.weakTopics ?? [];
  const savedQuestionDetails = questions.filter((question) => savedQuestions.includes(question.id));

  const removeSavedQuestion = (id: number) => {
    const next = savedQuestions.filter((questionId) => questionId !== id);
    setSavedQuestions(next);
    saveSavedQuestions(next);
  };

  return (
    <Shell role="student" route="student">
      <PageTitle
        eyebrow="STUDENT DASHBOARD"
        title={`Good morning, ${studentName}.`}
        subtitle="One exam is live and ready when you are."
        action={
          <Button variant="secondary" onClick={() => navigate("discover")} icon="search">
            Find an exam
          </Button>
        }
      />
      <section className="active-exam">
        <div className="active-copy">
          <div className="live-badge">
            <i></i> AVAILABLE NOW
          </div>
          <span className="exam-code">{featuredExam.code} · {featuredExam.subject.toUpperCase()}</span>
          <h2>{featuredExam.title}</h2>
          <div className="exam-facts">
            <span>
              <Icon name="clock" />
              {featuredExam.duration} minutes
            </span>
            <span>
              <Icon name="file" />
              {featuredQuestionCount} questions
            </span>
            <span>
              <Icon name="spark" />
              {featuredExam.marks} marks
            </span>
          </div>
          <Button
            onClick={() => {
              demoSession.selectedExamId = 1;
              navigate("prepare");
            }}
            icon="arrow"
          >
            View examination
          </Button>
        </div>
        <div className="active-art">
          <div className="system-node system-node-a"></div>
          <div className="system-node system-node-b"></div>
          <div className="system-node system-node-c"></div>
          <span>READY</span>
          <strong>01</strong>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>PERSONALI COACHING</span>
              <h2>Learning analysis</h2>
            </div>
            <button onClick={() => navigate("analysis")}>
              Open analysis <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="learning-overview">
            <div
              className="readiness-ring"
              style={{ background: `conic-gradient(var(--violet) ${readiness}%, #e7e6e1 0)` }}
            >
              <div>
                <strong>{readiness}</strong>
                <span>%</span>
              </div>
            </div>
            <div className="streak-card">
              <div className="streak-header">
                <span>STREAK</span>
                <strong>{currentStreak} days</strong>
              </div>
              <div className="week-grid" aria-label="Weekly study activity">
                {weeklyActivity.map(({ day, active }, index) => (
                  <div
                    key={`${day}-${index}`}
                    className={active ? "day active" : "day"}
                    aria-label={`${day}: ${active ? "study activity recorded" : "no activity"}`}
                    title={active ? "Study activity recorded" : "No activity recorded"}
                  >
                    <b>{day}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="weak-topics-card">
              <span>WEAK TOPICS</span>
              {weakTopics.slice(0, 3).map((topic) => (
                <div key={topic.topic} className="weak-topic-mini">
                  <div>
                    <b>{topic.topic}</b>
                    <small>{topic.mastery}% mastery</small>
                  </div>
                  <i style={{ width: `${topic.mastery}%` }}></i>
                  <small>{topic.actions[0]}</small>
                </div>
              ))}
              <button className="text-btn" onClick={() => navigate("analysis")}>
                View revision plan <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>
        </section>
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>NEXT IN LINE</span>
              <h2>Upcoming examinations</h2>
            </div>
            <button onClick={() => navigate("discover")}>
              View all <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="exam-list">
            {exams
              .filter((x) => x.status === "Upcoming")
              .map((x) => (
                <ExamRow exam={x} key={x.id} />
              ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>YOUR PULSE</span>
              <h2>Recent results</h2>
            </div>
          </div>
          <div className="score-ring">
            <div>
              <strong>84</strong>
              <span>%</span>
            </div>
          </div>
          <div className="result-mini">
            <b>Programming in Java</b>
            <span>51 / 60 marks · Nov 18</span>
          </div>
          <button className="wide-link" onClick={() => navigate("results")}>
            Open result <Icon name="arrow" size={15} />
          </button>
        </section>
        <section className="panel span-2">
          <div className="panel-head">
            <div>
              <span>ACTIVITY</span>
              <h2>Recent history</h2>
            </div>
          </div>
          <div className="history-table">
            <div className="table-row table-head">
              <span>Examination</span>
              <span>Date</span>
              <span>Score</span>
              <span>Status</span>
            </div>
            {exams
              .filter((x) => x.status === "Completed")
              .map((x, i) => (
                <div className="table-row" key={x.id}>
                  <span>
                    <i style={{ background: x.accent }}></i>
                    <b>{x.title}</b>
                    <small>{x.code}</small>
                  </span>
                  <span>{x.date}</span>
                  <span>
                    <strong>{i ? "42 / 50" : "67 / 80"}</strong>
                  </span>
                  <span>
                    <em className="status completed">Completed</em>
                  </span>
                </div>
              ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>REVISION VAULT</span>
              <h2>Saved questions</h2>
            </div>
          </div>
          <div className="revision-vault">
            {savedQuestionDetails.length === 0 ? (
              <div className="empty-saved">
                <Icon name="book" />
                <p>No questions saved yet. Mark a difficult one during revision to revisit it here.</p>
              </div>
            ) : (
              savedQuestionDetails.map((question) => (
                <div className="revision-item" key={question.id}>
                  <button
                    className="revision-question"
                    onClick={() => {
                      demoSession.reviewQuestionId = question.id;
                      demoSession.selectedExamId = featuredExam.id;
                      navigate("attempt");
                    }}
                  >
                    <small>{question.topic}</small>
                    <b>{question.text}</b>
                    <span>Revisit question</span>
                  </button>
                  <button onClick={() => removeSavedQuestion(question.id)}>Remove</button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>NOTICES</span>
              <h2>For your attention</h2>
            </div>
          </div>
          <div className="notice">
            <i className="notice-icon">
              <Icon name="calendar" />
            </i>
            <div>
              <b>Schedule updated</b>
              <p>Discrete Structures now begins at 9:00 AM.</p>
              <small>18 minutes ago</small>
            </div>
          </div>
          <div className="notice">
            <i className="notice-icon violet">
              <Icon name="book" />
            </i>
            <div>
              <b>Result published</b>
              <p>Your Data Structures and Algorithms result is ready.</p>
              <small>Yesterday</small>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function ExamRow({ exam }: { exam: Exam }) {
  return (
    <button
      className="exam-row"
      onClick={() => {
        demoSession.selectedExamId = exam.id;
        demoSession.selectedExamDetails = exam;
        navigate(exam.status === "Live" ? "prepare" : "discover");
      }}
    >
      <i className="subject-marker" style={{ background: exam.accent }}></i>
      <div className="exam-row-title">
        <small>{exam.code}</small>
        <b>{exam.title}</b>
      </div>
      <div>
        <small>WHEN</small>
        <b>{exam.date}</b>
      </div>
      <div>
        <small>DURATION</small>
        <b>{exam.duration} min</b>
      </div>
      <em className={`status ${exam.status.toLowerCase()}`}>{exam.status}</em>
      <Icon name="arrow" />
    </button>
  );
}

export function Analysis() {
  const [availableAnalyses, setAvailableAnalyses] = useState<StudentExamAnalysis[]>(
    () => courseExamAnalyses.filter((entry) => entry.student === "Rudrakshi Sharma"),
  );
  const [usingSampleData, setUsingSampleData] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedExamId, setSelectedExamId] = useState(
    demoSession.selectedExamId || courseExamAnalyses[0]?.examId || 1,
  );

  useEffect(() => {
    if (isDemoUser()) return;
    apiRequest<{ analyses: StudentExamAnalysis[] }>("/student/analysis")
      .then(({ analyses }) => {
        setAvailableAnalyses(analyses);
        setUsingSampleData(false);
      })
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "Your analysis could not be loaded."),
      );
  }, []);

  useEffect(() => {
    if (availableAnalyses.length === 0) return;
    if (!availableAnalyses.some((entry) => entry.examId === selectedExamId)) {
      setSelectedExamId(availableAnalyses[0].examId);
    }
  }, [availableAnalyses, selectedExamId]);

  useEffect(() => {
    demoSession.selectedExamId = selectedExamId;
  }, [selectedExamId]);

  const activeAnalysis =
    availableAnalyses.find((entry) => entry.examId === selectedExamId) ?? availableAnalyses[0];

  if (!activeAnalysis) {
    return (
      <Shell role="student" route="analysis">
        {loadError && <p className="form-error" role="alert">{loadError}</p>}
        <PageTitle
          eyebrow="PERSONAL ANALYSIS"
          title={usingSampleData ? "No analysis available yet." : "No submitted exam results yet."}
          subtitle={
            usingSampleData
              ? "Review an exam and revisit once your learning pattern is ready."
              : "Submit an exam to see topic-by-topic performance and tailored study resources."
          }
        />
      </Shell>
    );
  }

  return (
    <Shell role="student" route="analysis">
      <PageTitle
        eyebrow={usingSampleData ? "PERSONAL ANALYSIS · SAMPLE" : "PERSONAL ANALYSIS"}
        title={usingSampleData ? `${activeAnalysis.student}'s sample learning report` : "Your learning report"}
        subtitle={`Tailored guidance for ${activeAnalysis.examTitle} based on your submitted attempts and question performance.`}
        action={
          <Button variant="secondary" onClick={() => navigate("prepare")} icon="arrow">
            Open exam
          </Button>
        }
      />
      {loadError && <p className="form-error" role="alert">{loadError} Showing clearly labeled sample data.</p>}
      <section className="panel analysis-overview">
        <div className="analysis-header">
          <div>
            <span>SELECTED ASSESSMENT</span>
            <h2>
              {activeAnalysis.examCode} · {activeAnalysis.examTitle}
            </h2>
          </div>
          <div className="analysis-selector">
            {availableAnalyses.map((entry) => (
              <button
                key={entry.examId}
                className={entry.examId === activeAnalysis.examId ? "active" : ""}
                onClick={() => setSelectedExamId(entry.examId)}
              >
                {entry.examCode}
              </button>
            ))}
          </div>
        </div>

        <div className="analysis-summary-grid">
          <div className="analysis-summary-card accent-orange">
            <span>Overall</span>
            <strong>{activeAnalysis.overallScore}%</strong>
            <small>performance score</small>
          </div>
          <div className="analysis-summary-card accent-violet">
            <span>Readiness</span>
            <strong>{activeAnalysis.readiness}%</strong>
            <small>exam confidence</small>
          </div>
          <div className="analysis-summary-card accent-green">
            <span>Strongest recall</span>
            <strong>{activeAnalysis.strengths[0]}</strong>
            <small>best-performing area</small>
          </div>
        </div>

        <div className="analysis-brief">
          <p>{activeAnalysis.summary}</p>
          <div className="analysis-pill-row">
            {activeAnalysis.strengths.map((strength) => (
              <span key={strength} className="analysis-pill">
                {strength}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="analysis-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>WEAK TOPICS</span>
              <h2>Priority review areas</h2>
            </div>
          </div>
          <div className="weak-topic-list">
            {activeAnalysis.weakTopics.map((topic) => (
              <article className="weak-topic" key={topic.topic}>
                <div className="weak-topic-head">
                  <div>
                    <h3>{topic.topic}</h3>
                    <span className={`topic-trend ${topic.trend.toLowerCase().replace(/\s+/g, "-")}`}>
                      {topic.trend}
                    </span>
                  </div>
                  <strong>{topic.mastery}%</strong>
                </div>
                <div className="topic-meter">
                  <i style={{ width: `${topic.mastery}%` }}></i>
                </div>
                <p>{topic.summary}</p>
                <ul>
                  {topic.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                <div className="resource-list">
                  {topic.resources.map((resource) => (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="resource-card"
                      key={resource.title}
                    >
                      <span>{resource.platform}</span>
                      <strong>{resource.title}</strong>
                      <small>{resource.description}</small>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-head">
            <div>
              <span>COACHING PLAN</span>
              <h2>Next best actions</h2>
            </div>
          </div>
          <ol className="next-step-list">
            {activeAnalysis.nextSteps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <div className="mini-guide">
            <h3>What this means</h3>
            <p>
              Your data shows strong recognition and moderate application. The next step is to improve
              knowledge transfer under timed conditions, especially for idea-to-solution exam questions.
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

export function Discover() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (isDemoUser()) {
      try {
        setAvailableExams(
          getDemoExams().map((exam) => ({
            ...exam,
            questions: getDemoQuestionBank(exam.id).length,
          })),
        );
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Demo examinations could not be loaded.");
      } finally {
        setLoading(false);
      }
      return;
    }
    apiRequest<{
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
    }>("/exams")
      .then(({ exams: records }) =>
        setAvailableExams(
          records.map((item) => {
            const startsAt = item.startsAt ? new Date(item.startsAt) : null;
            const endsAt = item.endsAt ? new Date(item.endsAt) : null;
            const status: Exam["status"] =
              item.status === "closed" ? "Completed" :
              startsAt && startsAt > new Date() ? "Upcoming" : "Live";
            return {
              id: item.id,
              title: item.title,
              code: item.code,
              subject: item.subject,
              duration: item.duration,
              questions: Number(item.questionCount),
              marks: Number(item.marks),
              date: endsAt ? `Until ${endsAt.toLocaleString()}` : startsAt ? startsAt.toLocaleString() : "Available now",
              status,
              accent: exams.find((exam) => exam.subject === item.subject)?.accent ?? "var(--violet)",
            };
          }),
        ),
      )
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "The examination catalogue could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, []);

  const shown = availableExams.filter(
    (x) =>
      x.status !== "Draft" &&
      (filter === "All" || x.status === filter) &&
      `${x.title} ${x.subject} ${x.code}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Shell role="student" route="discover">
      <PageTitle
        eyebrow="EXAM CATALOGUE"
        title="Find your next examination."
        subtitle="Browse available and scheduled examinations."
      />
      <div className="search-strip">
        <div className="search-box">
          <Icon name="search" />
          <input
            placeholder="Search by title, subject or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {["All", "Live", "Upcoming", "Completed"].map((x) => (
            <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
        <button
          className="filter-btn"
          aria-label="Clear catalogue filters"
          onClick={() => {
            setQuery("");
            setFilter("All");
          }}
        >
          <Icon name="filter" /> Clear filters
        </button>
      </div>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <div className="catalogue-count">
        <span>{loading ? "Loading examinations…" : `${shown.length} examinations`}</span>
        <small>Live examination records</small>
      </div>
      <div className="exam-grid">
        {shown.map((x) => (
          <article className="exam-card" key={x.id}>
            <div className="card-topline" style={{ background: x.accent }}></div>
            <div className="exam-card-head">
              <span className="subject-symbol" style={{ color: x.accent }}>
                {x.subject.slice(0, 2).toUpperCase()}
              </span>
              <em className={`status ${x.status.toLowerCase()}`}>{x.status}</em>
            </div>
            <small>
              {x.code} · {x.subject.toUpperCase()}
            </small>
            <h2>{x.title}</h2>
            <p>{x.status === "Live" ? "Available until 4:30 PM today" : x.date}</p>
            <div className="card-facts">
              <span>
                <Icon name="clock" />
                {x.duration} min
              </span>
              <span>
                <Icon name="file" />
                {x.questions} questions
              </span>
              <span>
                <Icon name="spark" />
                {x.marks} marks
              </span>
            </div>
            <Button
              variant={x.status === "Completed" ? "secondary" : "primary"}
              onClick={() => {
                demoSession.selectedExamId = x.id;
                demoSession.selectedExamDetails = x;
                navigate(
                  x.status === "Completed"
                    ? "results"
                    : x.status === "Live"
                      ? "prepare"
                      : "discover",
                );
              }}
              icon="arrow"
            >
              {x.status === "Completed"
                ? "View result"
                : x.status === "Live"
                  ? "View details"
                  : "View schedule"}
            </Button>
          </article>
        ))}
        {!loading && !loadError && shown.length === 0 && (
          <div className="empty-results">
            <Icon name={availableExams.length ? "search" : "file"} size={28} />
            <h2>{availableExams.length ? "No examinations match." : "No available examinations yet."}</h2>
            <p>
              {availableExams.length
                ? "Try another keyword or clear the selected status."
                : "Published exams from your teachers will appear here."}
            </p>
            {availableExams.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

export function Prepare() {
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const exam =
    demoSession.selectedExamDetails?.id === demoSession.selectedExamId
      ? demoSession.selectedExamDetails
      : (isDemoUser()
          ? getDemoExams().find((item) => item.id === demoSession.selectedExamId)
          : exams.find((item) => item.id === demoSession.selectedExamId)) ?? exams[0]!;
  const examQuestionCount = isDemoUser()
    ? getDemoQuestionBank(exam.id).length
    : questions.length;
  return (
    <Shell role="student" route="discover">
      <button className="back-link inline" onClick={() => navigate("discover")}>
        ← Back to examinations
      </button>
      <div className="prepare-layout">
        <div className="prepare-main">
          <div className="prep-tag">
            <i></i>AVAILABLE NOW · UNTIL 4:30 PM
          </div>
          <span className="exam-code">{exam.code} · {exam.subject.toUpperCase()}</span>
          <h1>{exam.title}</h1>
          <p className="lead">
            This examination covers core concepts and problem-solving skills in {exam.subject}.
          </p>
          <div className="prep-metrics">
            <div>
              <Icon name="clock" />
              <span>
                DURATION<strong>{exam.duration} minutes</strong>
              </span>
            </div>
            <div>
              <Icon name="file" />
              <span>
                QUESTIONS<strong>{examQuestionCount} multiple choice</strong>
              </span>
            </div>
            <div>
              <Icon name="spark" />
              <span>
                TOTAL<strong>{exam.marks} marks</strong>
              </span>
            </div>
          </div>
          <section className="instruction-block">
            <span>BEFORE YOU BEGIN</span>
            <h2>Examination instructions</h2>
            <ol>
              <li>You must complete the examination in one sitting.</li>
              <li>Choose one answer for each question. You may change it before submitting.</li>
              <li>Use “mark for review” to flag questions you want to revisit.</li>
              <li>
                This prototype timer is for demonstration only and does not submit automatically.
              </li>
              <li>Leaving this tab may trigger a demonstration warning.</li>
            </ol>
          </section>
        </div>
        <aside className="start-card">
          <div className="readiness">
            <span>READINESS CHECK</span>
            <strong>Almost ready</strong>
            <div>
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
          <ul>
            <li>
              <Icon name="check" />
              Stable connection recommended
            </li>
            <li>
              <Icon name="check" />
              Timer begins after confirmation
            </li>
            <li>
              <Icon name="check" />
              Answers are saved in this session
            </li>
          </ul>
          <label className="confirm-check">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I have read the instructions and am ready to begin this demonstration.</span>
          </label>
          {startError && <p className="form-error" role="alert">{startError}</p>}
          <Button
            disabled={!agreed || starting}
            onClick={async () => {
              setStartError("");
              setStarting(true);
              try {
                if (isDemoUser()) {
                  if (examQuestionCount === 0) {
                    throw new Error("This examination has no questions yet. Ask the teacher to add questions first.");
                  }
                  demoSession.activeAttempt = null;
                  demoSession.latestSubmission = {};
                  demoSession.confidenceByQuestion = {};
                  window.sessionStorage.removeItem("examspark-active-attempt");
                  navigate("attempt");
                  return;
                }
                const result = await apiRequest<{ attempt: ServerAttempt }>(
                  `/exams/${demoSession.selectedExamId}/attempts`,
                  { method: "POST" },
                );
                demoSession.activeAttempt = result.attempt;
                demoSession.latestSubmission = {};
                window.sessionStorage.setItem("examspark-active-attempt", String(result.attempt.attemptId));
                navigate("attempt");
              } catch (error) {
                setStartError(error instanceof Error ? error.message : "The examination could not be started.");
              } finally {
                setStarting(false);
              }
            }}
            icon="arrow"
          >
            {starting ? "Starting…" : "Start timed examination"}
          </Button>
          <small>This prototype does not securely monitor or grade an exam.</small>
        </aside>
      </div>
    </Shell>
  );
}
