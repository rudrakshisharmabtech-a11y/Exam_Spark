import { useEffect, useRef, useState } from "react";
import { exams, questions } from "../data";
import { demoSession, saveSavedQuestions, type ConfidenceLevel, type ServerAttempt } from "../state";
import { apiRequest } from "../api";
import { Button, Icon, Logo, navigate } from "../components/ui";
import { useDialogFocus } from "../components/useDialogFocus";

export function Attempt() {
  const exam = exams.find((item) => item.id === demoSession.selectedExamId) ?? exams[0]!;
  const [serverAttempt, setServerAttempt] = useState<ServerAttempt | null>(() => demoSession.activeAttempt);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [review, setReview] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(() =>
    demoSession.activeAttempt
      ? Math.max(0, Math.ceil((Date.parse(demoSession.activeAttempt.expiresAt) - Date.now()) / 1000))
      : exam.duration * 60,
  );
  const [modal, setModal] = useState<"submit" | "warning" | "expired" | null>(null);
  const [confidenceVersion, setConfidenceVersion] = useState(0);
  const [revisionPulse, setRevisionPulse] = useState(0);
  const [attemptError, setAttemptError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const attemptQuestions = serverAttempt?.questions ?? questions;
  const questionCount = attemptQuestions.length;
  const confidenceLevels: ConfidenceLevel[] = ["Sure", "Unsure", "Guessed"];
  useDialogFocus(
    modal !== null,
    () => setModal((current) => (current === "expired" ? current : null)),
    ".modal",
    modal !== "expired",
  );
  useEffect(() => {
    if (serverAttempt) return;
    const savedAttemptId = window.sessionStorage.getItem("examspark-active-attempt");
    if (!savedAttemptId) return;
    apiRequest<{ attempt: ServerAttempt }>(`/attempts/${savedAttemptId}`)
      .then(({ attempt }) => {
        demoSession.activeAttempt = attempt;
        setServerAttempt(attempt);
        setSeconds(Math.max(0, Math.ceil((Date.parse(attempt.expiresAt) - Date.now()) / 1000)));
        const restoredAnswers: Record<number, number> = {};
        const restoredReview: number[] = [];
        for (const [index, question] of attempt.questions.entries()) {
          if (question.selectedOption !== null && question.selectedOption !== undefined) {
            restoredAnswers[index] = question.selectedOption;
          }
          if (question.flaggedForReview) restoredReview.push(index);
          if (question.confidence) {
            const level = question.confidence[0].toUpperCase() + question.confidence.slice(1);
            if (level === "Sure" || level === "Unsure" || level === "Guessed") {
              demoSession.confidenceByQuestion[question.id] = level;
            }
          }
        }
        setAnswers(restoredAnswers);
        setReview(restoredReview);
      })
      .catch((error: unknown) =>
        setAttemptError(error instanceof Error ? error.message : "The active attempt could not be restored."),
      );
  }, [serverAttempt]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => {
        const remaining = serverAttempt
          ? Math.ceil((Date.parse(serverAttempt.expiresAt) - Date.now()) / 1000)
          : s - 1;
        if (remaining <= 0) {
          window.clearInterval(id);
          return 0;
        }
        return remaining;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [serverAttempt?.expiresAt]);
  useEffect(() => {
    if (seconds === 0) setModal("expired");
  }, [seconds]);
  useEffect(() => {
    const fn = () => {
      if (!document.hidden) return;
      setModal("warning");
      if (serverAttempt) {
        apiRequest(`/attempts/${serverAttempt.attemptId}/monitor-events`, {
          method: "POST",
          body: JSON.stringify({ eventType: "tab_switch" }),
        }).catch((error: unknown) =>
          setAttemptError(error instanceof Error ? error.message : "The tab-switch event could not be recorded."),
        );
      }
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [serverAttempt?.attemptId]);
  const q = attemptQuestions[current] ?? attemptQuestions[0] ?? questions[0]!;
  const savedConfidence = "confidence" in q ? q.confidence : null;
  const currentConfidence =
    demoSession.confidenceByQuestion[q.id] ??
    (savedConfidence === "sure" ? "Sure" : savedConfidence === "unsure" ? "Unsure" : savedConfidence === "guessed" ? "Guessed" : undefined);
  const questionText = "prompt" in q ? q.prompt : q.text;
  const isSavedForRevision = demoSession.savedQuestions.includes(q.id);
  const confidenceKey = `${q.id}-${confidenceVersion}-${revisionPulse}`;
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  function persistAnswer(
    index: number,
    overrides: { selectedOption?: number | null; confidence?: ConfidenceLevel | null; flaggedForReview?: boolean } = {},
  ) {
    if (!serverAttempt) return;
    const question = attemptQuestions[index];
    if (!question) return;
    const confidence =
      overrides.confidence === undefined
        ? demoSession.confidenceByQuestion[question.id]?.toLowerCase() || null
        : overrides.confidence?.toLowerCase() || null;
    const selectedOption =
      overrides.selectedOption === undefined ? answers[index] ?? null : overrides.selectedOption;
    const flaggedForReview = overrides.flaggedForReview ?? review.includes(index);
    saveQueue.current = saveQueue.current
      .then(async () => {
        await apiRequest(`/attempts/${serverAttempt.attemptId}/answers`, {
          method: "PUT",
          body: JSON.stringify({
            questionId: question.id,
            selectedOption,
            confidence,
            flaggedForReview,
          }),
        });
      })
      .catch((error: unknown) => {
        setAttemptError(error instanceof Error ? error.message : "An answer could not be saved.");
      });
  }

  function toggleReview() {
    const next = review.includes(current)
      ? review.filter((index) => index !== current)
      : [...review, current];
    setReview(next);
    persistAnswer(current, { flaggedForReview: next.includes(current) });
  }

  async function submitAttempt() {
    if (!serverAttempt) {
      demoSession.latestSubmission = answers;
      navigate("results");
      return;
    }
    setSubmitting(true);
    setAttemptError("");
    try {
      await saveQueue.current;
      await apiRequest(`/attempts/${serverAttempt.attemptId}/submit`, { method: "POST" });
      demoSession.activeAttempt = serverAttempt;
      window.sessionStorage.removeItem("examspark-active-attempt");
      navigate("results");
    } catch (error) {
      setAttemptError(error instanceof Error ? error.message : "The examination could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="attempt-page">
      <header className="attempt-head">
        <Logo inverse />
        <div>
          <small>{serverAttempt ? `ATTEMPT #${serverAttempt.attemptId}` : exam.code}</small>
          <b>{serverAttempt?.exam.title ?? exam.title}</b>
        </div>
        <div className="attempt-progress">
          <span>
            {Object.keys(answers).length} of {questionCount} answered
          </span>
          <div>
            <i
              style={{
                width: `${Math.max(8, (Object.keys(answers).length / questionCount) * 100)}%`,
              }}
            ></i>
          </div>
        </div>
        <div className={`timer ${seconds < 300 ? "urgent" : ""}`} aria-live="off">
          <Icon name="clock" />
          <span>
            <small>TIME REMAINING</small>
            <strong>
              {mins} : {secs}
            </strong>
          </span>
        </div>
        <button className="submit-top" onClick={() => setModal("submit")}>
          Finish exam
        </button>
      </header>
      <div className="attempt-body">
        <aside className="question-nav">
          <span id="question-map-label">QUESTION MAP</span>
          <div className="number-map large" aria-labelledby="question-map-label">
            {Array.from({ length: questionCount }, (_, i) => (
              <button
                onClick={() => setCurrent(i)}
                aria-label={`Go to question ${i + 1}`}
                aria-current={current === i ? "step" : undefined}
                className={`${current === i ? "current" : ""} ${answers[i] !== undefined ? "done" : ""} ${review.includes(i) ? "review" : ""}`}
                key={i}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="map-legend">
            <span>
              <i className="done"></i>Answered
            </span>
            <span>
              <i></i>Unanswered
            </span>
            <span>
              <i className="review"></i>Review
            </span>
          </div>
          <div className="focus-note">
            <Icon name="shield" />
            <div>
              <b>Focus mode active</b>
              <p>Switching tabs shows a warning in this demo.</p>
            </div>
          </div>
        </aside>
        <main className="question-work">
          <div className="question-meta">
            <span>
              QUESTION {current + 1} OF {questionCount}
            </span>
            <em>{q.difficulty}</em>
          </div>
          {attemptError && <p className="form-error attempt-error" role="alert">{attemptError}</p>}
          <h1>{questionText}</h1>
          <p className="choose">Choose one answer.</p>
          <div className="option-list">
            {q.options.map((x, i) => (
              <button
                className={answers[current] === i ? "selected" : ""}
                aria-pressed={answers[current] === i}
                onClick={() => {
                  setAnswers({ ...answers, [current]: i });
                  persistAnswer(current, { selectedOption: i });
                }}
                key={x}
              >
                <b>{String.fromCharCode(65 + i)}</b>
                <span>{x}</span>
                <i>{answers[current] === i && <Icon name="check" />}</i>
              </button>
            ))}
          </div>
          <div className="confidence-panel">
            <span>How confident are you on this question?</span>
            <div className="confidence-options">
              {confidenceLevels.map((level) => (
                <button
                  key={`${level}-${confidenceKey}`}
                  className={currentConfidence === level ? "active" : ""}
                  onClick={() => {
                    demoSession.confidenceByQuestion[q.id] = level;
                    setConfidenceVersion((value) => value + 1);
                    persistAnswer(current, { confidence: level });
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="question-actions">
            <button
              className="review-btn"
              onClick={() => {
                const next = isSavedForRevision ? demoSession.savedQuestions : [...demoSession.savedQuestions, q.id];
                saveSavedQuestions(next);
                setRevisionPulse((value) => value + 1);
              }}
            >
              <Icon name="book" />
              {isSavedForRevision ? "Saved for revision" : "Save for revision"}
            </button>
            <button
              className={`review-btn ${review.includes(current) ? "active" : ""}`}
              onClick={toggleReview}
            >
              <Icon name="flag" />
              {review.includes(current) ? "Marked for review" : "Mark for review"}
            </button>
            <div>
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              >
                Previous
              </Button>
              <Button
                onClick={() =>
                  current === questionCount - 1 ? setModal("submit") : setCurrent((c) => c + 1)
                }
                icon="arrow"
              >
                {current === questionCount - 1 ? "Review & submit" : "Next question"}
              </Button>
            </div>
          </div>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-modal-title"
            aria-describedby="exam-modal-description"
          >
            <div className={`modal-icon ${modal}`}>
              <Icon
                name={modal === "warning" || modal === "expired" ? "shield" : "check"}
                size={28}
              />
            </div>
            <span>
              {modal === "warning"
                ? "FOCUS NOTICE"
                : modal === "expired"
                  ? "TIME EXPIRED"
                  : "READY TO FINISH?"}
            </span>
            <h2 id="exam-modal-title">
              {modal === "warning"
                ? "You left the examination tab."
                : modal === "expired"
                  ? "Your time has ended."
                  : "Submit your examination?"}
            </h2>
            <p id="exam-modal-description">
              {modal === "warning"
                ? serverAttempt
                  ? "Your tab change has been recorded for review under the examination policy."
                  : "This is a demonstration warning. In a real system, tab changes may be recorded according to exam rules."
                : modal === "expired"
                  ? `The time limit has ended. Your ${Object.keys(answers).length} answered questions are ready to submit.`
                  : `You answered ${Object.keys(answers).length} of ${questionCount} questions. You have ${questionCount - Object.keys(answers).length} unanswered and ${review.length} marked for review.`}
            </p>
            <div className="modal-actions">
              {modal !== "expired" && (
                <Button variant="secondary" onClick={() => setModal(null)}>
                  {modal === "warning" ? "Return to exam" : "Keep reviewing"}
                </Button>
              )}
              {modal === "submit" && (
                <Button onClick={submitAttempt} icon="arrow" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit now"}
                </Button>
              )}
              {modal === "expired" && (
                <Button onClick={submitAttempt} icon="arrow" disabled={submitting}>
                  {submitting ? "Submitting…" : serverAttempt ? "Submit answers" : "View result preview"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
