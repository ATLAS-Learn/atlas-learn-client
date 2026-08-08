import { storage } from "@/lib/utils/storage";
import { apiClient } from "@/lib/api";
import { QuizSubmission } from "@/lib/types";

export type PendingQuizSubmission = {
  id: string; // local id
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

const QUEUE_KEY = "pending-quiz-syncs";
const LESSON_QUEUE_KEY = "pending-lesson-syncs";

async function readQueue(): Promise<PendingQuizSubmission[]> {
  const raw = await storage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingQuizSubmission[];
  } catch {
    await storage.removeItem(QUEUE_KEY);
    return [];
  }
}

async function writeQueue(queue: PendingQuizSubmission[]) {
  await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueQuizSubmission(quizId: string, submission: QuizSubmission) {
  const queue = await readQueue();
  const entry: PendingQuizSubmission = {
    id: `${quizId}:${Date.now()}`,
    quizId,
    submission,
    attempts: 0,
    createdAt: Date.now(),
  };
  queue.push(entry);
  await writeQueue(queue);
}

// Process queue with up to 5 retries and exponential backoff
export async function processQuizQueue() {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining: PendingQuizSubmission[] = [];

  for (const item of queue) {
    try {
      await apiClient.submitQuiz(item.quizId, item.submission);
      // success -> do nothing (item removed)
    } catch (err) {
      const attempts = item.attempts + 1;
      if (attempts >= 5) {
        console.warn(`Giving up on queued quiz submission ${item.id} after ${attempts} attempts`);
        // drop it
      } else {
        remaining.push({ ...item, attempts });
      }
    }
  }

  if (remaining.length > 0) {
    await writeQueue(remaining);
  } else {
    await storage.removeItem(QUEUE_KEY);
  }
}

export async function clearQuizQueue() {
  await storage.removeItem(QUEUE_KEY);
}

// Lesson completion queue
async function readLessonQueue(): Promise<PendingLessonCompletion[]> {
  const raw = await storage.getItem(LESSON_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingLessonCompletion[];
  } catch {
    await storage.removeItem(LESSON_QUEUE_KEY);
    return [];
  }
}

async function writeLessonQueue(queue: PendingLessonCompletion[]) {
  await storage.setItem(LESSON_QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueLessonCompletion(
  subjectId: string,
  chapterId: string,
  lessonId: string
) {
  const queue = await readLessonQueue();
  const entry: PendingLessonCompletion = {
    id: `${lessonId}:${Date.now()}`,
    subjectId,
    chapterId,
    lessonId,
    attempts: 0,
    createdAt: Date.now(),
  };
  queue.push(entry);
  await writeLessonQueue(queue);
}

export async function processLessonQueue() {
  const queue = await readLessonQueue();
  if (queue.length === 0) return;

  const remaining: PendingLessonCompletion[] = [];

  for (const item of queue) {
    try {
      await apiClient.completeSubjectChapterLesson(
        item.subjectId,
        item.chapterId,
        item.lessonId
      );
    } catch (err) {
      const attempts = item.attempts + 1;
      if (attempts >= 5) {
        console.warn(`Giving up on queued lesson completion ${item.id} after ${attempts} attempts`);
      } else {
        remaining.push({ ...item, attempts });
      }
    }
  }

  if (remaining.length > 0) {
    await writeLessonQueue(remaining);
  } else {
    await storage.removeItem(LESSON_QUEUE_KEY);
  }
}

export async function clearLessonQueue() {
  await storage.removeItem(LESSON_QUEUE_KEY);
}
