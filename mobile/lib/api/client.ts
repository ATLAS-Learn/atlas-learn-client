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
    OverallProgressResponse,
    RoleUpgradeRequestPayload,
    RoleUpgradeRequestResponse,
    RoleUpgradeDecisionResponse,
    PendingRoleUpgradeRequest,
    TeacherDashboardData,
    StudentDetail,
} from "@/lib/types";

// API Client class using Axios
class APIClient {
    private axiosInstance: AxiosInstance;
    private token: string | null = null;

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

    private async request<T>(
        endpoint: string,
        options: {
            method?: "GET" | "POST" | "PUT" | "DELETE";
            data?: any;
            params?: any;
        } = {}
    ): Promise<T> {
        const { method = "GET", data, params } = options;
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

    // Auth endpoints
    async signUpWithOTP(data: {
        name: string;
        email: string;
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
        return this.request<User>("/auth/me");
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
    async getSessions(): Promise<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }[]> {
        return this.request<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }[]>("/auth/sessions");
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

    async getOverallProgress(): Promise<OverallProgressResponse> {
        const response = await this.request<OverallProgressResponse | { data?: OverallProgressResponse }>("/progress/overall");
        return this.unwrapData<OverallProgressResponse>(response);
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

    // Dashboard endpoints
    // NOTE: Server doesn't have a dashboard endpoint yet, so dashboard screen uses local stores
    // When server API is ready, implement: GET /api/dashboard
    // async getDashboard(): Promise<DashboardData> {
    //     return this.request<DashboardData>("/dashboard");
    // }

    // Chapter endpoints
    async getChapters(): Promise<Chapter[]> {
        // Get all chapters
        return this.request<Chapter[]>(`/chapters`);
    }

    async getChapter(chapterId: string): Promise<Chapter> {
        return this.request<Chapter>(`/chapters/${chapterId}`);
    }

    // Chapter Quiz endpoints
    async getChapterQuizzes(chapterId: string): Promise<Quiz[]> {
        // Get all quizzes for a chapter
        return this.request<Quiz[]>(`/chapters/${chapterId}/quizzes`);
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

    // Teacher Dashboard endpoints
    async getTeacherDashboard(): Promise<TeacherDashboardData> {
        return this.request<TeacherDashboardData>("/teacher/dashboard");
    }

    async getStudentDetail(studentId: string): Promise<StudentDetail> {
        return this.request<StudentDetail>(`/teacher/students/${studentId}`);
    }
}

// Export singleton instance
export const apiClient = new APIClient(API_BASE_URL || "http://localhost:3000/api/v1");
