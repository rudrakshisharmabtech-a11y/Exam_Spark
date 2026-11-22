import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../api";
import { Button, Icon } from "../components/ui";
import { PageTitle, Shell } from "../components/workspace";

const studyLibrary = [
  {
    subject: "Biology",
    topic: "Cell transport and osmosis",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=cell+transport+osmosis+biology",
    description: "Visual lessons on diffusion, osmosis, and active transport.",
  },
  {
    subject: "Mathematics",
    topic: "Derivative applications",
    platform: "Khan Academy",
    url: "https://www.khanacademy.org/math/calculus-1",
    description: "Guided calculus lessons and practice for rates and optimization.",
  },
  {
    subject: "History",
    topic: "Modern world history",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=modern+world+history+overview",
    description: "Short topic explainers and primary-source walkthroughs.",
  },
  {
    subject: "Physics",
    topic: "Waves and optics",
    platform: "Khan Academy",
    url: "https://www.khanacademy.org/science/physics",
    description: "Review wave behavior, lenses, and core physics concepts.",
  },
  {
    subject: "English",
    topic: "Clear academic writing",
    platform: "Purdue OWL",
    url: "https://owl.purdue.edu/owl/general_writing/academic_writing/index.html",
    description: "Practical guides for structure, clarity, and evidence.",
  },
  {
    subject: "Chemistry",
    topic: "Organic chemistry foundations",
    platform: "YouTube",
    url: "https://www.youtube.com/results?search_query=organic+chemistry+basics+lesson",
    description: "Video lessons on structures, reactions, and naming.",
  },
];

type ChatMessage = { question: string; answer: string };

export function Study() {
  const [subject, setSubject] = useState("Biology");
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

  const videos = studyLibrary.filter((item) => item.subject === subject);

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
          {studyLibrary.map((item) => item.subject).filter((value, index, list) => list.indexOf(value) === index).map((item) => (
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
          {videos.map((item) => (
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
                placeholder="What are the key steps in cellular respiration?"
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
              <h2>Smart AI Summarizer</h2>
            </div>
            <button
              type="button"
              className="text-btn"
              style={{ fontSize: "12px", color: "var(--brand, #2563eb)", cursor: "pointer", fontWeight: 600 }}
              onClick={() => {
                setTranscript(
                  "Photosynthesis is the fundamental biological process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds like glucose. The process consists of two stages: the light-dependent reactions, which take place in the thylakoid membranes, and the light-independent reactions or Calvin cycle, which occur in the stroma of the chloroplast. Chlorophyll plays a crucial role in absorbing photons, particularly in the blue and red wavelengths."
                );
              }}
            >
              Paste Sample Transcript
            </button>
          </div>
          <p className="tool-description">Paste any lecture, video transcript or study notes to generate structured revision summaries with definitions and self-test checks.</p>
          <form className="study-tool-form" onSubmit={summarize}>
            <label>
              Lecture or video transcript (optional if audio is uploaded)
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                placeholder="Paste transcript text here (or click 'Paste Sample Transcript' above)…"
                rows={8}
              />
            </label>
            <label>
              Audio recording (optional)
              <input type="file" accept="audio/*" onChange={(event) => setAudio(event.target.files?.[0] ?? null)} />
            </label>
            {summaryError && <p className="form-error" role="alert">{summaryError}</p>}
            <Button type="submit" disabled={(!transcript.trim() && !audio) || summaryLoading} icon="spark">
              {summaryLoading ? "Generating AI Summary…" : "Summarize with Smart AI"}
            </Button>
          </form>
          {summary && (
            <div className="study-summary" role="status" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              <b>Generated Revision Summary</b>
              <p>{summary}</p>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

export function StudentAssignments() {
  type Assignment = {
    id: number;
    title: string;
    subject: string;
    section: string | null;
    dueAt: string;
    completedAt: string | null;
  };
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    apiRequest<{ assignments: Assignment[] }>("/assignments")
      .then(({ assignments: records }) => setAssignments(records))
      .catch((requestError: unknown) =>
        setError(requestError instanceof Error ? requestError.message : "Assignments could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, []);

  const pending = assignments.filter((item) => !item.completedAt).length;

  async function toggleAssignment(item: Assignment) {
    const completed = !item.completedAt;
    setError("");
    setSavingId(item.id);
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
        subtitle={`${pending} task${pending === 1 ? "" : "s"} still to complete across your courses.`}
      />
      <section className="panel">
        <div className="panel-head">
          <div>
            <span>TO-DO LIST</span>
            <h2>Upcoming assignments</h2>
          </div>
          <span className="demo-tag">Synced with your account</span>
        </div>
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
              </div>
              <span className="assignment-due">Due {new Date(item.dueAt).toLocaleDateString()}</span>
              <em className={`status ${item.completedAt ? "completed" : "upcoming"}`}>
                {item.completedAt ? "Completed" : "In progress"}
              </em>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

type TeacherAssignment = { id: number; title: string; course: string; due: string };

export function TeacherAssignments() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title")).trim();
    const subject = String(form.get("subject")).trim();
    const section = String(form.get("section")).trim();
    const due = String(form.get("due")).trim();
    setError("");
    try {
      const result = await apiRequest<{ assignmentId: number }>("/assignments", {
        method: "POST",
        body: JSON.stringify({
          title,
          subject,
          section,
          dueAt: new Date(`${due}T23:59:00`).toISOString(),
        }),
      });
      setAssignments((current) => [
        ...current,
        {
          id: result.assignmentId,
          title,
          course: `${subject}${section ? ` · Section ${section}` : ""}`,
          due: new Date(`${due}T23:59:00`).toLocaleDateString(),
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
        title="Keep classwork moving."
        subtitle="Create a focused assignment and keep upcoming work in one place."
      />
      <div className="teacher-assignment-grid">
        <section className="panel">
          <div className="panel-head"><div><span>NEW TASK</span><h2>Create an assignment</h2></div></div>
          <form className="study-tool-form" onSubmit={createAssignment}>
            <label>Assignment title<input name="title" placeholder="e.g. Cell transport review" required /></label>
            <label>Subject<input name="subject" placeholder="Biology" required /></label>
            <label>Section<input name="section" placeholder="A (leave blank for all sections)" /></label>
            <label>Due date<input name="due" type="date" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {created && <p className="form-success" role="status">Assignment saved to the class workspace.</p>}
            <Button type="submit" icon="plus">Add assignment</Button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head"><div><span>ASSIGNMENT QUEUE</span><h2>Upcoming work</h2></div></div>
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
