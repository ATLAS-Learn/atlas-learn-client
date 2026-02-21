// User and Authentication Types
export enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
}

export type RoleUpgradeStatus = "pending" | "approved" | "rejected";

export interface RoleUpgradeRequestPayload {
    reason: string;
    school: string;
}

export interface RoleUpgradeRequestResponse {
    success: boolean;
    message: string;
    requestId: string;
}

export interface RoleUpgradeDecisionResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export interface PendingRoleUpgradeRequest {
    id: string;
    userId: string;
    reason: string;
    school: string;
    status: RoleUpgradeStatus;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
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
    username?: string;
    role: UserRole;
    roleUpgradeStatus?: RoleUpgradeStatus;
    image?: string;
    bio?: string;
    school?: string;
    examYear?: number;
    level?: Level;
    createdAt: string;
}

export interface UpdateProfilePayload {
    name?: string;
    username?: string;
    image?: string;
    bio?: string;
    school?: string;
    examYear?: number;
}

export interface AuthResponse {
    token?: string | null;
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

export interface AssessmentAdminQuestion {
    id: string;
    questionText: string;
    options: string[];
    orderIndex: number;
}

export interface AssessmentAdminItem {
    id: string;
    title: string;
    description: string;
    questionCount: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    questions?: AssessmentAdminQuestion[];
}

export interface CreateAssessmentPayload {
    title: string;
    description: string;
}

export interface UpdateAssessmentPayload {
    title?: string;
    description?: string;
}

export interface CreateAssessmentQuestionPayload {
    questionText: string;
    options: string[];
    orderIndex: number;
}

export interface UpdateAssessmentQuestionPayload {
    questionText?: string;
    options?: string[];
    orderIndex?: number;
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

// Subject Types
export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    chapters?: Record<string, unknown>[];
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface SubjectQueryOptions {
    includeChapters?: boolean;
    includeChapterDetails?: boolean;
}

export interface CreateSubjectPayload {
    name: string;
    code: string;
    description?: string;
    [key: string]: unknown;
}

export interface UpdateSubjectPayload {
    name?: string;
    code?: string;
    description?: string;
    [key: string]: unknown;
}

export interface SubjectChapter {
    id: string;
    title: string;
    description?: string;
    orderIndex?: number;
    unlockThreshold?: number;
    estimatedMinutes?: number;
    pdfUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface CreateSubjectChapterPayload {
    title: string;
    description?: string;
    orderIndex?: number;
    unlockThreshold?: number;
    estimatedMinutes?: number;
    pdfUrl?: string;
    [key: string]: unknown;
}

export interface UpdateSubjectChapterPayload {
    title?: string;
    description?: string;
    orderIndex?: number;
    unlockThreshold?: number;
    estimatedMinutes?: number;
    pdfUrl?: string;
    [key: string]: unknown;
}

export interface SubjectStats {
    subjectId?: string;
    chaptersCount?: number;
    lessonsCount?: number;
    quizzesCount?: number;
    [key: string]: unknown;
}

export interface SubjectChapterProgress {
    subjectId?: string;
    chapterId?: string;
    completed?: boolean;
    unlocked?: boolean;
    completionPercentage?: number;
    [key: string]: unknown;
}

export interface SubjectChapterUnlockResponse {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface SubjectExamHint {
    id: string;
    title?: string;
    hint?: string;
    description?: string;
    [key: string]: unknown;
}

export interface ChapterPdfMaterial {
    url?: string;
    title?: string;
    [key: string]: unknown;
}

export interface ChapterLesson {
    id: string;
    title?: string;
    content?: string;
    orderIndex?: number;
    [key: string]: unknown;
}

export interface Lesson {
    id: string;
    title?: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
    videoUrl?: string;
    durationSeconds?: number;
    pdfUrl?: string;
    examples?: unknown;
    keyPoints?: unknown;
    chapterId?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface CreateLessonPayload {
    title: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
    videoUrl?: string;
    durationSeconds?: number;
    pdfUrl?: string;
    examples?: unknown;
    keyPoints?: unknown;
    [key: string]: unknown;
}

export interface UpdateLessonPayload {
    title?: string;
    content?: string;
    orderIndex?: number;
    estimatedMinutes?: number;
    videoUrl?: string;
    durationSeconds?: number;
    pdfUrl?: string;
    examples?: unknown;
    keyPoints?: unknown;
    [key: string]: unknown;
}

export interface LessonProgressUpdatePayload {
    watchTimeSeconds?: number;
    positionSeconds?: number;
    progressPercent?: number;
    [key: string]: unknown;
}

export interface LessonCompletionResponse {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface LessonPdfMaterial {
    url?: string;
    title?: string;
    [key: string]: unknown;
}

export interface ChapterProgressData {
    chapterId?: string;
    completed?: boolean;
    unlocked?: boolean;
    completionPercentage?: number;
    [key: string]: unknown;
}

export interface ChapterUnlockResponse {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface ChapterExamHint {
    id: string;
    title?: string;
    hint?: string;
    description?: string;
    [key: string]: unknown;
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
    subjectId?: string;
    estimatedTime: number; // in minutes
}

export interface ExternalLink {
    id: string;
    title: string;
    url: string;
    type: "video" | "document" | "article" | "other";
}

export interface ChapterSection {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    externalLinks?: ExternalLink[];
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
    completedLessons: string[]; // Array of lesson (section) IDs
    completedQuizzes: string[]; // Array of quiz IDs
    overallProgress: number; // percentage
    streak: number;
    lastActiveDate: string;
    lastLessonByChapter?: Record<string, string>;
}

export interface OverallProgressSummary {
    completionPercentage: number;
    chapters: {
        total: number;
        completed: number;
    };
    lessons: {
        total: number;
        completed: number;
        percentage: number;
    };
    quizzes: {
        total: number;
        passed: number;
        percentage: number;
    };
    totalTimeSpent: number;
}

export interface SubjectProgress {
    subjectId: string;
    name: string;
    code: string;
    completionPercentage: number;
    chapters: Record<string, unknown>;
    lessons: Record<string, unknown>;
    quizzes: Record<string, unknown>;
    chapterDetails: Record<string, unknown>[];
}

export interface OverallProgressData {
    userId: string;
    level: Level;
    assessmentScore: number;
    overall: OverallProgressSummary;
    subjects: SubjectProgress[];
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
    lessonSummary?: {
        totalLessons: number;
        totalCompleted: number;
        averageCompletionPercent: number;
        averageTimeSpent: number;
    };
}

export interface TeacherStudentsQueryParams {
    search?: string;
    school?: string;
    level?: Level;
    limit?: number;
    offset?: number;
}

export interface TeacherStudentApiItem {
    id: string;
    email: string;
    name: string;
    level: Level;
    school?: string;
    examYear?: number;
    createdAt: string;
    lastLoginAt?: string;
    _count?: {
        progress?: number;
        quizAttempts?: number;
        LessonProgress?: number;
    };
}

export interface TeacherStudentsListResponse {
    success: boolean;
    count: number;
    total: number;
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    data: TeacherStudentApiItem[];
}

export interface TeacherStudentProgressData {
    student: {
        id: string;
        email: string;
        name: string;
        level: Level | string;
        school?: string;
        examYear?: number;
    };
    level: Level | string;
    assessmentScore?: number;
    assessmentCompletedAt?: string;
    overall: OverallProgressSummary;
    subjects: Record<string, unknown>[];
}

export interface TeacherStudentProgressResponse {
    success: boolean;
    data: TeacherStudentProgressData;
}

export interface TeacherStudentQuizAttemptApiItem {
    attemptId: string;
    score: number;
    passed: boolean;
    timeSpent?: number;
    completedAt: string;
    quiz: {
        id: string;
        title: string;
        totalQuestions: number;
    };
    chapter?: {
        id: string;
        title: string;
    };
    subject?: {
        id: string;
        name: string;
        code: string;
    };
}

export interface TeacherStudentQuizAttemptsResponse {
    success: boolean;
    student: {
        id: string;
        name: string;
        email: string;
    };
    count: number;
    total: number;
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    data: TeacherStudentQuizAttemptApiItem[];
}
