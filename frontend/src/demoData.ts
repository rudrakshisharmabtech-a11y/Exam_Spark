import { exams, questions, type Exam } from "./data";

export type DemoQuestion = {
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

const examsStorageKey = "examspark-demo-exams";
const questionsStorageKey = "examspark-demo-questions";

function isDemoExam(value: unknown): value is Exam {
  if (!value || typeof value !== "object") return false;
  const exam = value as Record<string, unknown>;
  return (
    typeof exam.id === "number" &&
    typeof exam.title === "string" &&
    typeof exam.code === "string" &&
    typeof exam.subject === "string" &&
    typeof exam.duration === "number" &&
    typeof exam.questions === "number" &&
    typeof exam.marks === "number" &&
    typeof exam.date === "string" &&
    ["Live", "Upcoming", "Completed", "Draft"].includes(String(exam.status)) &&
    typeof exam.accent === "string"
  );
}

function isDemoQuestion(value: unknown): value is DemoQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Record<string, unknown>;
  return (
    typeof question.id === "number" &&
    typeof question.examId === "number" &&
    typeof question.topic === "string" &&
    ["easy", "moderate", "difficult"].includes(String(question.difficulty)) &&
    typeof question.prompt === "string" &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === "string") &&
    typeof question.correctOption === "number" &&
    (typeof question.explanation === "string" || question.explanation === null) &&
    typeof question.points === "number"
  );
}

function saveExams(records: Exam[]) {
  window.localStorage.setItem(examsStorageKey, JSON.stringify(records));
}

export function getDemoExams(): Exam[] {
  const saved = window.localStorage.getItem(examsStorageKey);
  if (!saved) return [...exams];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every(isDemoExam)) {
    throw new Error("Saved demo examination data is invalid. Clear this browser's demo data and reload.");
  }
  return parsed;
}

export function addDemoExam(input: {
  title: string;
  subject: string;
  code: string;
  duration: number;
  marks: number;
  startsAt: string;
}) {
  const records = getDemoExams();
  const exam: Exam = {
    id: Math.max(0, ...records.map((record) => record.id)) + 1,
    title: input.title,
    code: input.code,
    subject: input.subject,
    duration: input.duration,
    questions: 0,
    marks: input.marks,
    date: input.startsAt ? new Date(input.startsAt).toLocaleString() : "Not scheduled",
    status: "Draft",
    accent: exams.find((record) => record.subject === input.subject)?.accent ?? "var(--violet)",
  };
  saveExams([...records, exam]);
  return exam;
}

export function updateDemoExamStatus(id: number, status: "Live" | "Completed" | "Draft") {
  const records = getDemoExams().map((exam) => (exam.id === id ? { ...exam, status } : exam));
  saveExams(records);
  return records;
}

function seedDemoQuestions(): DemoQuestion[] {
  const examIds = [1, 2, 3, 6, 4];
  const seeded = questions.map((question, index) => ({
    id: question.id,
    examId: examIds[index] ?? 1,
    topic: question.topic,
    difficulty:
      question.difficulty === "Easy"
        ? "easy" as const
        : question.difficulty === "Hard"
          ? "difficult" as const
          : "moderate" as const,
    prompt: question.text,
    options: question.options,
    correctOption: question.answer,
    explanation: question.explanation,
    points: 1,
  }));
  seeded.push(
    {
      id: 6,
      examId: 5,
      topic: "HTTP status codes",
      difficulty: "easy",
      prompt: "Which HTTP status code normally indicates a successful request?",
      options: ["200", "301", "404", "500"],
      correctOption: 0,
      explanation: "A 200 status code indicates that the request succeeded.",
      points: 1,
    },
    {
      id: 7,
      examId: 7,
      topic: "Binary representation",
      difficulty: "moderate",
      prompt: "How is a negative integer commonly represented in a computer system?",
      options: ["Two's complement", "Gray code only", "ASCII", "BCD only"],
      correctOption: 0,
      explanation: "Most modern systems use two's complement for signed integer representation.",
      points: 1,
    },
  );
  return seeded;
}

function saveQuestions(records: DemoQuestion[]) {
  window.localStorage.setItem(questionsStorageKey, JSON.stringify(records));
}

export function getDemoQuestionBank(examId: number): DemoQuestion[] {
  const saved = window.localStorage.getItem(questionsStorageKey);
  let records: DemoQuestion[];
  if (!saved) {
    records = seedDemoQuestions();
    saveQuestions(records);
  } else {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isDemoQuestion)) {
      throw new Error("Saved demo question data is invalid. Clear this browser's demo data and reload.");
    }
    records = parsed;
  }
  return records.filter((question) => question.examId === examId);
}

export function addDemoQuestions(examId: number, inputs: Omit<DemoQuestion, "id" | "examId">[]) {
  const allQuestions = getDemoQuestionBankRecords();
  const added = inputs.map((input, index) => ({
    ...input,
    id: Math.max(0, ...allQuestions.map((question) => question.id)) + index + 1,
    examId,
  }));
  const nextQuestions = [...allQuestions, ...added];
  saveQuestions(nextQuestions);
  const records = getDemoExams().map((exam) =>
    exam.id === examId
      ? { ...exam, questions: nextQuestions.filter((question) => question.examId === examId).length }
      : exam,
  );
  saveExams(records);
  return added;
}

function getDemoQuestionBankRecords(): DemoQuestion[] {
  const saved = window.localStorage.getItem(questionsStorageKey);
  if (!saved) {
    const seeded = seedDemoQuestions();
    saveQuestions(seeded);
    return seeded;
  }
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every(isDemoQuestion)) {
    throw new Error("Saved demo question data is invalid. Clear this browser's demo data and reload.");
  }
  return parsed;
}

export function getDemoAttemptQuestions(examId: number) {
  return getDemoQuestionBank(examId).map((question) => ({
    id: question.id,
    topic: question.topic,
    difficulty: question.difficulty,
    text: question.prompt,
    options: question.options,
    answer: question.correctOption,
    explanation: question.explanation,
  }));
}
