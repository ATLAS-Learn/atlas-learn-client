// User and Authentication Types
export enum UserRole {
    STUDENT = "student",
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
    emailVerified?: boolean;
    image?: string;
    bio?: string;
    school?: string;
    examYear?: number;
    level?: Level;
    preferredSubjects?: string[];
    createdAt: string;
    updatedAt?: string;
    lastLoginAt?: string;
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
    session?: { token?: string; id?: string; expiresAt?: string };
}

// Assessment Types
export interface AssessmentQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    topic: string;
    subjectId?: string;
    subjectName?: string;
}

export interface AssessmentSubmission {
    answers: { questionId: string; answerIndex: number }[];
}

export interface AssessmentResult {
    score: number;
    totalQuestions: number;
    level: Level;
    message: string;
    subjectBreakdown?: SubjectBreakdown[];
    recommendedChapter?: { id: string; title: string; subjectName?: string } | null;
    perSubjectRecommendations?: PerSubjectRecommendation[];
    corrections?: AssessmentCorrection[];
    unlockedChapters?: { subjectId: string; subjectName: string; chapterId: string; chapterTitle: string }[];
}

export interface AssessmentCorrection {
    questionIndex: number;
    questionText: string;
    options: string[];
    userAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string | null;
    subjectName: string;
    points: number;
}

export interface PerSubjectRecommendation {
    subjectId: string;
    subjectName: string;
    score: number;
    recommendedChapter: { id: string; title: string } | null;
    unlockedChapterIds: string[];
}

export interface SubjectBreakdown {
    subjectId: string;
    subjectName: string;
    correct: number;
    total: number;
    score: number;
}

export interface LearningPath {
    overallLevel: string;
    assessmentScore: number | null;
    perSubject: LearningPathSubject[];
    studyPlan: string;
}

export interface LearningPathSubject {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalChapters: number;
    completedChapters: number;
    remainingChapters: number;
    completionPercentage: number;
    startChapter: { id: string; title: string } | null;
    currentChapter: { id: string; title: string } | null;
    nextRecommended: { id: string; title: string } | null;
    weakAreas: { chapterId: string; chapterTitle: string; score: number }[];
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

export interface SubjectChaptersQueryOptions {
    includeDetails?: boolean;
    includeProgress?: boolean;
}

export interface SubjectChapterQueryOptions {
    includeSubject?: boolean;
    includeLessons?: boolean;
    includeQuizzes?: boolean;
    includeProgress?: boolean;
    includeExamHints?: boolean;
}

export interface SubjectChapterQuizzesQueryOptions {
    includeQuestions?: boolean;
    includeAttempts?: boolean;
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
    subjectName?: string;
    totalChapters?: number;
    totalLessons?: number;
    totalQuizzes?: number;
    totalExamHints?: number;
    estimatedMinutes?: number;
    // Backward compatibility aliases
    chaptersCount?: number;
    lessonsCount?: number;
    quizzesCount?: number;
    [key: string]: unknown;
}

export interface SubjectChapterProgress {
    id?: string;
    subjectId?: string;
    chapterId?: string;
    isCompleted?: boolean;
    isUnlocked?: boolean;
    bestScore?: number;
    currentScore?: number;
    attemptsCount?: number;
    timeSpent?: number;
    lastAttemptedAt?: string;
    // Backward compatibility aliases
    completed?: boolean;
    unlocked?: boolean;
    completionPercentage?: number;
    [key: string]: unknown;
}

export interface SubjectChapterUnlockResponse {
    success?: boolean;
    message?: string;
    data?: {
        id?: string;
        isUnlocked?: boolean;
        userId?: string;
        chapterId?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface SubjectExamHint {
    id: string;
    chapterId: string;
    paperCode: string;
    paperName: string;
    questionRef?: string;
    description?: string;
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
    title: string;
    content?: string;
    orderIndex: number;
    videoUrl?: string;
    durationMinutes: number;
    isFree: boolean;
    requiredScoreToUnlock: number;
    pdfUrl?: string;
    externalLinks?: ExternalLink[];
    examples?: unknown;
    keyPoints?: string[];
    chapterId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateLessonPayload {
    title: string;
    content?: string;
    orderIndex?: number;
    videoUrl?: string;
    durationMinutes?: number;
    isFree?: boolean;
    requiredScoreToUnlock?: number;
    pdfUrl?: string;
    externalLinks?: ExternalLink[];
    examples?: unknown;
    keyPoints?: string[];
}

export interface UpdateLessonPayload {
    title?: string;
    content?: string;
    orderIndex?: number;
    videoUrl?: string;
    durationMinutes?: number;
    isFree?: boolean;
    requiredScoreToUnlock?: number;
    pdfUrl?: string;
    externalLinks?: ExternalLink[];
    examples?: unknown;
    keyPoints?: string[];
}

export interface LessonProgressUpdatePayload {
    timeSpent: number;
    isCompleted?: boolean;
}

export interface LessonProgressEntry {
    id: string;
    userId: string;
    lessonId: string;
    isCompleted: boolean;
    timeSpent: number;
    lastAccessedAt?: string;
}

export interface LessonWithProgress extends Lesson {
    LessonProgress?: LessonProgressEntry[];
    isCompleted?: boolean;
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
    chapterId: string;
    paperCode: string;
    paperName: string;
    questionRef?: string;
    description?: string;
}

// Chapter and Content Types
export interface Chapter {
    id: string;
    title: string;
    description?: string;
    orderIndex: number;
    unlockThreshold: number;
    estimatedMinutes: number;
    pdfUrl?: string;
    externalLinks?: ExternalLink[];
    subjectId: string;
}

export interface ExternalLink {
    id?: string;
    title: string;
    url: string;
    type: string;
    description?: string;
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
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
    points: number;
    quizId: string;
    questionType?: "MCQ" | "STRUCTURAL";
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    isSkipQuiz: boolean;
    timeLimit?: number;
    chapterId: string;
    questions?: QuizQuestion[];
}

export interface QuizSubmission {
    answers: (number | string)[];
    timeSpent?: number;
}

export interface QuizResult {
    attemptId: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    earnedPoints: number;
    totalPoints: number;
    passed: boolean;
    hasStructural?: boolean;
    isCorrected?: boolean;
    unlockedNextChapter: {
        id: string;
        title: string;
        description?: string;
        orderIndex: number;
        estimatedMinutes: number;
        lessonCount: number;
        quizCount: number;
        firstLesson?: {
            id: string;
            title: string;
            isFree: boolean;
        };
    } | null;
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

export interface StreakData {
    streak: number;
    lastActiveDate: string | null;
}

export interface ChapterProgress {
    chapterId: string;
    completed: boolean;
    quizAttempts: QuizAttempt[];
    bestScore?: number;
}

export interface QuizAttempt {
    id: string;
    score: number;
    answers: number[];
    timeSpent?: number;
    completedAt: string;
    userId: string;
    quizId: string;
    quiz?: {
        id: string;
        title: string;
        chapterId: string;
        chapter?: {
            unlockThreshold: number;
            subjectId: string;
            subject?: {
                name: string;
                code: string;
            };
        };
    };
    // Computed fields (not from backend, calculated by frontend)
    percentage?: number;
    passed?: boolean;
}

export interface QuizStats {
    quiz: {
        id: string;
        title: string;
        description?: string;
    };
    stats: {
        totalAttempts: number;
        totalQuestions: number;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        averageTimeSpent: number;
        passRate: number;
    };
}

// Dashboard Types
export interface DashboardData {
    user: User;
    progress: Progress;
    currentChapter: Chapter;
    nextChapter?: Chapter;
    isNextChapterLocked: boolean;
}

export interface Feedback {
    id: string;
    userId: string;
    category: "bug" | "feature_request" | "general" | "complaint" | "suggestion";
    subject: string;
    message: string;
    rating: number | null;
    status: "pending" | "reviewed" | "resolved";
    adminReply: string | null;
    createdAt: string;
    updatedAt: string;
}
