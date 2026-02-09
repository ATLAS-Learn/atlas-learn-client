import { API_BASE_URL, ASSESSMENT_QUIZ_ID } from "@/lib/constants/api";
import {
    User,
    AuthResponse,
    AssessmentQuestion,
    AssessmentSubmission,
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

// API Client class
class APIClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    setToken(token: string | null) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`[API] ${options.method || 'GET'} ${url}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            let errorMessage = "Request failed";
            try {
                const error = await response.json();
                errorMessage = error.message || error.error || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            console.error(`API Error [${response.status}]:`, url, errorMessage);
            throw new Error(errorMessage);
        }

        return response.json();
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
            body: JSON.stringify(signupData),
        });
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/sign-in/email", {
            method: "POST",
            body: JSON.stringify({ email, password }),
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
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(token: string, password: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, password }),
        });
    }

    async verifyEmail(code: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/verify-email", {
            method: "POST",
            body: JSON.stringify({ code }),
        });
    }

    async resendVerification(): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/resend-verification", {
            method: "POST",
        });
    }

    // OTP Login endpoints
    async requestOTP(email: string): Promise<{ message: string }> {
        return this.request<{ message: string }>("/auth/request-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
    }

    async verifyOTPLogin(email: string, otp: string): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/verify-otp-login", {
            method: "POST",
            body: JSON.stringify({ email, otp }),
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
        return this.request<AssessmentQuestion[]>("/assessment/start");
    }

    async submitAssessment(submission: AssessmentSubmission): Promise<AssessmentResult> {
        // Submit assessment answers
        const result = await this.request<AssessmentResult>("/assessment/submit", {
            method: "POST",
            body: JSON.stringify(submission),
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
            body: JSON.stringify(quizData),
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
            body: JSON.stringify(quizData),
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
            body: JSON.stringify(questionData),
        });
    }

    async updateQuizQuestion(quizId: string, questionId: string, questionData: any): Promise<any> {
        return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, {
            method: "PUT",
            body: JSON.stringify(questionData),
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
            body: JSON.stringify(submission),
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
export const apiClient = new APIClient(API_BASE_URL);
