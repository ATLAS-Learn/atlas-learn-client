// Exam year options for A-level students
export const EXAM_YEARS = [
    2025,
    2026,
    2027,
    2028,
    2029,
] as const;

export type ExamYear = typeof EXAM_YEARS[number];

