import { storage } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";
import { QuizSubmission } from "@/lib/types";

export type PendingQuizSubmission = {
  id: string;
  quizId: string;
  submission: QuizSubmission;
  attempts: number;
  createdAt: number;
};

export type PendingLessonCompletion = {
  id: string;
  subjectId: string;
  chapterId: string;
  lessonId: string;
  attempts: number;
  createdAt: number;
};

export type PendingFeedback = {
  id: string;
  data: { category: string; subject: string; message: string; rating?: number };
  attempts: number;
  createdAt: number;
};

export type PendingSubjectSelection = {
  id: string;
  subjectIds: string[];
  attempts: number;
  createdAt: number;
};

const QUEUE_KEY = "pending-quiz-syncs";
const LESSON_QUEUE_KEY = "pending-lesson-syncs";
const FEEDBACK_QUEUE_KEY = "pending-feedback-syncs";
const SUBJECT_SELECTION_QUEUE_KEY = "pending-subject-selection-syncs";

const MAX_ATTEMPTS = 5;

// ── Generic queue helpers ──

async function readJsonQueue<T>(key: string): Promise<T[]> {
  const raw = await storage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    await storage.removeItem(key);
    return [];
  }
}

async function writeJsonQueue<T>(key: string, queue: T[]) {
  await storage.setItem(key, JSON.stringify(queue));
}

// ── Quiz submission queue ──

export async function enqueueQuizSubmission(quizId: string, submission: QuizSubmission) {
  const queue = await readJsonQueue<PendingQuizSubmission>(QUEUE_KEY);
  queue.push({
    id: `${quizId}:${Date.now()}`,
    quizId,
    submission,
    attempts: 0,
    createdAt: Date.now(),
  });
  await writeJsonQueue(QUEUE_KEY, queue);
}

export async function processQuizQueue() {
  const queue = await readJsonQueue<PendingQuizSubmission>(QUEUE_KEY);
  if (queue.length === 0) return;

  const remaining: PendingQuizSubmission[] = [];
  for (const item of queue) {
    try {
      await apiClient.submitQuiz(item.quizId, item.submission);
    } catch {
      const attempts = item.attempts + 1;
      if (attempts < MAX_ATTEMPTS) remaining.push({ ...item, attempts });
    }
  }

  if (remaining.length > 0) {
    await writeJsonQueue(QUEUE_KEY, remaining);
  } else {
    await storage.removeItem(QUEUE_KEY);
  }
}

export async function clearQuizQueue() {
  await storage.removeItem(QUEUE_KEY);
}

// ── Lesson completion queue ──

export async function enqueueLessonCompletion(
  subjectId: string,
  chapterId: string,
  lessonId: string
) {
  const queue = await readJsonQueue<PendingLessonCompletion>(LESSON_QUEUE_KEY);
  queue.push({
    id: `${lessonId}:${Date.now()}`,
    subjectId,
    chapterId,
    lessonId,
    attempts: 0,
    createdAt: Date.now(),
  });
  await writeJsonQueue(LESSON_QUEUE_KEY, queue);
}

export async function processLessonQueue() {
  const queue = await readJsonQueue<PendingLessonCompletion>(LESSON_QUEUE_KEY);
  if (queue.length === 0) return;

  const remaining: PendingLessonCompletion[] = [];
  for (const item of queue) {
    try {
      await apiClient.completeSubjectChapterLesson(
        item.subjectId,
        item.chapterId,
        item.lessonId
      );
    } catch {
      const attempts = item.attempts + 1;
      if (attempts < MAX_ATTEMPTS) remaining.push({ ...item, attempts });
    }
  }

  if (remaining.length > 0) {
    await writeJsonQueue(LESSON_QUEUE_KEY, remaining);
  } else {
    await storage.removeItem(LESSON_QUEUE_KEY);
  }
}

export async function clearLessonQueue() {
  await storage.removeItem(LESSON_QUEUE_KEY);
}

// ── Feedback queue ──

export async function enqueueFeedback(data: { category: string; subject: string; message: string; rating?: number }) {
  const queue = await readJsonQueue<PendingFeedback>(FEEDBACK_QUEUE_KEY);
  queue.push({
    id: `feedback:${Date.now()}`,
    data,
    attempts: 0,
    createdAt: Date.now(),
  });
  await writeJsonQueue(FEEDBACK_QUEUE_KEY, queue);
}

export async function processFeedbackQueue() {
  const queue = await readJsonQueue<PendingFeedback>(FEEDBACK_QUEUE_KEY);
  if (queue.length === 0) return;

  const remaining: PendingFeedback[] = [];
  for (const item of queue) {
    try {
      await apiClient.submitFeedback(item.data);
    } catch {
      const attempts = item.attempts + 1;
      if (attempts < MAX_ATTEMPTS) remaining.push({ ...item, attempts });
    }
  }

  if (remaining.length > 0) {
    await writeJsonQueue(FEEDBACK_QUEUE_KEY, remaining);
  } else {
    await storage.removeItem(FEEDBACK_QUEUE_KEY);
  }
}

export async function clearFeedbackQueue() {
  await storage.removeItem(FEEDBACK_QUEUE_KEY);
}

// ── Preferred subjects queue ──

export async function enqueueSubjectSelection(subjectIds: string[]) {
  const queue = await readJsonQueue<PendingSubjectSelection>(SUBJECT_SELECTION_QUEUE_KEY);
  queue.push({
    id: `subjects:${Date.now()}`,
    subjectIds,
    attempts: 0,
    createdAt: Date.now(),
  });
  await writeJsonQueue(SUBJECT_SELECTION_QUEUE_KEY, queue);
}

export async function processSubjectSelectionQueue() {
  const queue = await readJsonQueue<PendingSubjectSelection>(SUBJECT_SELECTION_QUEUE_KEY);
  if (queue.length === 0) return;

  // Only keep the most recent selection (server wins, discard stale ones)
  const latest = queue[queue.length - 1];
  const remaining: PendingSubjectSelection[] = [];

  try {
    await apiClient.updatePreferredSubjects(latest.subjectIds);
  } catch {
    const attempts = latest.attempts + 1;
    if (attempts < MAX_ATTEMPTS) remaining.push({ ...latest, attempts });
  }

  if (remaining.length > 0) {
    await writeJsonQueue(SUBJECT_SELECTION_QUEUE_KEY, remaining);
  } else {
    await storage.removeItem(SUBJECT_SELECTION_QUEUE_KEY);
  }
}

export async function clearSubjectSelectionQueue() {
  await storage.removeItem(SUBJECT_SELECTION_QUEUE_KEY);
}
