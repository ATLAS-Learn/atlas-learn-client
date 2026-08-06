import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants/api";
import {
    User,
    AuthResponse,
    AssessmentQuestion,
    AssessmentAdminItem,
    AssessmentAdminQuestion,
    AssessmentResult,
    CreateAssessmentPayload,
    UpdateAssessmentPayload,
    CreateAssessmentQuestionPayload,
    UpdateAssessmentQuestionPayload,
    Chapter,
    QuizQuestion,
    Quiz,
    QuizSubmission,
    QuizResult,
    QuizAttempt,
    UserQuizAttempt,
    UserQuizAttemptsQueryParams,
    QuizStats,
    Level,
    OverallProgressData,
    RoleUpgradeRequestPayload,
    RoleUpgradeRequestResponse,
    RoleUpgradeDecisionResponse,
    PendingRoleUpgradeRequest,
    TeacherStudentsQueryParams,
    TeacherStudentsListResponse,
    TeacherStudentProgressResponse,
    TeacherStudentProgressData,
    TeacherStudentQuizAttemptsResponse,
    TeacherStudentQuizAttemptApiItem,
    TeacherDashboardData,
    StudentDetail,
    StudentStatus,
    Subject,
    CreateSubjectPayload,
    UpdateSubjectPayload,
    SubjectQueryOptions,
    SubjectChaptersQueryOptions,
    SubjectChapterQueryOptions,
    SubjectChapterQuizzesQueryOptions,
    SubjectChapterLessonsQueryOptions,
    SubjectChapter,
    CreateSubjectChapterPayload,
    UpdateSubjectChapterPayload,
    SubjectStats,
    Lesson,
    CreateLessonPayload,
    UpdateLessonPayload,
    LessonProgressUpdatePayload,
    LessonCompletionPayload,
    LessonCompletionResponse,
    LessonWithProgress,
    LessonPdfMaterial,
    ChapterPdfMaterial,
    ChapterLesson,
    ChapterProgressData,
    ChapterExamHint,
    StreakData,
} from "@/lib/types";

// API Client class using Axios
class APIClient {
    private axiosInstance: AxiosInstance;
    private token: string | null = null;
    private inflightGetRequests = new Map<string, Promise<unknown>>();

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({
            baseURL,
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Request interceptor to add auth token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        // Centralizes error handling and provides consistent error messages
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                let errorMessage = "Request failed";
                // Extract error message from response, request, or error object
                if (error.response) {
                    const data = error.response.data as any;
                    errorMessage = data?.message || data?.error || `HTTP ${error.response.status}: ${error.response.statusText}`;
                } else if (error.request) {
                    errorMessage = "Network error - please check your connection";
                } else {
                    errorMessage = error.message || "An unexpected error occurred";
                }
                console.error(`API Error [${error.response?.status || 'N/A'}]:`, error.config?.url, errorMessage);
                console.error(
                            `API Error [${error.response?.status || 'N/A'}]`,
                            `| Code: ${error.code}`,
                            `| BaseURL: ${this.axiosInstance.defaults.baseURL}`,
                            `| Path: ${error.config?.url}`,
                            `| Message: ${errorMessage}`
                            );
                return Promise.reject(new Error(errorMessage));
            }
        );
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private serializeParams(params: unknown): string {
        if (!params || typeof params !== "object") return "";
        const entries = Object.entries(params as Record<string, unknown>)
            .filter(([, value]) => value !== undefined && value !== null)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => [key, String(value)]);
        return new URLSearchParams(entries as [string, string][]).toString();
    }

    private buildGetRequestKey(endpoint: string, params?: unknown): string {
        const authKey = this.token ? `token:${this.token.slice(0, 16)}` : "cookie-session";
        const query = this.serializeParams(params);
        return `${endpoint}?${query}::${authKey}`;
    }

    private dedupeById<T extends { id?: string }>(items: T[]): T[] {
        const seen = new Set<string>();
        const unique: T[] = [];
        for (const item of items) {
            const key = item?.id;
            if (!key) {
                unique.push(item);
                continue;
            }
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            unique.push(item);
        }
        return unique;
    }

    private shouldFallbackFromSubjectScopedError(error: unknown): boolean {
        if (!(error instanceof Error)) return false;
        const message = error.message.toLowerCase();
        return (
            message.includes("invalid input data") ||
            message.includes("invalid subject") ||
            message.includes("subject not found")
        );
    }

    private isBackendUserId(userId: string | undefined | null): userId is string {
        if (!userId) return false;
        return /^c[a-z0-9]{8,}$/i.test(userId);
    }

    private async request<T>(
        endpoint: string,
        options: {
            method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
            data?: any;
            params?: any;
        } = {}
    ): Promise<T> {
        const { method = "GET", data, params } = options;
        if (method === "GET") {
            const requestKey = this.buildGetRequestKey(endpoint, params);
            const inflight = this.inflightGetRequests.get(requestKey) as Promise<T> | undefined;
            if (inflight) {
                return inflight;
            }

            const requestPromise = this.axiosInstance
                .request<T>({
                    url: endpoint,
                    method,
                    data,
                    params,
                })
                .then((response) => response.data)
                .finally(() => {
                    this.inflightGetRequests.delete(requestKey);
                });

            this.inflightGetRequests.set(requestKey, requestPromise as Promise<unknown>);
            return requestPromise;
        }

        const response = await this.axiosInstance.request<T>({
            url: endpoint,
            method,
            data,
            params,
        });
        return response.data;
    }

    private unwrapData<T>(response: T | { data?: T }): T {
        if (typeof response === "object" && response !== null && "data" in response) {
            return (response as { data?: T }).data as T;
        }
        return response as T;
    }

    private normalizeQuestion(question: Partial<QuizQuestion>): QuizQuestion {
        const rawQuestion = question as Partial<QuizQuestion> & {
            questionId?: unknown;
            _id?: unknown;
        };
        const id =
            typeof rawQuestion.id === "string" && rawQuestion.id.trim()
                ? rawQuestion.id.trim()
                : typeof rawQuestion.questionId === "string" && rawQuestion.questionId.trim()
                    ? rawQuestion.questionId.trim()
                    : typeof rawQuestion._id === "string" && rawQuestion._id.trim()
                        ? rawQuestion._id.trim()
                        : "";
        const options = Array.isArray(question.options) ? question.options : [];
        const questionText =
            typeof question.questionText === "string"
                ? question.questionText
                : typeof question.question === "string"
                    ? question.question
                    : "";
        const correctAnswerRaw = question.correctAnswerIndex ?? question.correctAnswer;
        const correctAnswer =
            typeof correctAnswerRaw === "number" && Number.isInteger(correctAnswerRaw)
                ? correctAnswerRaw
                : -1;
        const explanation = typeof question.explanation === "string" ? question.explanation : undefined;
        const points = typeof question.points === "number" ? question.points : undefined;

        return {
            id,
            question: questionText,
            options,
            questionText: typeof question.questionText === "string" ? question.questionText : undefined,
            correctAnswer,
            correctAnswerIndex: typeof question.correctAnswerIndex === "number" ? question.correctAnswerIndex : undefined,
            explanation,
            points,
        };
    }

    private isValidQuizQuestion(question: QuizQuestion): boolean {
        const hasPrompt =
            typeof question.question === "string" && question.question.trim().length > 0;
        const hasOptions =
            Array.isArray(question.options) &&
            question.options.length > 0 &&
            question.options.every((option) => typeof option === "string" && option.trim().length > 0);

        return hasPrompt && hasOptions;
    }

    private normalizeQuiz(quiz: Partial<Quiz>): Quiz {
        const rawQuiz = quiz as Partial<Quiz> & {
            chapterId?: unknown;
            _id?: unknown;
        };
        const id =
            typeof rawQuiz.id === "string" && rawQuiz.id.trim()
                ? rawQuiz.id.trim()
                : typeof rawQuiz._id === "string" && rawQuiz._id.trim()
                    ? rawQuiz._id.trim()
                    : "";
        const chapterId =
            typeof rawQuiz.chapterId === "string" && rawQuiz.chapterId.trim()
                ? rawQuiz.chapterId.trim()
                : "";
        const rawQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const normalizedQuestions = rawQuestions
            .map((question) => this.normalizeQuestion((question || {}) as Partial<QuizQuestion>))
            .filter((question) => this.isValidQuizQuestion(question));

        return {
            ...(quiz as Quiz),
            id,
            chapterId,
            questions: normalizedQuestions,
            title: typeof quiz.title === "string" ? quiz.title : undefined,
            description: typeof quiz.description === "string" ? quiz.description : undefined,
            isSkipQuiz: typeof quiz.isSkipQuiz === "boolean" ? quiz.isSkipQuiz : undefined,
            timeLimit: typeof quiz.timeLimit === "number" ? quiz.timeLimit : undefined,
            passingScore: typeof quiz.passingScore === "number" ? quiz.passingScore : undefined,
        };
    }

    private normalizeQuizzes(quizzes: unknown[]): Quiz[] {
        return quizzes
            .map((quiz) => this.normalizeQuiz((quiz || {}) as Partial<Quiz>))
            .filter((quiz) => quiz.id);
    }

    private normalizeLesson(lesson: Partial<Lesson>): Lesson {
        const rawLesson = lesson as Partial<Lesson> & {
            lessonId?: unknown;
            _id?: unknown;
            order?: unknown;
        };
        const id =
            typeof rawLesson.id === "string" && rawLesson.id.trim()
                ? rawLesson.id.trim()
                : typeof rawLesson.lessonId === "string" && rawLesson.lessonId.trim()
                    ? rawLesson.lessonId.trim()
                    : typeof rawLesson._id === "string" && rawLesson._id.trim()
                        ? rawLesson._id.trim()
                        : "";

        return {
            ...(lesson as Lesson),
            id,
            title: typeof lesson.title === "string" ? lesson.title.trim() : undefined,
            content: typeof lesson.content === "string" ? lesson.content.trim() : undefined,
            orderIndex:
                typeof lesson.orderIndex === "number"
                    ? lesson.orderIndex
                    : typeof rawLesson.order === "number"
                        ? rawLesson.order
                        : undefined,
        };
    }

    private normalizeLessons(lessons: unknown[]): Lesson[] {
        const seenIds = new Set<string>();
        const seenSemanticKeys = new Set<string>();

        return lessons
            .map((lesson) => this.normalizeLesson((lesson || {}) as Partial<Lesson>))
            .filter((lesson) => {
                const canonicalTitle =
                    typeof lesson.title === "string"
                        ? lesson.title
                            .trim()
                            .toLowerCase()
                            .replace(/^lesson\s+\d+\s*:\s*/i, "")
                        : "";
                const contentKey =
                    typeof lesson.content === "string" && lesson.content.trim()
                        ? lesson.content.trim().toLowerCase().slice(0, 120)
                        : "";
                const pdfKey = typeof lesson.pdfUrl === "string" ? lesson.pdfUrl.trim().toLowerCase() : "";
                const videoKey = typeof lesson.videoUrl === "string" ? lesson.videoUrl.trim().toLowerCase() : "";
                const semanticKey = [canonicalTitle, contentKey, pdfKey, videoKey]
                    .filter(Boolean)
                    .join("::");

                if (lesson.id && seenIds.has(lesson.id)) {
                    return false;
                }

                if (semanticKey && seenSemanticKeys.has(semanticKey)) {
                    return false;
                }

                if (lesson.id) {
                    seenIds.add(lesson.id);
                }
                if (semanticKey) {
                    seenSemanticKeys.add(semanticKey);
                }
                return true;
            })
            .sort((a, b) => {
                const aOrder = typeof a.orderIndex === "number" ? a.orderIndex : Number.MAX_SAFE_INTEGER;
                const bOrder = typeof b.orderIndex === "number" ? b.orderIndex : Number.MAX_SAFE_INTEGER;
                return aOrder - bOrder;
            });
    }

    private normalizeChapter(chapter: Partial<Chapter>): Chapter {
        const rawChapter = chapter as Partial<Chapter> & {
            _id?: unknown;
            orderIndex?: unknown;
            subjectId?: unknown;
            subject_id?: unknown;
            estimatedMinutes?: unknown;
            unlockThreshold?: unknown;
            pdfUrl?: unknown;
            externalLinks?: unknown;
        };

        const id =
            typeof rawChapter.id === "string" && rawChapter.id.trim()
                ? rawChapter.id.trim()
                : typeof rawChapter._id === "string" && rawChapter._id.trim()
                    ? rawChapter._id.trim()
                    : "";
        const order =
            typeof chapter.order === "number"
                ? chapter.order
                : typeof rawChapter.orderIndex === "number"
                    ? rawChapter.orderIndex
                    : 0;
        const subjectId =
            typeof rawChapter.subjectId === "string" && rawChapter.subjectId.trim()
                ? rawChapter.subjectId.trim()
                : typeof rawChapter.subject_id === "string" && rawChapter.subject_id.trim()
                    ? rawChapter.subject_id.trim()
                    : undefined;

        return {
            ...(chapter as Chapter),
            id,
            title: typeof chapter.title === "string" ? chapter.title : "",
            description: typeof chapter.description === "string" ? chapter.description : "",
            level: typeof chapter.level === "string" ? chapter.level : Level.FOUNDATIONAL,
            order,
            subject: typeof chapter.subject === "string" ? chapter.subject : "",
            content: Array.isArray(chapter.content) ? chapter.content : [],
            subjectId,
            estimatedTime:
                typeof chapter.estimatedTime === "number"
                    ? chapter.estimatedTime
                    : typeof rawChapter.estimatedMinutes === "number"
                        ? rawChapter.estimatedMinutes
                        : 0,
        };
    }

    private normalizeUserPayload(response: unknown): User {
        if (!response || typeof response !== "object") {
            throw new Error("Invalid user response");
        }

        const payload = response as Record<string, unknown>;
        const data =
            payload.data && typeof payload.data === "object"
                ? (payload.data as Record<string, unknown>)
                : null;
        const dataData =
            data?.data && typeof data.data === "object"
                ? (data.data as Record<string, unknown>)
                : null;

        const candidates: unknown[] = [
            payload,
            payload.user,
            data,
            data?.user,
            dataData,
            dataData?.user,
        ];

        for (const item of candidates) {
            if (!item || typeof item !== "object") continue;
            const user = item as Partial<User>;
            if (user.id && user.email) {
                return user as User;
            }
        }

        const payloadKeys = Object.keys(payload).join(", ");
        const dataKeys = data ? Object.keys(data).join(", ") : "none";
        throw new Error(`Invalid user response (keys: ${payloadKeys}; data keys: ${dataKeys})`);
    }

    private buildSubjectQueryParams(options: SubjectQueryOptions = {}, config: { allowChapterDetails?: boolean } = {}) {
        const includeChapters = options.includeChapters === true;
        const includeChapterDetails =
            config.allowChapterDetails !== false &&
            includeChapters &&
            options.includeChapterDetails === true;
        const params: Record<string, string> = {};
        if (includeChapters) {
            params.includeChapters = "true";
        }
        if (includeChapterDetails) {
            params.includeChapterDetails = "true";
        }
        return Object.keys(params).length ? params : undefined;
    }

    private buildSubjectChaptersQueryParams(options: SubjectChaptersQueryOptions = {}) {
        const params: Record<string, string> = {};
        if (options.includeDetails) {
            params.includeDetails = "true";
        }
        if (options.includeProgress) {
            params.includeProgress = "true";
        }
        return Object.keys(params).length ? params : undefined;
    }

    private buildSubjectChapterQueryParams(options: SubjectChapterQueryOptions = {}) {
        const params: Record<string, string> = {};
        if (options.includeSubject) {
            params.includeSubject = "true";
        }
        if (options.includeLessons) {
            params.includeLessons = "true";
        }
        if (options.includeQuizzes) {
            params.includeQuizzes = "true";
        }
        if (options.includeProgress) {
            params.includeProgress = "true";
        }
        if (options.includeExamHints) {
            params.includeExamHints = "true";
        }
        return Object.keys(params).length ? params : undefined;
    }

    private buildChapterQuizzesQueryParams(options: SubjectChapterQuizzesQueryOptions = {}) {
        const params: Record<string, string> = {};
        if (options.includeQuestions) {
            params.includeQuestions = "true";
        }
        if (options.includeAttempts !== undefined) {
            params.includeAttempts = String(options.includeAttempts);
        }
        return Object.keys(params).length ? params : undefined;
    }

    private buildSubjectChapterLessonsQueryParams(options: SubjectChapterLessonsQueryOptions = {}) {
        const params: Record<string, string> = {};
        if (options.includeProgress !== undefined) {
            params.includeProgress = String(options.includeProgress);
        }
        return Object.keys(params).length ? params : undefined;
    }

    // Auth endpoints
    async signUpWithOTP(data: {
        name: string;
        email: string;
        username?: string;
        role?: "student" | "teacher" | "admin";
        image?: string;
        bio?: string;
        school?: string;
        examYear?: number;
        level?: Level;
    }): Promise<{ success: boolean; message: string }> {
        return this.request<{ success: boolean; message: string }>("/auth/sign-up/otp", {
            method: "POST",
            data,
        });
    }

    async signOut(): Promise<void> {
        return this.request<void>("/auth/sign-out", {
            method: "POST",
        });
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.request<User | { data?: User }>("/auth/me");
        return this.normalizeUserPayload(response);
    }

    async updateCurrentUserProfile(data: {
        name?: string;
        username?: string;
        bio?: string;
        school?: string;
        examYear?: number;
        image?: string;
    }): Promise<User> {
        const response = await this.request<User>("/auth/me", {
            method: "PATCH",
            data,
        });
        return this.normalizeUserPayload(response);
    }

    async getPreferredSubjects(): Promise<string[]> {
        const response = await this.request<{ subjectIds?: string[] }>("/auth/preferred-subjects");
        return response?.subjectIds ?? [];
    }

    async updatePreferredSubjects(subjectIds: string[]): Promise<string[]> {
        const response = await this.request<{ subjectIds?: string[] }>("/auth/preferred-subjects", {
            method: "PUT",
            data: { subjectIds },
        });
        return response?.subjectIds ?? subjectIds;
    }

    async uploadProfileImage(uri: string): Promise<string> {
        const formData = new FormData();
        const filename = uri.split("/").pop() || "photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("image", { uri, name: filename, type } as any);
        const response = await this.axiosInstance.post<{ url?: string }>("/auth/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data?.url ?? "";
    }

    async forgotPassword(_email: string): Promise<{ message: string }> {
        throw new Error("Password reset is not yet supported. Please contact support.");
    }

    async resetPassword(_token: string, _password: string): Promise<{ message: string }> {
        throw new Error("Password reset is not yet supported. Please contact support.");
    }

    async verifyEmail(_code: string): Promise<{ message: string }> {
        throw new Error("Email verification is not yet supported. Please contact support.");
    }

    async resendVerification(): Promise<{ message: string }> {
        throw new Error("Email verification is not yet supported. Please contact support.");
    }

    // OTP Login endpoints
    async requestOTP(email: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/otp/request", {
            method: "POST",
            data: { email },
        });
    }

    async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/otp/verify", {
            method: "POST",
            data: { email, otp },
        });
    }

    async verifyOTPLogin(email: string, otp: string): Promise<AuthResponse> {
        return this.verifyOTP(email, otp);
    }

    // Session management endpoints
    async getSessions(): Promise<{ id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[]> {
        const response = await this.request<
            | { id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[]
            | {
                success?: boolean;
                data?:
                | { id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[]
                | {
                    sessions?: { id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[];
                };
                sessions?: { id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[];
            }
        >("/auth/sessions");

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.sessions)) {
            return response.sessions;
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (response?.data && typeof response.data === "object" && Array.isArray(response.data.sessions)) {
            return response.data.sessions;
        }

        return [];
    }

    async revokeSession(sessionId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/sessions/revoke", {
            method: "POST",
            data: { sessionId },
        });
    }

    // Role upgrade endpoints
    async requestRoleUpgrade(data: RoleUpgradeRequestPayload): Promise<RoleUpgradeRequestResponse> {
        return this.request<RoleUpgradeRequestResponse>("/auth/request-role-upgrade", {
            method: "POST",
            data,
        });
    }

    async approveRoleUpgrade(userId: string): Promise<RoleUpgradeDecisionResponse> {
        return this.request<RoleUpgradeDecisionResponse>(`/auth/approve-role-upgrade/${userId}`, {
            method: "POST",
        });
    }

    async rejectRoleUpgrade(userId: string): Promise<RoleUpgradeDecisionResponse> {
        return this.request<RoleUpgradeDecisionResponse>(`/auth/reject-role-upgrade/${userId}`, {
            method: "POST",
        });
    }

    async getPendingRoleUpgrades(): Promise<PendingRoleUpgradeRequest[]> {
        const response = await this.request<{
            success: boolean;
            count: number;
            data: PendingRoleUpgradeRequest[];
        }>("/auth/pending-role-upgrades");
        return response?.data ?? [];
    }

    // Assessment endpoints
    // Using dedicated assessment endpoints: /api/v1/assessment/*

    /**
     * Start assessment and retrieve questions
     * @returns Array of assessment questions mapped to the expected format
     * @throws Error if response structure is invalid or no active assessment available
     */
    async startAssessment(): Promise<AssessmentQuestion[]> {
        // API returns: { success: true, data: { id, title, description, questionCount, questions: [...] } }
        const response = await this.request<{
            success: boolean;
            data: {
                id: string;
                title: string;
                description: string;
                questionCount: number;
                questions: {
                    id: string;
                    questionText: string;
                    options: string[];
                    orderIndex: number;
                    subjectId?: string;
                    subjectName?: string;
                }[];
            };
        }>("/assessment/start");

        // Validate response structure to prevent runtime errors
        if (!response?.data?.questions || !Array.isArray(response.data.questions)) {
            throw new Error("Invalid assessment response: questions array not found");
        }

        // Map API response format to AssessmentQuestion format
        return response.data.questions.map((q) => ({
            id: q.id,
            question: q.questionText || "",
            options: q.options || [],
            correctAnswer: -1,
            topic: "",
            subjectId: q.subjectId,
            subjectName: q.subjectName,
        }));
    }

    /**
     * Submit assessment answers
     * @param answers Array of answer indices in question order (e.g., [0, 1, 2, 0, 1])
     * @returns Assessment result with score, level, and message
     */
    async submitAssessment(answers: number[]): Promise<AssessmentResult> {
        const result = await this.request<{
            success: boolean;
            message: string;
            data: {
                attemptId: string;
                score: number;
                level: Level;
                levelLabel: string;
                levelDescription: string;
                correctAnswers: number;
                totalQuestions: number;
                subjectBreakdown?: { subjectId: string; subjectName: string; correct: number; total: number; score: number }[];
                perSubjectRecommendations?: { subjectId: string; subjectName: string; score: number; recommendedChapter: { id: string; title: string } | null; unlockedChapterIds: string[] }[];
                recommendedChapter?: { id: string; title: string } | null;
                unlockedChapters?: { subjectId: string; subjectName: string; chapterId: string; chapterTitle: string }[];
                completedAt: string;
            };
        }>("/assessment/submit", {
            method: "POST",
            data: { answers },
        });

        if (!result?.data) {
            throw new Error("Invalid assessment submission response");
        }

        return {
            score: result.data.correctAnswers ?? result.data.score,
            totalQuestions: result.data.totalQuestions,
            level: result.data.level,
            message: result.data.levelDescription || result.message || "Assessment completed successfully",
            subjectBreakdown: result.data.subjectBreakdown,
            perSubjectRecommendations: result.data.perSubjectRecommendations,
            recommendedChapter: result.data.recommendedChapter,
            unlockedChapters: result.data.unlockedChapters,
        };
    }

    async getAssessmentResult(): Promise<AssessmentResult> {
        const response = await this.request<{
            success: boolean;
            data: {
                score: number;
                totalQuestions?: number;
                level: Level;
                levelLabel: string;
                levelDescription: string;
                subjectBreakdown?: { subjectId: string; subjectName: string; correct: number; total: number; score: number }[];
                recommendedChapter?: { id: string; title: string; subjectName?: string } | null;
                perSubjectRecommendations?: { subjectId: string; subjectName: string; score: number; recommendedChapter: { id: string; title: string } | null; unlockedChapterIds: string[] }[];
                corrections?: { questionIndex: number; questionText: string; options: string[]; userAnswer: number | null; correctAnswer: number; isCorrect: boolean; explanation: string | null; subjectName: string; points: number }[];
                completedAt: string;
            };
        }>("/assessment/result");
        return {
            score: response.data.score,
            totalQuestions: response.data.totalQuestions || 0,
            level: response.data.level,
            message: response.data.levelDescription || "Assessment completed",
            subjectBreakdown: response.data.subjectBreakdown,
            recommendedChapter: response.data.recommendedChapter,
            perSubjectRecommendations: response.data.perSubjectRecommendations,
            corrections: response.data.corrections,
        };
    }

    async getAssessmentStatus(): Promise<{ completed: boolean; level?: Level }> {
        const response = await this.request<{
            success: boolean;
            data: {
                isCompleted: boolean;
                attemptId?: string;
                completedAt?: string;
                level?: Level;
            };
        }>("/assessment/status");
        return {
            completed: response.data.isCompleted,
            level: response.data.level,
        };
    }

    async getLearningPath(): Promise<import("@/lib/types").LearningPath> {
        const response = await this.request<{
            success: boolean;
            data: import("@/lib/types").LearningPath;
        }>("/recommendations/learning-path");
        return response.data;
    }

    async getOverallProgress(): Promise<OverallProgressData> {
        const response = await this.request<
            OverallProgressData | { success?: boolean; data?: OverallProgressData }
        >("/progress/overall");
        return this.unwrapData<OverallProgressData>(response);
    }

    async getStreak(): Promise<StreakData> {
        const response = await this.request<
            { success?: boolean; data?: StreakData } | StreakData
        >("/progress/streak");
        return this.unwrapData<StreakData>(response);
    }

    async bulkCompleteChapters(subjectId: string, beforeChapterId: string): Promise<{ completed: number; message: string }> {
        const response = await this.request<{ completed: number; message: string }>("/progress/bulk-complete", {
            method: "POST",
            data: { subjectId, beforeChapterId },
        });
        return this.unwrapData<{ completed: number; message: string }>(response);
    }

    // Assessment management endpoints (Admin/Teacher)
    async getAssessments(): Promise<AssessmentAdminItem[]> {
        const response = await this.request<AssessmentAdminItem[] | { data?: AssessmentAdminItem[] }>("/assessments");
        return this.unwrapData<AssessmentAdminItem[]>(response) || [];
    }

    async createAssessment(data: CreateAssessmentPayload): Promise<AssessmentAdminItem> {
        const response = await this.request<AssessmentAdminItem | { data?: AssessmentAdminItem }>("/assessments", {
            method: "POST",
            data,
        });
        return this.unwrapData<AssessmentAdminItem>(response);
    }

    async getAssessmentById(assessmentId: string): Promise<AssessmentAdminItem> {
        const response = await this.request<AssessmentAdminItem | { data?: AssessmentAdminItem }>(`/assessments/${assessmentId}`);
        return this.unwrapData<AssessmentAdminItem>(response);
    }

    async updateAssessment(
        assessmentId: string,
        data: UpdateAssessmentPayload
    ): Promise<AssessmentAdminItem> {
        const response = await this.request<AssessmentAdminItem | { data?: AssessmentAdminItem }>(`/assessments/${assessmentId}`, {
            method: "PUT",
            data,
        });
        return this.unwrapData<AssessmentAdminItem>(response);
    }

    async deleteAssessment(assessmentId: string): Promise<void> {
        await this.request<void>(`/assessments/${assessmentId}`, {
            method: "DELETE",
        });
    }

    async createAssessmentQuestion(
        assessmentId: string,
        data: CreateAssessmentQuestionPayload
    ): Promise<AssessmentAdminQuestion> {
        const response = await this.request<AssessmentAdminQuestion | { data?: AssessmentAdminQuestion }>(
            `/assessments/${assessmentId}/questions`,
            {
                method: "POST",
                data,
            }
        );
        return this.unwrapData<AssessmentAdminQuestion>(response);
    }

    async updateAssessmentQuestion(
        assessmentId: string,
        questionId: string,
        data: UpdateAssessmentQuestionPayload
    ): Promise<AssessmentAdminQuestion> {
        const response = await this.request<AssessmentAdminQuestion | { data?: AssessmentAdminQuestion }>(
            `/assessments/${assessmentId}/questions/${questionId}`,
            {
                method: "PUT",
                data,
            }
        );
        return this.unwrapData<AssessmentAdminQuestion>(response);
    }

    async deleteAssessmentQuestion(assessmentId: string, questionId: string): Promise<void> {
        await this.request<void>(`/assessments/${assessmentId}/questions/${questionId}`, {
            method: "DELETE",
        });
    }

    // Legacy method for backward compatibility (if needed)
    async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
        return this.startAssessment();
    }

    // Subject endpoints
    async getSubjects(options: SubjectQueryOptions = {}): Promise<Subject[]> {
        const response = await this.request<
            Subject[] | { success?: boolean; count?: number; data?: Subject[] }
        >("/subjects", {
            params: this.buildSubjectQueryParams(options),
        });
        const subjects = this.unwrapData<Subject[]>(response);
        return Array.isArray(subjects) ? subjects : [];
    }

    async createSubject(data: CreateSubjectPayload): Promise<Subject> {
        const response = await this.request<
            Subject | { success?: boolean; message?: string; data?: Subject }
        >("/subjects", {
            method: "POST",
            data,
        });
        return this.unwrapData<Subject>(response);
    }

    async getSubjectById(subjectId: string, options: SubjectQueryOptions = {}): Promise<Subject> {
        const response = await this.request<
            Subject | { success?: boolean; message?: string; data?: Subject }
        >(
            `/subjects/${subjectId}`,
            {
                params: this.buildSubjectQueryParams(options, { allowChapterDetails: false }),
            }
        );
        return this.unwrapData<Subject>(response);
    }

    async updateSubject(subjectId: string, data: UpdateSubjectPayload): Promise<Subject> {
        const response = await this.request<
            Subject | { success?: boolean; message?: string; data?: Subject }
        >(`/subjects/${subjectId}`, {
            method: "PUT",
            data,
        });
        return this.unwrapData<Subject>(response);
    }

    async deleteSubject(subjectId: string): Promise<void> {
        await this.request<
            void | {
                success?: boolean;
                message?: string;
                data?: {
                    deletedSubject?: { id?: string; name?: string; code?: string };
                    cascadeCount?: { chapters?: number; lessons?: number; quizzes?: number };
                };
            }
        >(`/subjects/${subjectId}`, {
            method: "DELETE",
        });
    }

    async getSubjectByCode(code: string, options: SubjectQueryOptions = {}): Promise<Subject> {
        const normalizedCode = code.trim().toUpperCase();
        const response = await this.request<
            Subject | { success?: boolean; message?: string; data?: Subject }
        >(
            `/subjects/code/${encodeURIComponent(normalizedCode)}`,
            {
                params: this.buildSubjectQueryParams(options, { allowChapterDetails: false }),
            }
        );
        return this.unwrapData<Subject>(response);
    }

    async getSubjectChapters(
        subjectId: string,
        options: SubjectChaptersQueryOptions = {}
    ): Promise<SubjectChapter[]> {
        const response = await this.request<
            SubjectChapter[] | { success?: boolean; count?: number; data?: SubjectChapter[] }
        >(`/subjects/${subjectId}/chapters`, {
            params: this.buildSubjectChaptersQueryParams(options),
        });
        const chapters = this.unwrapData<SubjectChapter[]>(response);
        return Array.isArray(chapters) ? chapters : [];
    }

    async createSubjectChapter(subjectId: string, data: CreateSubjectChapterPayload): Promise<SubjectChapter> {
        const response = await this.request<
            SubjectChapter | { success?: boolean; message?: string; data?: SubjectChapter }
        >(
            `/subjects/${subjectId}/chapters`,
            {
                method: "POST",
                data,
            }
        );
        return this.unwrapData<SubjectChapter>(response);
    }

    async getSubjectChapter(
        subjectId: string,
        chapterId: string,
        options: SubjectChapterQueryOptions = {}
    ): Promise<SubjectChapter> {
        const response = await this.request<SubjectChapter | { success?: boolean; data?: SubjectChapter }>(
            `/chapters/${chapterId}`,
            {
                params: this.buildSubjectChapterQueryParams(options),
            }
        );
        return this.unwrapData<SubjectChapter>(response);
    }

    async updateSubjectChapter(
        subjectId: string,
        chapterId: string,
        data: UpdateSubjectChapterPayload
    ): Promise<SubjectChapter> {
        const response = await this.request<
            SubjectChapter | { success?: boolean; message?: string; data?: SubjectChapter }
        >(
            `/chapters/${chapterId}`,
            {
                method: "PUT",
                data,
            }
        );
        return this.unwrapData<SubjectChapter>(response);
    }

    async deleteSubjectChapter(subjectId: string, chapterId: string): Promise<void> {
        await this.request<void | { message?: string }>(`/chapters/${chapterId}`, {
            method: "DELETE",
        });
    }

    async getSubjectStats(subjectId: string): Promise<SubjectStats> {
        const response = await this.request<SubjectStats | { success?: boolean; data?: SubjectStats }>(
            `/subjects/${subjectId}/stats`
        );
        return this.unwrapData<SubjectStats>(response);
    }

    // Lesson endpoints (subject chapter)
    async getSubjectChapterLessons(
        subjectId: string,
        chapterId: string,
        options: SubjectChapterQuizzesQueryOptions = {}
    ): Promise<Quiz[]> {
        this.traceIdOrigin("getSubjectChapterQuizzes", { subjectId, chapterId, options });
        const response = await this.request<Quiz[] | { success?: boolean; data?: Quiz[] }>(
            `/chapters/${chapterId}/quizzes`,
            {
                params: this.buildSubjectChapterQuizzesQueryParams(options),
            }
        );
        const quizzes = this.unwrapData<Quiz[]>(response);
        return Array.isArray(quizzes) ? quizzes : [];
    }

    async getSubjectChapterProgress(subjectId: string, chapterId: string): Promise<SubjectChapterProgress> {
        this.traceIdOrigin("getSubjectChapterProgress", { subjectId, chapterId });
        const response = await this.request<
            SubjectChapterProgress | { success?: boolean; message?: string; data?: SubjectChapterProgress }
        >(`/chapters/${chapterId}/progress`);
        return this.unwrapData<SubjectChapterProgress>(response);
    }

    async unlockSubjectChapter(subjectId: string, chapterId: string): Promise<SubjectChapterUnlockResponse> {
        return this.request<SubjectChapterUnlockResponse>(
            `/chapters/${chapterId}/progress/unlock`,
            {
                method: "POST",
            }
        );
    }

    async getSubjectChapterExamHints(subjectId: string, chapterId: string): Promise<SubjectExamHint[]> {
        this.traceIdOrigin("getSubjectChapterExamHints", { subjectId, chapterId });
        const response = await this.request<SubjectExamHint[] | { success?: boolean; data?: SubjectExamHint[] }>(
            `/chapters/${chapterId}/exam-hints`
        );
        const hints = this.unwrapData<SubjectExamHint[]>(response);
        return Array.isArray(hints) ? hints : [];
    }

    // Lesson endpoints (subject chapter)
    async getSubjectChapterLessons(subjectId: string, chapterId: string, includeProgress = false): Promise<LessonWithProgress[]> {
        this.traceIdOrigin("getSubjectChapterLessons", { subjectId, chapterId });
        const query = includeProgress ? "?includeProgress=true" : "";
        const response = await this.request<LessonWithProgress[] | { success?: boolean; data?: LessonWithProgress[] }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons${query}`
        );
        const lessons = this.unwrapData<LessonWithProgress[]>(response);
        return Array.isArray(lessons) ? this.dedupeById(lessons) : [];
    }

    async createSubjectChapterLesson(
        subjectId: string,
        chapterId: string,
        data: CreateLessonPayload
    ): Promise<Lesson> {
        const response = await this.request<Lesson | { success?: boolean; data?: Lesson }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons`,
            {
                method: "POST",
                data,
            }
        );
        return this.unwrapData<Lesson>(response);
    }

    async getSubjectChapterLesson(subjectId: string, chapterId: string, lessonId: string, includeProgress = false): Promise<LessonWithProgress> {
        const query = includeProgress ? "?includeProgress=true" : "";
        const response = await this.request<LessonWithProgress | { success?: boolean; data?: LessonWithProgress }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}${query}`
        );
        return this.unwrapData<LessonWithProgress>(response);
    }

    async updateSubjectChapterLesson(
        subjectId: string,
        chapterId: string,
        lessonId: string,
        data: UpdateLessonPayload
    ): Promise<Lesson> {
        const response = await this.request<Lesson | { success?: boolean; data?: Lesson }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`,
            {
                method: "PATCH",
                data,
            }
        );
        return this.unwrapData<Lesson>(response);
    }

    async deleteSubjectChapterLesson(subjectId: string, chapterId: string, lessonId: string): Promise<void> {
        await this.request<void>(`/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`, {
            method: "DELETE",
        });
    }

    async completeSubjectChapterLesson(
        subjectId: string,
        chapterId: string,
        lessonId: string,
        data: LessonCompletionPayload = {}
    ): Promise<LessonCompletionResponse> {
        return await this.request<LessonCompletionResponse>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}/complete`,
            {
                method: "POST",
                data: { timeSpent: 0 },
            }
        );
    }

    async updateSubjectChapterLessonProgress(
        subjectId: string,
        chapterId: string,
        lessonId: string,
        data: LessonProgressUpdatePayload
    ): Promise<LessonCompletionResponse> {
        return await this.request<LessonCompletionResponse>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}/progress`,
            {
                method: "POST",
                data,
            }
        );
    }

    async getSubjectChapterLessonPdf(
        subjectId: string,
        chapterId: string,
        lessonId: string
    ): Promise<LessonPdfMaterial> {
        const response = await this.request<LessonPdfMaterial | { success?: boolean; data?: LessonPdfMaterial }>(
            `/chapters/${chapterId}/pdf`
        );
        return this.unwrapData<LessonPdfMaterial>(response);
    }

    // Dashboard endpoints
    // NOTE: Server doesn't have a dashboard endpoint yet, so dashboard screen uses local stores
    // When server API is ready, implement: GET /api/dashboard
    // async getDashboard(): Promise<DashboardData> {
    //     return this.request<DashboardData>("/dashboard");
    // }

    // Chapter endpoints
    async getChapters(): Promise<Chapter[]> {
        // Supports both raw array and wrapped response: { success, data: [...] }
        const response = await this.request<Chapter[] | { data?: Chapter[] }>(`/chapters`);
        const chapters = this.unwrapData<Chapter[]>(response);
        return Array.isArray(chapters) ? chapters : [];
    }

    async createChapter(data: Partial<Chapter>): Promise<Chapter> {
        const response = await this.request<Chapter | { success?: boolean; data?: Chapter }>(`/chapters`, {
            method: "POST",
            data,
        });
        return this.unwrapData<Chapter>(response);
    }

    async getChapter(chapterId: string): Promise<Chapter> {
        const response = await this.request<Chapter | { success?: boolean; data?: Chapter }>(`/chapters/${chapterId}`);
        return this.unwrapData<Chapter>(response);
    }

    async updateChapter(chapterId: string, data: Partial<Chapter>): Promise<Chapter> {
        const response = await this.request<Chapter | { success?: boolean; data?: Chapter }>(`/chapters/${chapterId}`, {
            method: "PUT",
            data,
        });
        return this.unwrapData<Chapter>(response);
    }

    async deleteChapter(chapterId: string): Promise<void> {
        await this.request<void>(`/chapters/${chapterId}`, {
            method: "DELETE",
        });
    }

    async getChapterPdf(chapterId: string): Promise<ChapterPdfMaterial> {
        const response = await this.request<ChapterPdfMaterial | { success?: boolean; data?: ChapterPdfMaterial }>(
            `/chapters/${chapterId}/pdf`
        );
        return this.unwrapData<ChapterPdfMaterial>(response);
    }

    async getChapterLessons(chapterId: string, includeProgress = false): Promise<LessonWithProgress[]> {
        const query = includeProgress ? "?includeProgress=true" : "";
        const response = await this.request<LessonWithProgress[] | { success?: boolean; data?: LessonWithProgress[] }>(
            `/chapters/${chapterId}/lessons${query}`
        );
        const lessons = this.unwrapData<LessonWithProgress[]>(response);
        return Array.isArray(lessons) ? this.dedupeById(lessons) : [];
    }

    // Chapter Quiz endpoints
    async getChapterQuizzes(chapterId: string): Promise<Quiz[]> {
        const response = await this.request<Quiz[] | { success?: boolean; data?: Quiz[] }>(
            `/chapters/${chapterId}/quizzes?includeQuestions=true`
        );
        const quizzes = this.unwrapData<Quiz[]>(response);
        return Array.isArray(quizzes) ? quizzes : [];
    }

    async getChapterProgress(chapterId: string): Promise<ChapterProgressData> {
        const response = await this.request<ChapterProgressData | { success?: boolean; data?: ChapterProgressData }>(
            `/chapters/${chapterId}/progress`
        );
        return this.unwrapData<ChapterProgressData>(response);
    }

    async getChapterExamHints(chapterId: string): Promise<ChapterExamHint[]> {
        const response = await this.request<ChapterExamHint[] | { success?: boolean; data?: ChapterExamHint[] }>(
            `/chapters/${chapterId}/exam-hints`
        );
        const hints = this.unwrapData<ChapterExamHint[]>(response);
        return Array.isArray(hints) ? hints : [];
    }

    async getChapterQuiz(chapterId: string, subjectId?: string): Promise<Quiz> {
        // Get the first quiz for a chapter (for backward compatibility)
        const quizzes = await this.getChapterQuizzes(chapterId, {
            includeQuestions: true,
            includeAttempts: false,
        });
        if (quizzes.length === 0) {
            throw new Error(`No quizzes found for chapter ${chapterId}`);
        }
        return quizzes[0];
    }

    async createChapterQuiz(chapterId: string, quizData: Partial<Quiz>): Promise<Quiz> {
        // Create a new quiz for a chapter
        return this.request<Quiz>(`/chapters/${chapterId}/quizzes`, {
            method: "POST",
            data: quizData,
        });
    }

    // Quiz endpoints
    async getQuizzes(chapterId: string): Promise<Quiz[]> {
        // Use chapter-scoped quizzes endpoint
        return this.getChapterQuizzes(chapterId);
    }

    async getQuiz(quizId: string): Promise<Quiz> {
        return this.request<Quiz>(`/quizzes/${quizId}`);
    }

    async updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<Quiz> {
        return this.request<Quiz>(`/quizzes/${quizId}`, {
            method: "PUT",
            data: quizData,
        });
    }

    async deleteQuiz(quizId: string): Promise<void> {
        return this.request<void>(`/quizzes/${quizId}`, {
            method: "DELETE",
        });
    }

    async addQuizQuestion(quizId: string, questionData: any): Promise<any> {
        return this.request<any>(`/quizzes/${quizId}/questions`, {
            method: "POST",
            data: questionData,
        });
    }

    async updateQuizQuestion(quizId: string, questionId: string, questionData: any): Promise<any> {
        return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, {
            method: "PUT",
            data: questionData,
        });
    }

    async deleteQuizQuestion(quizId: string, questionId: string): Promise<void> {
        return this.request<void>(`/quizzes/${quizId}/questions/${questionId}`, {
            method: "DELETE",
        });
    }

    async submitQuiz(quizId: string, submission: QuizSubmission): Promise<QuizResult> {
        const response = await this.request<QuizResult | { success?: boolean; data?: QuizResult }>(
            `/quizzes/${quizId}/submit`,
            {
                method: "POST",
                data: submission,
            }
        );
        return this.unwrapData<QuizResult>(response);
    }

    async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
        // Get all attempts for a quiz
        return this.request<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
    }

    async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
        // Get all quiz attempts by a user
        const response = await this.request<{ success?: boolean; data?: QuizAttempt[] }>(`/users/${userId}/quiz-attempts`);
        return this.unwrapData<QuizAttempt[]>(response) || [];
    }

    async getQuizStats(quizId: string): Promise<QuizStats> {
        const response = await this.request<QuizStats | { success?: boolean; data?: QuizStats }>(
            `/quizzes/${quizId}/stats`
        );
        return this.unwrapData<QuizStats>(response);
    }

    // Teacher endpoints
    async getTeacherStudents(
        params: TeacherStudentsQueryParams = {}
    ): Promise<TeacherStudentsListResponse> {
        return this.request<TeacherStudentsListResponse>("/teacher/students", { params });
    }

    async getStudentProgress(studentId: string): Promise<TeacherStudentProgressData> {
        const response = await this.request<TeacherStudentProgressResponse>(
            `/teacher/students/${studentId}/progress`
        );
        return response.data;
    }

    async getStudentQuizAttemptsForTeacher(
        studentId: string,
        params: { subjectId?: string; chapterId?: string; limit?: number; offset?: number } = {}
    ): Promise<TeacherStudentQuizAttemptsResponse> {
        return this.request<TeacherStudentQuizAttemptsResponse>(`/teacher/students/${studentId}/quiz-attempts`, {
            params,
        });
    }

    async getTeacherDashboard(): Promise<TeacherDashboardData> {
        const studentsResponse = await this.getTeacherStudents({ limit: 50, offset: 0 });
        const students = studentsResponse.data || [];

        const progressPairs = await Promise.all(
            students.map(async (student) => {
                try {
                    const progress = await this.getStudentProgress(student.id);
                    return [student.id, progress] as const;
                } catch {
                    return [student.id, null] as const;
                }
            })
        );

        const progressMap = new Map<string, TeacherStudentProgressData | null>(progressPairs);

        const mappedStudents = students.map((student) => {
            const progress = progressMap.get(student.id);
            const overallProgress = progress?.overall?.completionPercentage ?? 0;
            const status = mapStatusFromProgress(overallProgress);

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                status,
                currentChapterId: undefined,
                currentChapterTitle: undefined,
                overallProgress,
                lastActiveDate: student.lastLoginAt || student.createdAt,
            };
        });

        const lessonTotals = Array.from(progressMap.values()).reduce(
            (acc, progress) => {
                if (!progress?.overall?.lessons) return acc;
                acc.totalLessons += progress.overall.lessons.total || 0;
                acc.totalCompleted += progress.overall.lessons.completed || 0;
                acc.totalTimeSpent += progress.overall.totalTimeSpent || 0;
                return acc;
            },
            { totalLessons: 0, totalCompleted: 0, totalTimeSpent: 0 }
        );

        const lessonCountStudents = Array.from(progressMap.values()).filter(
            (progress) => progress?.overall?.lessons
        ).length;

        const averageCompletionPercent =
            lessonTotals.totalLessons > 0
                ? Math.round((lessonTotals.totalCompleted / lessonTotals.totalLessons) * 100)
                : 0;
        const averageTimeSpent =
            lessonCountStudents > 0 ? Math.round(lessonTotals.totalTimeSpent / lessonCountStudents) : 0;

        const onTrackCount = mappedStudents.filter(
            (student) => student.status === StudentStatus.ON_TRACK
        ).length;
        const behindCount = mappedStudents.filter(
            (student) => student.status === StudentStatus.BEHIND
        ).length;
        const atRiskCount = mappedStudents.filter(
            (student) => student.status === StudentStatus.AT_RISK
        ).length;

        return {
            students: mappedStudents,
            totalStudents: studentsResponse.total ?? mappedStudents.length,
            onTrackCount,
            behindCount,
            atRiskCount,
            lessonSummary: {
                totalLessons: lessonTotals.totalLessons,
                totalCompleted: lessonTotals.totalCompleted,
                averageCompletionPercent,
                averageTimeSpent,
            },
        };
    }

    async getStudentDetail(studentId: string): Promise<StudentDetail> {
        const [progress, attemptsResponse] = await Promise.all([
            this.getStudentProgress(studentId),
            this.getStudentQuizAttemptsForTeacher(studentId, { limit: 50, offset: 0 }),
        ]);

        const overallProgress = progress.overall?.completionPercentage ?? 0;
        const status = mapStatusFromProgress(overallProgress);
        const quizAttempts = (attemptsResponse.data || []).map((attempt) =>
            mapTeacherAttemptToQuizAttempt(attempt, studentId)
        );

        const completedChapterCount = progress.overall?.chapters?.completed ?? 0;
        const completedChapters = Array.from(
            { length: completedChapterCount },
            (_, index) => `completed-chapter-${index + 1}`
        );

        return {
            id: progress.student.id,
            name: progress.student.name,
            email: progress.student.email,
            status,
            level: normalizeLevel(progress.level),
            currentChapterId: undefined,
            currentChapterTitle: undefined,
            overallProgress,
            lastActiveDate: progress.assessmentCompletedAt || new Date().toISOString(),
            streak: 0,
            completedChapters,
            chapterProgress: [],
            quizAttempts,
        };
    }

    // Admin endpoints
    async getAdminUsers(params: { search?: string; role?: string; isActive?: boolean; limit?: number; offset?: number } = {}): Promise<any> {
        return this.request<any>("/admin/users", { params });
    }

    async getAdminUser(userId: string): Promise<any> {
        return this.request<any>(`/admin/users/${userId}`);
    }

    async deactivateUser(userId: string): Promise<any> {
        return this.request<any>(`/admin/users/${userId}/deactivate`, {
            method: "PATCH",
        });
    }

    async reactivateUser(userId: string): Promise<any> {
        return this.request<any>(`/admin/users/${userId}/reactivate`, {
            method: "PATCH",
        });
    }

    async getAdminAnalyticsOverview(): Promise<any> {
        return this.request<any>("/admin/analytics/overview");
    }

    async getAdminAnalyticsChapterCompletion(): Promise<any> {
        return this.request<any>("/admin/analytics/chapter-completion");
    }

    async getAdminAnalyticsQuizStats(): Promise<any> {
        return this.request<any>("/admin/analytics/quiz-stats");
    }

    async getAdminAnalyticsWAU(): Promise<any> {
        return this.request<any>("/admin/analytics/wau");
    }

    async getAdminAnalyticsTeacherActivity(): Promise<any> {
        return this.request<any>("/admin/analytics/teacher-activity");
    }

    async getAdminAnalyticsSignups(): Promise<any> {
        return this.request<any>("/admin/analytics/signups");
    }

    // Feedback
    async submitFeedback(data: { category: string; subject: string; message: string; rating?: number }): Promise<{ id: string }> {
        const response = await this.request<{ success: boolean; data: { id: string } }>("/feedback", {
            method: "POST",
            data,
        });
        return response?.data || { id: "" };
    }

    async getMyFeedback(): Promise<any[]> {
        const response = await this.request<{ success: boolean; data: any[] }>("/feedback");
        return response?.data || [];
    }

    async getAllFeedback(params: { status?: string; category?: string; page?: number; limit?: number } = {}): Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
        const response = await this.request<{ success: boolean; data: any[]; pagination: any }>("/admin/feedback", { params });
        return { data: response?.data || [], pagination: response?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }

    async updateFeedback(id: string, data: { status?: string; adminReply?: string }): Promise<any> {
        const response = await this.request<{ success: boolean; data: any }>(`/admin/feedback/${id}`, {
            method: "PATCH",
            data,
        });
        return response?.data;
    }

    async getQuizAttemptCorrections(attemptId: string): Promise<{
        attemptId: string;
        quizTitle: string;
        chapterTitle: string;
        subjectName: string;
        score: number;
        corrections: {
            questionIndex: number;
            questionText: string;
            options: string[];
            userAnswer: number | null;
            correctAnswer: number;
            isCorrect: boolean;
            explanation: string | null;
            points: number;
        }[];
    }> {
        const response = await this.request<{ success: boolean; data: any }>(`/quiz-attempts/${attemptId}/corrections`);
        return response?.data;
    }
}

function mapStatusFromProgress(overallProgress: number): StudentStatus {
    if (overallProgress >= 75) return StudentStatus.ON_TRACK;
    if (overallProgress >= 40) return StudentStatus.BEHIND;
    return StudentStatus.AT_RISK;
}

function normalizeLevel(level: string): Level {
    if (level === Level.FOUNDATIONAL || level === Level.CORE || level === Level.ADVANCED) {
        return level;
    }
    return Level.FOUNDATIONAL;
}

function mapTeacherAttemptToQuizAttempt(
    attempt: TeacherStudentQuizAttemptApiItem,
    studentId: string
): QuizAttempt {
    const totalQuestions = attempt.quiz?.totalQuestions || 0;
    const percentage = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;

    return {
        id: attempt.attemptId,
        quizId: attempt.quiz?.id || "",
        userId: studentId,
        score: attempt.score,
        answers: [],
        percentage,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
    };
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL as string);
