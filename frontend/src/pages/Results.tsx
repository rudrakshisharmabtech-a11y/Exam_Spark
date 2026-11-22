import { useEffect, useState } from "react";
import { exams, questions } from "../data";
import { demoSession } from "../state";
import { apiRequest } from "../api";
import { Button, Icon, navigate } from "../components/ui";
import { ExamRow } from "./Student";
import { PageTitle, Shell } from "../components/workspace";

export function Results() {
  const [tab, setTab] = useState("breakdown");
  const exam =
    demoSession.selectedExamDetails?.id === demoSession.selectedExamId
      ? demoSession.selectedExamDetails
      : exams.find((item) => item.id === demoSession.selectedExamId) ?? exams[0]!;
  type ServerResult = {
    attempt: {
      id: number;
      status: string;
      score: number;
      percentage: number;
      examTitle: string;
      totalMarks: number;
    };
    questions: Array<{
      id: number;
      topic: string;
      prompt: string;
      options: string[];
      correctOption: number;
      selectedOption: number | null;
      explanation: string | null;
      confidence: "sure" | "unsure" | "guessed" | null;
    }>;
    topicPerformance: Array<{ topic: string; percentage: number }>;
  };
  const [serverResult, setServerResult] = useState<ServerResult | null>(null);
  const [loading, setLoading] = useState(Boolean(demoSession.activeAttempt));
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const activeAttempt = demoSession.activeAttempt;
    if (!activeAttempt) return;
    apiRequest<ServerResult>(`/attempts/${activeAttempt.attemptId}/result`)
      .then(setServerResult)
      .catch((error: unknown) =>
        setServerError(error instanceof Error ? error.message : "The result could not be loaded."),
      )
      .finally(() => setLoading(false));
  }, []);

  const correct = serverResult
    ? serverResult.questions.filter((question) => question.selectedOption === question.correctOption).length
    : questions.filter((question, index) => demoSession.latestSubmission[index] === question.answer).length;
  const answered = serverResult
    ? serverResult.questions.filter((question) => question.selectedOption !== null).length
    : Object.keys(demoSession.latestSubmission).length;
  const incorrect = Math.max(0, answered - correct);
  const questionCount = serverResult?.questions.length ?? questions.length;
  const unanswered = questionCount - answered;
  const score = serverResult ? Number(serverResult.attempt.score) : (correct / questions.length) * exam.marks;
  const percentage = serverResult
    ? Number(serverResult.attempt.percentage)
    : Math.round((score / exam.marks) * 100);
  const confidenceCounts = serverResult
    ? {
        Sure: serverResult.questions.filter((question) => question.confidence === "sure").length,
        Unsure: serverResult.questions.filter((question) => question.confidence === "unsure").length,
        Guessed: serverResult.questions.filter((question) => question.confidence === "guessed").length,
      }
    : ["Sure", "Unsure", "Guessed"].reduce(
        (acc, level) => ({
          ...acc,
          [level]: Object.values(demoSession.confidenceByQuestion).filter((value) => value === level).length,
        }),
        { Sure: 0, Unsure: 0, Guessed: 0 },
      );
  const topicPerformance = serverResult
    ? serverResult.topicPerformance.map((item) => [item.topic, item.percentage] as const)
    : [...new Set(questions.map((question) => question.topic))].map(
    (topic) => {
      const topicQuestions = questions.filter((question) => question.topic === topic);
      const topicCorrect = topicQuestions.filter(
        (question) => demoSession.latestSubmission[questions.indexOf(question)] === question.answer,
      ).length;
      return [topic, Math.round((topicCorrect / topicQuestions.length) * 100)] as const;
    },
  );
  const reviewQuestions = serverResult
    ? serverResult.questions.map((question) => ({
        id: question.id,
        topic: question.topic,
        text: question.prompt,
        options: question.options,
        answer: question.correctOption,
        selected: question.selectedOption,
        explanation: question.explanation,
      }))
    : questions.map((question, index) => ({
        ...question,
        selected: demoSession.latestSubmission[index] ?? null,
      }));
  return (
    <Shell role="student" route="results">
      <PageTitle
        eyebrow="RESULT · DEMONSTRATION DATA"
        title={
          loading ? "Loading your result…" : serverResult ? "Your result is ready." : answered ? "Your demonstration result is ready." : "No submitted attempt in this session."
        }
        subtitle={serverResult?.attempt.examTitle ?? `${exam.title} · Demonstration data`}
      />
      {serverError && <p className="form-error" role="alert">{serverError}</p>}
      <section className="result-hero">
        <div className="grade-orbit">
          <div>
            <strong>{percentage}</strong>
            <span>%</span>
            <small>{serverResult ? "EXAM SCORE" : "DEMO SCORE"}</small>
          </div>
        </div>
        <div className="result-title">
          <span>YOUR RESULT</span>
          <h2>
            {score.toFixed(0)} <small>/ {serverResult?.attempt.totalMarks ?? exam.marks} marks</small>
          </h2>
          <p>
            {serverResult
              ? "This result was graded and saved by the examination server."
              : "This score is calculated in your browser from sample questions and is not an official result."}
          </p>
          <Button variant="dark" onClick={() => navigate("discover")} icon="arrow">
            Find another exam
          </Button>
        </div>
        <div className="result-stats">
          <div>
            <i className="correct"></i>
            <span>
              CORRECT<strong>{correct}</strong>
            </span>
          </div>
          <div>
            <i className="wrong"></i>
            <span>
              INCORRECT<strong>{incorrect}</strong>
            </span>
          </div>
          <div>
            <i className="empty"></i>
            <span>
              UNANSWERED<strong>{unanswered}</strong>
            </span>
          </div>
        </div>
      </section>
      <div className="result-tabs">
        <button className={tab === "breakdown" ? "active" : ""} onClick={() => setTab("breakdown")}>
          Performance breakdown
        </button>
        <button className={tab === "review" ? "active" : ""} onClick={() => setTab("review")}>
          Question review
        </button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
          Previous results
        </button>
      </div>
      {tab === "breakdown" && (
        <section className="panel confidence-summary-panel">
          <div className="panel-head">
            <div>
              <span>CONFIDENCE</span>
              <h2>Self-assessment summary</h2>
            </div>
          </div>
          <div className="confidence-summary-grid">
            {(["Sure", "Unsure", "Guessed"] as const).map((level) => (
              <div className="confidence-summary-card" key={level}>
                <span>{level}</span>
                <strong>{confidenceCounts[level]}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "breakdown" && (
        <div className="breakdown-grid">
          <section className="panel span-2">
            <div className="panel-head">
              <div>
                <span>BY TOPIC</span>
                <h2>Where your marks came from</h2>
              </div>
            </div>
            {topicPerformance.map(([x, n]) => (
              <div className="topic-bar" key={x}>
                <span>{x}</span>
                <div>
                  <i style={{ width: `${n}%` }}></i>
                </div>
                <b>{n}%</b>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <span>NEXT STEP</span>
                <h2>Focus area</h2>
              </div>
            </div>
            <div className="focus-topic">
              <Icon name="spark" />
              <b>Cell transport</b>
              <p>Review osmosis, tonicity, and active transport mechanisms.</p>
              <button onClick={() => setTab("review")}>
                Review answers <Icon name="arrow" size={15} />
              </button>
            </div>
          </section>
        </div>
      )}
      {tab === "review" && (
        <div className="review-list">
          {reviewQuestions.map((q, i) => (
            <article key={q.id}>
              <div className="review-number">{i + 1}</div>
              <div>
                <span
                  className={
                    q.selected === null
                      ? ""
                      : q.selected === q.answer
                        ? "correct-text"
                        : "wrong-text"
                  }
                >
                  {q.selected === null
                    ? "Unanswered"
                    : q.selected === q.answer
                      ? "Correct"
                      : "Incorrect"}{" "}
                  ? {q.topic}
                </span>
                <h3>{q.text}</h3>
                <p>
                  <b>Your answer:</b>{" "}
                  {q.selected === null
                    ? "Not answered"
                    : q.options[q.selected]}
                </p>
                <div className="explanation">
                  <Icon name="spark" />
                  <p>
                    <b>Explanation</b>
                    {q.explanation || "No explanation was provided for this question."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {tab === "history" && (
        <section className="panel">
          <div className="history-table">
            {exams
              .filter((x) => x.status === "Completed")
              .map((x) => (
                <ExamRow exam={x} key={x.id} />
              ))}
          </div>
        </section>
      )}
    </Shell>
  );
}
