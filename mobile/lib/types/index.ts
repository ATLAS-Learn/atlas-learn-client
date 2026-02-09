// User and Authentication Types
export enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
}

export enum Level {
    FOUNDATIONAL = "beginner",
    CORE = "intermediate",
    ADVANCED = "advanced",
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    school?: string;
    examYear?: number;
    level?: Level;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// Assessment Types
export interface AssessmentQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    topic: string;
}

export interface AssessmentSubmission {
    answers: { questionId: string; answerIndex: number }[];
}

export interface AssessmentResult {
    score: number;
    totalQuestions: number;
    level: Level;
    message: string;
}

// Chapter and Content Types
export interface Chapter {
    id: string;
    title: string;
    description: string;
    level: Level;
    order: number;
    content: ChapterSection[];
    subject: string;
    estimatedTime: number; // in minutes
}

export interface ChapterSection {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    order: number;
}

// Quiz Types
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface Quiz {
    id: string;
    chapterId: string;
    questions: QuizQuestion[];
    passingScore: number; // percentage, e.g., 80
}

export interface QuizSubmission {
    answers: { questionId: string; answerIndex: number }[];
}

export interface QuizResult {
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    pastPaperReference?: string; // e.g., "9708/12, Q3"
    unlockedNextChapter: boolean;
}

// Progress Types
export interface Progress {
    userId: string;
    currentChapterId: string;
    completedChapters: string[];
    overallProgress: number; // percentage
    streak: number;
    lastActiveDate: string;
}

export interface ChapterProgress {
    chapterId: string;
    completed: boolean;
    quizAttempts: QuizAttempt[];
    bestScore?: number;
}

export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
    answers?: { questionId: string; answerIndex: number }[];
}

export interface QuizStats {
    quizId: string;
    totalAttempts: number;
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    totalUsers: number;
    attempts: QuizAttempt[];
}

// Dashboard Types
export interface DashboardData {
    user: User;
    progress: Progress;
    currentChapter: Chapter;
    nextChapter?: Chapter;
    isNextChapterLocked: boolean;
}

// Teacher Dashboard Types
export enum StudentStatus {
    ON_TRACK = "on_track",    // Green: Actively completing chapters
    BEHIND = "behind",         // Yellow: Started but progress has stalled
    AT_RISK = "at_risk",       // Red: Failed quiz multiple times or hasn't logged in
}

export interface StudentListItem {
    id: string;
    name: string;
    email: string;
    status: StudentStatus;
    currentChapterId?: string;
    currentChapterTitle?: string;
    overallProgress: number;
    lastActiveDate: string;
}

export interface StudentDetail extends StudentListItem {
    level?: Level;
    streak: number;
    completedChapters: string[];
    chapterProgress: ChapterProgress[];
    quizAttempts: QuizAttempt[];
}

export interface TeacherDashboardData {
    students: StudentListItem[];
    totalStudents: number;
    onTrackCount: number;
    behindCount: number;
    atRiskCount: number;
}
