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
    Quiz,
    QuizSubmission,
    QuizResult,
    QuizAttempt,
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
    UpdateProfilePayload,
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
    LessonPdfMaterial,
    ChapterPdfMaterial,
    ChapterLesson,
    ChapterProgressData,
    ChapterUnlockResponse,
    ChapterExamHint,
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

    async updateCurrentUserProfile(data: UpdateProfilePayload): Promise<User> {
        const response = await this.request<User | { success?: boolean; data?: User }>("/auth/me", {
            method: "PUT",
            data,
        });
        return this.unwrapData<User>(response);
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/forgot-password", {
            method: "POST",
            data: { email },
        });
    }

    async resetPassword(token: string, password: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/reset-password", {
            method: "POST",
            data: { token, password },
        });
    }

    async verifyEmail(code: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/verify-email", {
            method: "POST",
            data: { code },
        });
    }

    async resendVerification(): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/resend-verification", {
            method: "POST",
        });
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
        const response = await this.request<
            PendingRoleUpgradeRequest[] | { data?: PendingRoleUpgradeRequest[] }
        >("/auth/pending-role-upgrades");
        if (Array.isArray(response)) {
            return response;
        }
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
                }[];
            };
        }>("/assessment/start");
        
        // Validate response structure to prevent runtime errors
        if (!response?.data?.questions || !Array.isArray(response.data.questions)) {
            throw new Error("Invalid assessment response: questions array not found");
        }
        
        // Map API response format to AssessmentQuestion format
        // API uses 'questionText' but our types expect 'question'
        return response.data.questions.map((q) => ({
            id: q.id,
            question: q.questionText || "", // Map questionText to question
            options: q.options || [],
            correctAnswer: -1, // Assessments don't have correct answers, use -1 as placeholder
            topic: "", // Not provided by API, use empty string
        }));
    }

    /**
     * Submit assessment answers
     * @param answers Array of answer indices in question order (e.g., [0, 1, 2, 0, 1])
     * @returns Assessment result with score, level, and message
     */
    async submitAssessment(answers: number[]): Promise<AssessmentResult> {
        // API expects: { answers: [0, 1, 2, 0, 1] } - array of answer indices
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
                recommendedChapter?: unknown;
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
        };
    }

    async getAssessmentResult(): Promise<AssessmentResult> {
        // Get assessment result after submission
        return this.request<AssessmentResult>("/assessment/result");
    }

    async getAssessmentStatus(): Promise<{ completed: boolean; level?: Level }> {
        // Check if assessment is completed
        return this.request<{ completed: boolean; level?: Level }>("/assessment/status");
    }

    async getOverallProgress(): Promise<OverallProgressData> {
        const response = await this.request<
            OverallProgressData | { success?: boolean; data?: OverallProgressData }
        >("/progress/overall");
        return this.unwrapData<OverallProgressData>(response);
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
            `/subjects/${subjectId}/chapters/${chapterId}`,
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
            `/subjects/${subjectId}/chapters/${chapterId}`,
            {
                method: "PUT",
                data,
            }
        );
        return this.unwrapData<SubjectChapter>(response);
    }

    async deleteSubjectChapter(subjectId: string, chapterId: string): Promise<void> {
        await this.request<void | { message?: string }>(`/subjects/${subjectId}/chapters/${chapterId}`, {
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
            `/subjects/${subjectId}/chapters/${chapterId}/quizzes`,
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
        >(`/subjects/${subjectId}/chapters/${chapterId}/progress`);
        return this.unwrapData<SubjectChapterProgress>(response);
    }

    async unlockSubjectChapter(subjectId: string, chapterId: string): Promise<SubjectChapterUnlockResponse> {
        return this.request<SubjectChapterUnlockResponse>(
            `/subjects/${subjectId}/chapters/${chapterId}/progress/unlock`,
            {
                method: "POST",
            }
        );
    }

    async getSubjectChapterExamHints(subjectId: string, chapterId: string): Promise<SubjectExamHint[]> {
        this.traceIdOrigin("getSubjectChapterExamHints", { subjectId, chapterId });
        const response = await this.request<SubjectExamHint[] | { success?: boolean; data?: SubjectExamHint[] }>(
            `/subjects/${subjectId}/chapters/${chapterId}/exam-hints`
        );
        const hints = this.unwrapData<SubjectExamHint[]>(response);
        return Array.isArray(hints) ? hints : [];
    }

    // Lesson endpoints (subject chapter)
    async getSubjectChapterLessons(subjectId: string, chapterId: string): Promise<Lesson[]> {
        this.traceIdOrigin("getSubjectChapterLessons", { subjectId, chapterId });
        const response = await this.request<Lesson[] | { success?: boolean; data?: Lesson[] }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons`
        );
        const lessons = this.unwrapData<Lesson[]>(response);
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

    async getSubjectChapterLesson(subjectId: string, chapterId: string, lessonId: string): Promise<Lesson> {
        const response = await this.request<Lesson | { success?: boolean; data?: Lesson }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`
        );
        return this.unwrapData<Lesson>(response);
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
        try {
            return await this.request<LessonCompletionResponse>(
                `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}/complete`,
                {
                    method: "POST",
                }
            );
        } catch (error) {
            if (!this.shouldFallbackFromSubjectScopedError(error)) {
                throw error;
            }
            // Fallback for deployments where lesson completion is chapter-scoped only.
            return this.request<LessonCompletionResponse>(
                `/chapters/${chapterId}/lessons/${lessonId}/complete`,
                {
                    method: "POST",
                }
            );
        }
    }

    async updateSubjectChapterLessonProgress(
        subjectId: string,
        chapterId: string,
        lessonId: string,
        data: LessonProgressUpdatePayload
    ): Promise<LessonCompletionResponse> {
        try {
            return await this.request<LessonCompletionResponse>(
                `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}/progress`,
                {
                    method: "POST",
                    data,
                }
            );
        } catch (error) {
            if (!this.shouldFallbackFromSubjectScopedError(error)) {
                throw error;
            }
            // Fallback for deployments where lesson progress is chapter-scoped only.
            return this.request<LessonCompletionResponse>(
                `/chapters/${chapterId}/lessons/${lessonId}/progress`,
                {
                    method: "POST",
                    data,
                }
            );
        }
    }

    async getSubjectChapterLessonPdf(
        subjectId: string,
        chapterId: string,
        lessonId: string
    ): Promise<LessonPdfMaterial> {
        const response = await this.request<LessonPdfMaterial | { success?: boolean; data?: LessonPdfMaterial }>(
            `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}/pdf`
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
        return this.request<Chapter>(`/chapters/${chapterId}`);
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

    async getChapterLessons(chapterId: string): Promise<ChapterLesson[]> {
        const response = await this.request<ChapterLesson[] | { success?: boolean; data?: ChapterLesson[] }>(
            `/chapters/${chapterId}/lessons`
        );
        const lessons = this.unwrapData<ChapterLesson[]>(response);
        return Array.isArray(lessons) ? this.dedupeById(lessons) : [];
    }

    // Chapter Quiz endpoints
    async getChapterQuizzes(chapterId: string): Promise<Quiz[]> {
        // Get all quizzes for a chapter
        return this.request<Quiz[]>(`/chapters/${chapterId}/quizzes`);
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
    async getQuizzes(limit: number = 5): Promise<Quiz[]> {
        // Try with limit parameter first, fallback to no parameter
        try {
            return await this.request<Quiz[]>(`/quizzes?limit=${limit}`);
        } catch {
            // If query parameter fails, try without it
            const allQuizzes = await this.request<Quiz[]>(`/quizzes`);
            return allQuizzes.slice(0, limit);
        }
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
        return this.request<QuizResult>(`/quizzes/${quizId}/submit`, {
            method: "POST",
            data: submission,
        });
    }

    async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
        // Get all attempts for a quiz
        return this.request<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
    }

    async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
        // Get all quiz attempts by a user
        return this.request<QuizAttempt[]>(`/users/${userId}/quiz-attempts`);
    }

    async getQuizStats(quizId: string): Promise<QuizStats> {
        // Get statistics for a quiz
        return this.request<QuizStats>(`/quizzes/${quizId}/stats`);
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
        percentage,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
    };
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL || "http://localhost:3000/api/v1");
