import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants/api";
import {
    User,
    AuthResponse,
    AssessmentQuestion,
    AssessmentResult,
    DashboardData,
    Chapter,
    Quiz,
    QuizSubmission,
    QuizResult,
    QuizAttempt,
    QuizStats,
    Level,
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
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                let errorMessage = "Request failed";
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

    // Auth endpoints
    async signup(data: {
        name: string;
        email: string;
        password: string;
        image?: string;
        role?: string;
    }): Promise<AuthResponse> {
        // Always default to student role if not specified
        const signupData = {
            ...data,
            role: data.role || "student",
        };
        return this.request<AuthResponse>("/auth/sign-up/email", {
            method: "POST",
            data: signupData,
        });
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/sign-in/email", {
            method: "POST",
            data: { email, password },
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

    async verifyOTPLogin(email: string, otp: string): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/otp/verify", {
            method: "POST",
            data: { email, otp },
        });
    }

    // Session management endpoints
    async getSessions(): Promise<Array<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }>> {
        return this.request<Array<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }>>("/auth/sessions");
    }

    async revokeSession(sessionId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/sessions/revoke", {
            method: "POST",
            data: { sessionId },
        });
    }

    // Role upgrade endpoint
    async requestRoleUpgrade(): Promise<{ message: string; status: 'pending' | 'approved' | 'rejected' }> {
        return this.request<{ message: string; status: 'pending' | 'approved' | 'rejected' }>("/auth/request-role-upgrade", {
            method: "POST",
        });
    }

    // Assessment endpoints
    // Using dedicated assessment endpoints: /api/v1/assessment/*
    async startAssessment(): Promise<AssessmentQuestion[]> {
        // Start assessment and get questions
        // API returns: { success: true, data: { id, title, description, questionCount, questions: [...] } }
        const response = await this.request<{
            success: boolean;
            data: {
                id: string;
                title: string;
                description: string;
                questionCount: number;
                questions: Array<{
                    id: string;
                    questionText: string;
                    options: string[];
                    orderIndex: number;
                }>;
            };
        }>("/assessment/start");
        
        // Validate response structure
        if (!response?.data?.questions || !Array.isArray(response.data.questions)) {
            throw new Error("Invalid assessment response: questions array not found");
        }
        
        // Map API response format to AssessmentQuestion format
        return response.data.questions.map((q) => ({
            id: q.id,
            question: q.questionText || "", // Map questionText to question
            options: q.options || [],
            correctAnswer: -1, // Assessments don't have correct answers, use -1 as placeholder
            topic: "", // Not provided by API, use empty string
        }));
    }

    async submitAssessment(answers: number[]): Promise<AssessmentResult> {
        // Submit assessment answers
        // API expects: { answers: [0, 1, 2, 0, 1] } - array of answer indices
        const result = await this.request<AssessmentResult>("/assessment/submit", {
            method: "POST",
            data: { answers },
        });
        return result;
    }

    async getAssessmentResult(): Promise<AssessmentResult> {
        // Get assessment result after submission
        return this.request<AssessmentResult>("/assessment/result");
    }

    async getAssessmentStatus(): Promise<{ completed: boolean; level?: Level }> {
        // Check if assessment is completed
        return this.request<{ completed: boolean; level?: Level }>("/assessment/status");
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
        } catch (error) {
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
