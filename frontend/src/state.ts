import type { Exam } from "./data";

/** Ephemeral demo attempt state; it intentionally resets after a page refresh. */
export type ConfidenceLevel = "Sure" | "Unsure" | "Guessed";
export type ServerAttemptQuestion = {
  id: number;
  topic: string;
  difficulty: string;
  prompt: string;
  options: string[];
  selectedOption?: number | null;
  confidence?: "sure" | "unsure" | "guessed" | null;
  flaggedForReview?: boolean;
};
export type ServerAttempt = {
  attemptId: number;
  expiresAt: string;
  exam: { id: number; title: string; duration: number };
  questions: ServerAttemptQuestion[];
};

export const demoSession: {
  selectedExamId: number;
  selectedExamDetails: Exam | null;
  latestSubmission: Record<number, number>;
  confidenceByQuestion: Record<number, ConfidenceLevel>;
  savedQuestions: number[];
  reviewQuestionId: number | null;
  activeAttempt: ServerAttempt | null;
} = {
  selectedExamId: 1,
  selectedExamDetails: null,
  latestSubmission: {},
  confidenceByQuestion: {},
  savedQuestions: [],
  reviewQuestionId: null,
  activeAttempt: null,
};

export function getSavedQuestions(): number[] {
  if (typeof window === "undefined") return demoSession.savedQuestions;
  try {
    const raw = window.localStorage.getItem("examspark-revision-vault");
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    demoSession.savedQuestions = Array.isArray(parsed) ? parsed : [];
    return demoSession.savedQuestions;
  } catch {
    return demoSession.savedQuestions;
  }
}

export function saveSavedQuestions(ids: number[]) {
  demoSession.savedQuestions = [...new Set(ids)];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("examspark-revision-vault", JSON.stringify(demoSession.savedQuestions));
    } catch {
      // Ignore storage errors in demo mode.
    }
  }
}

