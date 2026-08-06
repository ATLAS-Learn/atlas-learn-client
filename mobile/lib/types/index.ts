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
    requestId: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        school?: string;
    };
    details: {
        requestedRole: string;
        reason?: string;
        school?: string;
    };
    requestedAt: string;
    expiresAt: string;
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

export interface SubjectChapterLessonsQueryOptions {
    includeProgress?: boolean;
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
    orderIndex?: number;
    isFree?: boolean;
    estimatedMinutes?: number;
    videoUrl?: string;
    durationMinutes: number;
    requiredScoreToUnlock: number;
    pdfUrl?: string;
    externalLinks?: ExternalLink[];
    LessonProgress?: Array<{
        isCompleted?: boolean;
        timeSpent?: number;
        completedAt?: string;
        [key: string]: unknown;
    }>;
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
    timeSpent?: number;
    isCompleted?: boolean;
    [key: string]: unknown;
}

export interface LessonCompletionPayload {
    timeSpent?: number;
    [key: string]: unknown;
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
    question?: string;
    questionText?: string;
    options: string[];
    correctAnswer?: number;
    correctAnswerIndex?: number;
    explanation?: string;
    points?: number;
    quizId?: string;
}

export interface Quiz {
    id: string;
    title?: string;
    description?: string;
    isSkipQuiz?: boolean;
    timeLimit?: number;
    chapterId?: string;
    questions?: QuizQuestion[];
    passingScore?: number;
}

export interface QuizSubmission {
    answers: number[];
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

export interface UserQuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    completedAt: string;
    timeSpent?: number;
    answers?: number[];
    percentage?: number;
    passed?: boolean;
}

export interface UserQuizAttemptsQueryParams {
    quizId?: string;
    limit?: number;
    offset?: number;
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

export interface AdminUsersQueryParams {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    level?: Level;
    limit?: number;
    offset?: number;
}

export interface AdminUserListItem extends User {
    id: string;
    email: string;
    name: string;
    username?: string;
    role: UserRole;
    level?: Level;
    school?: string;
    examYear?: number;
    isActive?: boolean;
    emailVerified?: boolean;
    image?: string;
    createdAt: string;
    lastLoginAt?: string;
    deactivatedAt?: string | null;
    [key: string]: unknown;
}

export type AdminUser = AdminUserListItem;

export interface AdminUsersQueryParams {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    level?: Level;
    limit?: number;
    offset?: number;
}

export interface AdminUsersListResponse {
    success?: boolean;
    count?: number;
    total?: number;
    pagination?: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    data: AdminUserListItem[];
    [key: string]: unknown;
}

export interface AdminAnalyticsOverview {
    users?: {
        total?: number;
        students?: number;
        teachers?: number;
        admins?: number;
        deactivated?: number;
        [key: string]: unknown;
    };
    activeUsers?: {
        weekly?: number;
        monthly?: number;
        [key: string]: unknown;
    };
    content?: Record<string, number | string | boolean | null | undefined>;
    quizzes?: Record<string, number | string | boolean | null | undefined>;
    [key: string]: unknown;
}

export type AdminPlatformOverview = AdminAnalyticsOverview;

export interface AdminAnalyticsChapterCompletion {
    primaryMetric?: {
        label?: string;
        chapter1CompletionRate?: number;
        chapter1QuizPassRate?: number;
        [key: string]: unknown;
    };
    allChapters?: Array<{
        chapterId: string;
        title: string;
        completionRate: number;
        quizPassRate: number;
        enrolledStudents: number;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}

export type AdminChapterCompletion = AdminAnalyticsChapterCompletion;

export interface AdminAnalyticsQuizStats {
    summary?: {
        totalQuizzes?: number;
        totalAttempts?: number;
        overallPassRate?: number;
        averageScore?: number;
        [key: string]: unknown;
    };
    totalAttempts?: number;
    passRate?: number;
    averageScore?: number;
    byChapter?: Array<{
        chapterId: string;
        title: string;
        attempts: number;
        passRate: number;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}

export type AdminQuizStats = AdminAnalyticsQuizStats;

export interface AdminAnalyticsWAU {
    weeks?: Array<{
        weekStart: string;
        activeUsers: number;
        [key: string]: unknown;
    }>;
    currentWAU?: number;
    previousWAU?: number;
    wauChangePercent?: number;
    growthPercent?: number;
    [key: string]: unknown;
}

export type AdminWAU = AdminAnalyticsWAU;

export interface AdminAnalyticsTeacherActivity {
    teachers?: Array<{
        teacherId: string;
        name: string;
        email: string;
        studentCount: number;
        lastActiveAt?: string;
        [key: string]: unknown;
    }>;
    totalTeachers?: number;
    activeTeachersWeekly?: number;
    weeklyActiveRate?: number;
    totalActiveTeachers?: number;
    [key: string]: unknown;
}

export type AdminTeacherActivity = AdminAnalyticsTeacherActivity;

export interface AdminAnalyticsSignups {
    summary?: {
        totalSignups?: number;
        studentSignups?: number;
        teacherSignups?: number;
        adminSignups?: number;
        [key: string]: unknown;
    };
    trend?: Array<{
        date?: string;
        total?: number;
        students?: number;
        teachers?: number;
        admins?: number;
        count?: number;
        [key: string]: unknown;
    }>;
    signups?: Array<{
        date: string;
        count: number;
        [key: string]: unknown;
    }>;
    totalSignups?: number;
    [key: string]: unknown;
}

export type AdminSignupTrend = AdminAnalyticsSignups;

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
    [key: string]: unknown;
}
