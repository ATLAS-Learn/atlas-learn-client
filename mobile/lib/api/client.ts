import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants/api";
import {
    User,
    AuthResponse,
    AssessmentQuestion,
    AssessmentResult,
    Chapter,
    Quiz,
    QuizSubmission,
    QuizResult,
    QuizAttempt,
    QuizStats,
    Level,
    OverallProgressData,
    Subject,
    CreateSubjectPayload,
    UpdateSubjectPayload,
    SubjectQueryOptions,
    SubjectChaptersQueryOptions,
    SubjectChapterQueryOptions,
    SubjectChapterQuizzesQueryOptions,
    SubjectChapter,
    CreateSubjectChapterPayload,
    UpdateSubjectChapterPayload,
    SubjectStats,
    SubjectChapterProgress,
    SubjectChapterUnlockResponse,
    SubjectExamHint,
    Lesson,
    CreateLessonPayload,
    UpdateLessonPayload,
    LessonProgressUpdatePayload,
    LessonCompletionResponse,
    LessonWithProgress,
    LessonPdfMaterial,
    ChapterPdfMaterial,
    ChapterLesson,
    ChapterProgressData,
    ChapterUnlockResponse,
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
            timeout: 15000,
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

    private buildSubjectQueryParams(options: SubjectQueryOptions = {}) {
        const includeChapters = options.includeChapters === true;
        const includeChapterDetails = includeChapters && options.includeChapterDetails === true;
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

    private buildSubjectChapterQuizzesQueryParams(options: SubjectChapterQuizzesQueryOptions = {}) {
        const params: Record<string, string> = {};
        if (options.includeQuestions) {
            params.includeQuestions = "true";
        }
        if (options.includeAttempts) {
            params.includeAttempts = "true";
        }
        return Object.keys(params).length ? params : undefined;
    }

    private traceIdOrigin(context: string, payload: Record<string, unknown>) {
        console.log(`[ID_TRACE] ${context}`, payload);
    }

    // Auth endpoints
    async signUpWithOTP(data: {
        name: string;
        email: string;
        username?: string;
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
        const response = await this.request<{ sessions?: { id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[] }>("/auth/sessions");
        return response?.sessions ?? [];
    }

    async revokeSession(sessionId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/sessions/revoke", {
            method: "POST",
            data: { sessionId },
        });
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
        this.traceIdOrigin("getSubjectById", { subjectId, options });
        const response = await this.request<
            Subject | { success?: boolean; message?: string; data?: Subject }
        >(
            `/subjects/${subjectId}`,
            {
                params: this.buildSubjectQueryParams(options),
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
                params: this.buildSubjectQueryParams(options),
            }
        );
        return this.unwrapData<Subject>(response);
    }

    async getSubjectChapters(
        subjectId: string,
        options: SubjectChaptersQueryOptions = {}
    ): Promise<SubjectChapter[]> {
        this.traceIdOrigin("getSubjectChapters", { subjectId, options });
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
        this.traceIdOrigin("getSubjectChapter", { subjectId, chapterId, options });
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

    async getSubjectChapterQuizzes(
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
        lessonId: string
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

    async unlockChapter(chapterId: string): Promise<ChapterUnlockResponse> {
        return this.request<ChapterUnlockResponse>(`/chapters/${chapterId}/progress/unlock`, {
            method: "POST",
        });
    }

    async getChapterExamHints(chapterId: string): Promise<ChapterExamHint[]> {
        const response = await this.request<ChapterExamHint[] | { success?: boolean; data?: ChapterExamHint[] }>(
            `/chapters/${chapterId}/exam-hints`
        );
        const hints = this.unwrapData<ChapterExamHint[]>(response);
        return Array.isArray(hints) ? hints : [];
    }

    async getChapterQuiz(chapterId: string): Promise<Quiz> {
        // Get the first quiz for a chapter (for backward compatibility)
        const quizzes = await this.getChapterQuizzes(chapterId);
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
        // Get statistics for a quiz
        return this.request<QuizStats>(`/quizzes/${quizId}/stats`);
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

    // Exams
    async getExams(params?: { subjectId?: string }): Promise<any[]> {
        const res = await this.axiosInstance.get("/exams", { params });
        return res.data?.data || [];
    }

    async getExam(examId: string): Promise<any> {
        const res = await this.axiosInstance.get(`/exams/${examId}`);
        return res.data?.data;
    }

    async submitExam(examId: string, data: { answers: number[]; textAnswers?: Record<string, string>; timeSpent?: number }): Promise<any> {
        const res = await this.axiosInstance.post(`/exams/${examId}/submit`, data);
        return res.data?.data;
    }

    async getExamResult(examId: string): Promise<any> {
        const res = await this.axiosInstance.get(`/exams/${examId}/result`);
        return res.data?.data;
    }

    async getExamSubjects(): Promise<any[]> {
        const res = await this.axiosInstance.get("/exams/subjects");
        return res.data?.data || [];
    }

    async getUserExamHistory(): Promise<any[]> {
        const res = await this.axiosInstance.get("/exams/my-history");
        return res.data?.data || [];
    }

    async getLeaderboard(): Promise<any[]> {
        const res = await this.axiosInstance.get("/leaderboard");
        return res.data?.data || [];
    }

    // Notification endpoints
    async getNotifications(params?: { unreadOnly?: boolean }): Promise<any[]> {
        const res = await this.axiosInstance.get("/notifications", { params });
        return res.data?.data || [];
    }

    async getUnreadNotificationCount(): Promise<number> {
        const res = await this.axiosInstance.get("/notifications/unread-count");
        return res.data?.data?.count ?? 0;
    }

    async markNotificationRead(notificationId: string): Promise<void> {
        await this.axiosInstance.patch(`/notifications/${notificationId}/read`);
    }

    async markAllNotificationsRead(): Promise<void> {
        await this.axiosInstance.patch("/notifications/read-all");
    }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL as string);
