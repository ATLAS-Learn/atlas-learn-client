const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

// MMKV disk cache TTLs — how long data persists on disk
export const DISK_TTL = {
  STATIC: DAY * 30,    // subjects, chapters, lessons, quizzes
  DYNAMIC: DAY * 1,    // progress, streak, quiz attempts, learning path
  LEADERBOARD: MINUTE * 15,
} as const;

// React Query in-memory stale times — how long before refetch is allowed
export const STALE_TIME = {
  STATIC: DAY * 30,    // never refetch unless pull-to-refresh
  DYNAMIC: MINUTE * 30, // progress, streak
  QUIZ_ATTEMPTS: MINUTE * 15,
  LEADERBOARD: MINUTE * 5,
} as const;
