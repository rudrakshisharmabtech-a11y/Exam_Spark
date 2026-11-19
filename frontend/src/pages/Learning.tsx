import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../api";
import { Button, Icon } from "../components/ui";
import { PageTitle, Shell } from "../components/workspace";
import { getCurrentUser, isDemoUser } from "../state";
import { courseSubjects } from "../data";

const studyLibrary = [
  {
    subject: "Database Management System",
    topic: "DBMS handbook and fundamentals",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/dbms/",
    description: "Notes on relational models, keys, normalization, transactions, and SQL.",
  },
  {
    subject: "Database Management System",
    topic: "SQL tutorial and practice",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/sql-tutorial/",
    description: "Learn queries, joins, grouping, and subqueries with examples.",
  },
  {
    subject: "Database Management System",
    topic: "DBMS video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=DBMS+normalization+SQL+tutorial",
    description: "Video walkthroughs of normalization, ER models, and SQL problems.",
  },
  {
    subject: "Programming in Java",
    topic: "Java learning path",
    platform: "dev.java",
    url: "https://dev.java/learn/",
    description: "Official Java tutorials for language basics, classes, and APIs.",
  },
  {
    subject: "Programming in Java",
    topic: "Java programming notes and problems",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/java/",
    description: "Java examples, core concepts, and coding practice.",
  },
  {
    subject: "Programming in Java",
    topic: "Java video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=Java+programming+OOP+tutorial",
    description: "Video lessons on Java fundamentals, OOP, and collections.",
  },
  {
    subject: "Data Structures and Algorithms",
    topic: "Data structures and algorithms handbook",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/data-structures/",
    description: "Reference notes and examples for common data structures and algorithms.",
  },
  {
    subject: "Data Structures and Algorithms",
    topic: "Coding problems and practice",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/explore?page=1&sortBy=submissions",
    description: "Practice coding problems and review solution approaches.",
  },
  {
    subject: "Data Structures and Algorithms",
    topic: "DSA video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=data+structures+algorithms+course",
    description: "Video explanations of arrays, trees, graphs, and complexity.",
  },
  {
    subject: "Discrete Structures",
    topic: "Discrete mathematics handbook",
    platform: "Open Math Books",
    url: "https://discrete.openmathbooks.org/dmoi3.html",
    description: "An open textbook covering logic, sets, counting, and graph theory.",
  },
  {
    subject: "Discrete Structures",
    topic: "Discrete mathematics notes and problems",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/discrete-mathematics/",
    description: "Topic notes and practice problems for discrete structures.",
  },
  {
    subject: "Discrete Structures",
    topic: "Discrete mathematics video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=discrete+mathematics+logic+sets+graph+theory",
    description: "Video lessons on propositional logic, relations, and graphs.",
  },
  {
    subject: "Advanced Web Technologies",
    topic: "Web development learning guide",
    platform: "MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
    description: "Guides for HTML, CSS, JavaScript, and modern web development.",
  },
  {
    subject: "Advanced Web Technologies",
    topic: "Web technology examples and practice",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/web-development/",
    description: "Web development tutorials, examples, and coding exercises.",
  },
  {
    subject: "Advanced Web Technologies",
    topic: "Advanced web technologies video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=advanced+web+development+technologies+tutorial",
    description: "Video lessons on APIs, client-server applications, and web frameworks.",
  },
  {
    subject: "Operating Systems",
    topic: "Operating Systems: Three Easy Pieces",
    platform: "Open textbook",
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
    description: "Free textbook covering virtualization, concurrency, and persistence.",
  },
  {
    subject: "Operating Systems",
    topic: "Operating systems notes and problems",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/operating-systems/",
    description: "Review processes, scheduling, memory management, and file systems.",
  },
  {
    subject: "Operating Systems",
    topic: "Operating systems video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=operating+systems+processes+memory+management+tutorial",
    description: "Video lessons on processes, synchronization, and memory.",
  },
  {
    subject: "Computer Systems",
    topic: "Computer Systems: A Programmer's Perspective",
    platform: "CS:APP",
    url: "https://csapp.cs.cmu.edu/3e/home.html",
    description: "Course materials on machine-level programs, memory, and architecture.",
  },
  {
    subject: "Computer Systems",
    topic: "Computer organization and architecture",
    platform: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/computer-organization-and-architecture-tutorials/",
    description: "Notes and examples covering processors, memory, and system design.",
  },
  {
    subject: "Computer Systems",
    topic: "Computer systems video lessons",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=computer+systems+architecture+course",
    description: "Video explanations of instruction sets, memory, and computer architecture.",
  },
];

type ChatMessage = { question: string; answer: string };

type AssignmentRecord = {
  id: number;
  title: string;
  subject: string;
  section: string | null;
  dueAt: string;
  completedAt: string | null;
  description?: string;
};

const demoAssignmentsKey = "examspark-demo-assignments";
const demoAssignmentSeeds = [
  {
    title: "Normalize a student-course database to 3NF",
    subject: "Database Management System",
    daysFromNow: 0,
    description: "Draw the ER model, identify keys, and explain the normalization steps.",
  },
  {
    title: "Build a Java gradebook with classes and collections",
    subject: "Programming in Java",
    daysFromNow: 1,
    description: "Use encapsulation and a collection to store students and calculate averages.",
  },
  {
    title: "Solve array and linked-list coding problems",
    subject: "Data Structures and Algorithms",
    daysFromNow: 2,
    description: "Complete two practice problems and note the time complexity of each solution.",
  },
  {
    title: "Create a responsive course page with form validation",
    subject: "Advanced Web Technologies",
    daysFromNow: 3,
    description: "Build a small responsive page and validate a form with client-side JavaScript.",
  },
];

function isAssignmentRecord(value: unknown): value is AssignmentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.title === "string" &&
    typeof record.subject === "string" &&
    (typeof record.section === "string" || record.section === null) &&
    typeof record.dueAt === "string" &&
    (typeof record.completedAt === "string" || record.completedAt === null)
  );
}

function createDemoAssignments(): AssignmentRecord[] {
  return demoAssignmentSeeds.map((seed, index) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + seed.daysFromNow);
    dueDate.setHours(23, 59, 0, 0);
    return {
      id: index + 1,
      title: seed.title,
      subject: seed.subject,
      section: "A",
      dueAt: dueDate.toISOString(),
      completedAt: null,
      description: seed.description,
    };
  });
}

function readDemoAssignments(): AssignmentRecord[] {
  const saved = window.localStorage.getItem(demoAssignmentsKey);
  if (saved) {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isAssignmentRecord)) {
      throw new Error("Saved demo assignment data is invalid. Clear this browser's demo data and reload.");
    }
    return parsed;
  }
  const initial = createDemoAssignments();
  window.localStorage.setItem(demoAssignmentsKey, JSON.stringify(initial));
  return initial;
}

function saveDemoAssignments(assignments: AssignmentRecord[]) {
  window.localStorage.setItem(demoAssignmentsKey, JSON.stringify(assignments));
}

function teacherAssignmentView(item: AssignmentRecord) {
  return {
    id: item.id,
    title: item.title,
    course: `${item.subject}${item.section ? ` · Section ${item.section}` : ""}`,
    due: new Date(item.dueAt).toLocaleDateString(),
  };
}

export function Study() {
  const [subject, setSubject] = useState("Database Management System");
  const [pdf, setPdf] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const resources = studyLibrary.filter((item) => item.subject === subject);

  async function askPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pdf || !question.trim()) return;
    setChatError("");
    setChatLoading(true);
    try {
      const body = new FormData();
      body.append("file", pdf);
      body.append("question", question.trim());
      const result = await apiRequest<{ answer: string }>("/study/pdf-chat", {
        method: "POST",
        body,
      });
      setChat((messages) => [...messages, { question: question.trim(), answer: result.answer }]);
      setQuestion("");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "PDF chat could not be completed.");
    } finally {
      setChatLoading(false);
    }
  }

  async function summarize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transcript.trim() && !audio) return;
    setSummaryError("");
    setSummaryLoading(true);
    try {
      const audioFile = audio;
      const body = audioFile ? new FormData() : null;
      if (body && audioFile) {
        body.append("transcript", transcript.trim());
        body.append("audio", audioFile);
      }
      const result = await apiRequest<{ summary: string }>("/study/summarize", {
        method: "POST",
        body: body || JSON.stringify({ transcript: transcript.trim() }),
      });
      setSummary(result.summary);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "The summary could not be generated.");
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <Shell role="student" route="study">
      <PageTitle
        eyebrow="PERSONAL STUDY SPACE"
        title="Learn in the way that works for you."
        subtitle="Explore trusted resources, ask questions about a PDF, and turn lecture transcripts into focused notes."
      />
      <section className="panel study-library">
        <div className="panel-head">
          <div>
            <span>SUBJECT LIBRARY</span>
            <h2>Resources for every subject</h2>
          </div>
          <span className="demo-tag">Curated links</span>
        </div>
        <div className="filter-tabs study-subjects" aria-label="Select a subject">
          {courseSubjects.map((item) => (
            <button
              className={subject === item ? "active" : ""}
              onClick={() => setSubject(item)}
              key={item}
              aria-pressed={subject === item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="resource-list study-resources">
          {resources.map((item) => (
            <a className="resource-card" href={item.url} key={item.topic} target="_blank" rel="noreferrer">
              <span>{item.platform} · {item.subject}</span>
              <strong>{item.topic}</strong>
              <small>{item.description}</small>
              <b className="study-resource-link">Open resource <Icon name="arrow" size={14} /></b>
            </a>
          ))}
        </div>
      </section>

      <div className="study-tools-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span>PDF STUDY ASSISTANT</span>
              <h2>Ask your course material</h2>
            </div>
          </div>
          <p className="tool-description">Upload a PDF and ask a focused question. Answers are generated by the configured study assistant service.</p>
          <form className="study-tool-form" onSubmit={askPdf}>
            <label>
              Course PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  setPdf(event.target.files?.[0] ?? null);
                  setChatError("");
                }}
              />
            </label>
            <label>
              Your question
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What are the normalization steps for a relational schema?"
                rows={3}
                required
              />
            </label>
            {chatError && <p className="form-error" role="alert">{chatError}</p>}
            <Button type="submit" disabled={!pdf || !question.trim() || chatLoading} icon="arrow">
              {chatLoading ? "Thinking…" : "Ask about this PDF"}
            </Button>
          </form>
          <div className="study-chat" aria-live="polite">
            {chat.map((message, index) => (
              <article key={`${index}-${message.question}`}>
                <b>You asked</b>
                <p>{message.question}</p>
                <b>Study assistant</b>
                <p>{message.answer}</p>
              </article>
            ))}
            {chat.length === 0 && <p className="tool-empty">Your questions and answers will appear here.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span>SMART STUDY TOOLS</span>
              <h2>Video & audio summarizer</h2>
            </div>
          </div>
          <p className="tool-description">Paste a transcript from a lecture or video to create a concise, revision-ready summary.</p>
          <form className="study-tool-form" onSubmit={summarize}>
            <label>
              Lecture or video transcript (optional if audio is uploaded)
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Paste transcript text here…"
                rows={8}
              />
            </label>
            <label>
              Audio recording (optional)
              <input type="file" accept="audio/*" onChange={(event) => setAudio(event.target.files?.[0] ?? null)} />
            </label>
            {summaryError && <p className="form-error" role="alert">{summaryError}</p>}
            <Button type="submit" disabled={(!transcript.trim() && !audio) || summaryLoading} icon="spark">
              {summaryLoading ? "Preparing summary…" : "Summarize transcript"}
            </Button>
          </form>
          {summary && <div className="study-summary" role="status"><b>Revision summary</b><p>{summary}</p></div>}
        </section>
      </div>
    </Shell>
  );
}

export function StudentAssignments() {
  const isDemoMode = !getCurrentUser() || isDemoUser();
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      try {
        setAssignments(readDemoAssignments());
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Demo assignments could not be loaded.");
      } finally {
        setLoading(false);
      }
      return;
    }
    apiRequest<{ assignments: AssignmentRecord[] }>("/assignments")
      .then(({ assignments: records }) => setAssignments(records))
      .catch((requestError: unknown) =>
        setError(requestError instanceof Error ? requestError.message : "Assignments could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, [isDemoMode]);

  const pending = assignments.filter((item) => !item.completedAt).length;
  const completed = assignments.length - pending;
  const completionRate = assignments.length ? Math.round((completed / assignments.length) * 100) : 0;

  async function toggleAssignment(item: AssignmentRecord) {
    const completed = !item.completedAt;
    setError("");
    setSavingId(item.id);
    if (isDemoMode) {
      try {
        const updated = assignments.map((entry) =>
          entry.id === item.id
            ? { ...entry, completedAt: completed ? new Date().toISOString() : null }
            : entry,
        );
        saveDemoAssignments(updated);
        setAssignments(updated);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Demo assignment status could not be saved.");
      } finally {
        setSavingId(null);
      }
      return;
    }
    try {
      await apiRequest(`/assignments/${item.id}/completion`, {
        method: "PUT",
        body: JSON.stringify({ completed }),
      });
      setAssignments((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, completedAt: completed ? new Date().toISOString() : null }
            : entry,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Assignment status could not be saved.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Shell role="student" route="assignments">
      <PageTitle
        eyebrow="YOUR COURSEWORK"
        title="Assignments, made manageable."
        subtitle={`${pending} daily task${pending === 1 ? "" : "s"} still to complete across your courses.`}
      />
      <section className="panel">
        <div className="panel-head">
          <div>
            <span>TO-DO LIST</span>
            <h2>Daily assignments</h2>
          </div>
          <span className="demo-tag">{isDemoMode ? "Sample tasks" : "Synced with your account"}</span>
        </div>
        <p className="tool-description">
          Teachers post daily tasks from Teacher workspace → Assignments. Check off each task as you
          finish it; your completion report updates automatically.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading && <p className="tool-empty">Loading your assignments…</p>}
        {!loading && !error && assignments.length === 0 && (
          <p className="tool-empty">No assignments have been added to your section yet.</p>
        )}
        <div className="assignment-list">
          {assignments.map((item) => (
            <article className={`assignment-row ${item.completedAt ? "done" : ""}`} key={item.id}>
              <button
                className="assignment-check"
                aria-label={item.completedAt ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                aria-pressed={Boolean(item.completedAt)}
                disabled={savingId === item.id}
                onClick={() => toggleAssignment(item)}
              >
                {item.completedAt && <Icon name="check" size={16} />}
              </button>
              <div>
                <small>{item.subject}{item.section ? ` · Section ${item.section}` : ""}</small>
                <h3>{item.title}</h3>
                {item.description && <p className="assignment-description">{item.description}</p>}
              </div>
              <span className="assignment-due">Due {new Date(item.dueAt).toLocaleDateString()}</span>
              <em className={`status ${item.completedAt ? "completed" : "upcoming"}`}>
                {item.completedAt ? "Completed" : "In progress"}
              </em>
            </article>
          ))}
        </div>
      </section>
      <section className="panel assignment-report">
        <div className="panel-head">
          <div>
            <span>AUTO-UPDATED REPORT</span>
            <h2>Daily task progress</h2>
          </div>
          <span className="demo-tag">{completionRate}% complete</span>
        </div>
        <div className="assignment-report-stats">
          <div><strong>{completed}</strong><span>Completed</span></div>
          <div><strong>{pending}</strong><span>Remaining</span></div>
          <div><strong>{assignments.length}</strong><span>Total tasks</span></div>
        </div>
        <div
          className="assignment-report-bar"
          role="progressbar"
          aria-label="Daily assignment completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionRate}
        >
          <span style={{ width: `${completionRate}%` }} />
        </div>
        <p className="tool-description">
          This report tracks completed tasks, not the correctness or quality of submitted work.
        </p>
      </section>
    </Shell>
  );
}

type TeacherAssignment = ReturnType<typeof teacherAssignmentView>;

export function TeacherAssignments() {
  const isDemoMode = !getCurrentUser() || isDemoUser();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      try {
        setAssignments(readDemoAssignments().map(teacherAssignmentView));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Demo assignments could not be loaded.");
      } finally {
        setLoading(false);
      }
      return;
    }
    apiRequest<{
      assignments: Array<{ id: number; title: string; subject: string; section: string | null; dueAt: string }>;
    }>("/assignments")
      .then(({ assignments: records }) =>
        setAssignments(
          records.map((item) => ({
            id: item.id,
            title: item.title,
            course: `${item.subject}${item.section ? ` · Section ${item.section}` : ""}`,
            due: new Date(item.dueAt).toLocaleDateString(),
          })),
        ),
      )
      .catch((requestError: unknown) =>
        setError(requestError instanceof Error ? requestError.message : "Assignments could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, [isDemoMode]);

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title")).trim();
    const subject = String(form.get("subject")).trim();
    const section = String(form.get("section")).trim();
    const due = String(form.get("due")).trim();
    const dueAt = new Date(`${due}T23:59:00`).toISOString();
    setError("");
    setCreated(false);
    if (isDemoMode) {
      try {
        const existing = readDemoAssignments();
        const assignment: AssignmentRecord = {
          id: Math.max(0, ...existing.map((item) => item.id)) + 1,
          title,
          subject,
          section: section || null,
          dueAt,
          completedAt: null,
          description: "Daily task posted by your teacher.",
        };
        saveDemoAssignments([...existing, assignment]);
        setAssignments((current) => [...current, teacherAssignmentView(assignment)]);
        formElement.reset();
        setCreated(true);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Demo assignment could not be saved.");
      }
      return;
    }
    try {
      const result = await apiRequest<{ assignmentId: number }>("/assignments", {
        method: "POST",
        body: JSON.stringify({
          title,
          subject,
          section,
          dueAt,
        }),
      });
      setAssignments((current) => [
        ...current,
        {
          id: result.assignmentId,
          title,
          course: `${subject}${section ? ` · Section ${section}` : ""}`,
          due: new Date(dueAt).toLocaleDateString(),
        },
      ]);
      formElement.reset();
      setCreated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Assignment could not be saved.");
    }
  }
  return (
    <Shell role="teacher" route="classwork">
      <PageTitle
        eyebrow="TEACHER CLASSWORK"
        title="Publish daily student tasks."
        subtitle="Post short, focused assignments that students can complete from their daily to-do list."
      />
      <div className="teacher-assignment-grid">
        <section className="panel">
          <div className="panel-head"><div><span>NEW DAILY TASK</span><h2>Create an assignment</h2></div></div>
          <p className="tool-description">
            New tasks appear in the student Assignments tab. {isDemoMode ? "Demo tasks are shared in this browser." : "Choose the due date and class section."}
          </p>
          <form className="study-tool-form" onSubmit={createAssignment}>
            <label>Assignment title<input name="title" placeholder="e.g. SQL joins practice" required /></label>
            <label>
              Subject
              <select name="subject" defaultValue="Database Management System" required>
              {courseSubjects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Section<input name="section" placeholder="A (leave blank for all sections)" /></label>
            <label>Due date<input name="due" type="date" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {created && <p className="form-success" role="status">Assignment posted to the student daily task list.</p>}
            <Button type="submit" icon="plus">Add assignment</Button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head"><div><span>ASSIGNMENT QUEUE</span><h2>Upcoming daily tasks</h2></div></div>
          {loading && <p className="tool-empty">Loading assignments…</p>}
          {!loading && !error && assignments.length === 0 && (
            <p className="tool-empty">No assignments yet. Create one for a section to get started.</p>
          )}
          <div className="assignment-list">
            {assignments.map((item) => (
              <article className="assignment-row" key={item.id}>
                <div className="assignment-marker"><Icon name="file" size={17} /></div>
                <div><small>{item.course}</small><h3>{item.title}</h3></div>
                <span className="assignment-due">{item.due}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
