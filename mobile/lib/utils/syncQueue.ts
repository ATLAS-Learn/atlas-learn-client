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

const QUEUE_KEY = "pending-quiz-syncs";

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
