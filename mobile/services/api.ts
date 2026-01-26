import { API_BASE_URL, ASSESSMENT_QUIZ_ID } from "@/constants/api";
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
    Level,
    TeacherDashboardData,
    StudentDetail,
} from "./types";

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
    }): Promise<AuthResponse> {
        return this.request<AuthResponse>("/auth/sign-up/email", {
            method: "POST",
            body: JSON.stringify(data),
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

    // Assessment endpoints
    // The assessment is implemented as a special quiz using the quiz endpoints
    // 
    // Structure (matches database schema):
    // - Assessment is a Quiz type with id="assessment-quiz", chapterId="", questions, passingScore
    // - Questions are QuizQuestion[] with explanation field (maps to topic in AssessmentQuestion)
    // - Determines User.level (FOUNDATIONAL, CORE, or ADVANCED) based on score
    async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
        // Fetch assessment quiz from server
        const quiz = await this.getQuiz(ASSESSMENT_QUIZ_ID);
        // Convert QuizQuestion[] to AssessmentQuestion[]
        return quiz.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            topic: q.explanation || "General",
        }));
    }

    async submitAssessment(submission: AssessmentSubmission): Promise<AssessmentResult> {
        // Submit assessment as a quiz submission
        const quizSubmission: QuizSubmission = { answers: submission.answers };
        const quizResult = await this.submitQuiz(ASSESSMENT_QUIZ_ID, quizSubmission);
        
        // Fetch updated user to get the level assigned by the server
        const updatedUser = await this.getCurrentUser();
        
        // Build assessment result from quiz result
        const level = updatedUser.level || Level.FOUNDATIONAL;
        const percentage = quizResult.percentage;
        
        return {
            score: quizResult.score,
            totalQuestions: quizResult.totalQuestions,
            level,
            message: percentage >= 80
                ? `Great! You scored ${percentage.toFixed(0)}%. We'll start you with ${level} concepts.`
                : `You scored ${percentage.toFixed(0)}%. We'll start you with ${level} concepts to strengthen your foundation.`,
        };
    }

    // Dashboard endpoints
    // NOTE: Server doesn't have a dashboard endpoint yet, so dashboard screen uses local stores
    // When server API is ready, implement: GET /api/dashboard
    // async getDashboard(): Promise<DashboardData> {
    //     return this.request<DashboardData>("/dashboard");
    // }

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

    async submitQuiz(quizId: string, submission: QuizSubmission): Promise<QuizResult> {
        return this.request<QuizResult>(`/quizzes/${quizId}/submit`, {
            method: "POST",
            body: JSON.stringify(submission),
        });
    }

    // Chapter endpoints
    async getChapter(chapterId: string): Promise<Chapter> {
        return this.request<Chapter>(`/chapters/${chapterId}`);
    }

    async getChapterQuiz(chapterId: string): Promise<Quiz> {
        return this.request<Quiz>(`/chapters/${chapterId}/quiz`);
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

