import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://atlas-learn-server.onrender.com/api/v1";

class WebAPIClient {
  private axiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const msg = error.response?.data?.message || error.response?.data?.error || error.message;
        return Promise.reject(new Error(msg));
      }
    );

    const saved = localStorage.getItem("admin_token");
    if (saved) this.setToken(saved);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("admin_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("admin_token");
  }

  isLoggedIn() {
    return !!this.token;
  }

  private async request<T>(endpoint: string, options: { method?: string; data?: any; params?: any } = {}): Promise<T> {
    const { method = "GET", data, params } = options;
    const response = await this.axiosInstance.request<T>({ url: endpoint, method, data, params });
    return response.data;
  }

  private unwrap<T>(res: any): T {
    return res?.data ?? res;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<any>("/auth/sign-in/email", { method: "POST", data: { email, password } });
    const token = res?.token || res?.data?.token || res?.session?.token;
    if (token) this.setToken(token);
    return res;
  }

  async getCurrentUser() {
    const res = await this.request<any>("/auth/me");
    return this.unwrap(res);
  }

  // Admin Users
  async getUsers(params?: { search?: string; role?: string; isActive?: string; limit?: number; offset?: number }) {
    const res = await this.request<any>("/admin/users", { params });
    return res;
  }

  async getUser(userId: string) {
    const res = await this.request<any>(`/admin/users/${userId}`);
    return this.unwrap(res);
  }

  async deactivateUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}/deactivate`, { method: "PATCH" });
  }

  async reactivateUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}/reactivate`, { method: "PATCH" });
  }

  // Analytics
  async getAnalyticsOverview() {
    const res = await this.request<any>("/admin/analytics/overview");
    return this.unwrap(res);
  }

  async getChapterCompletion() {
    const res = await this.request<any>("/admin/analytics/chapter-completion");
    return this.unwrap(res);
  }

  async getQuizStats() {
    const res = await this.request<any>("/admin/analytics/quiz-stats");
    return this.unwrap(res);
  }

  async getWAU() {
    const res = await this.request<any>("/admin/analytics/wau");
    return this.unwrap(res);
  }

  async getTeacherActivity() {
    const res = await this.request<any>("/admin/analytics/teacher-activity");
    return this.unwrap(res);
  }

  async getSignupTrend() {
    const res = await this.request<any>("/admin/analytics/signups");
    return this.unwrap(res);
  }

  // Role Upgrades
  async getPendingRoleUpgrades() {
    const res = await this.request<any>("/auth/pending-role-upgrades");
    return res;
  }

  async approveRoleUpgrade(userId: string) {
    return this.request<any>(`/auth/approve-role-upgrade/${userId}`, { method: "POST" });
  }

  async rejectRoleUpgrade(userId: string) {
    return this.request<any>(`/auth/reject-role-upgrade/${userId}`, { method: "POST" });
  }

  // Subjects
  async getSubjects(params?: any) {
    const res = await this.request<any>("/subjects", { params: { ...params, includeChapters: true } });
    return this.unwrap(res);
  }

  async createSubject(data: { name: string; code: string; description?: string }) {
    return this.request<any>("/subjects", { method: "POST", data });
  }

  async updateSubject(id: string, data: any) {
    return this.request<any>(`/subjects/${id}`, { method: "PUT", data });
  }

  async deleteSubject(id: string) {
    return this.request<any>(`/subjects/${id}`, { method: "DELETE" });
  }

  // Chapters
  async getChapters(params?: any) {
    const res = await this.request<any>("/chapters", { params });
    return this.unwrap(res);
  }

  async getChapter(chapterId: string) {
    const res = await this.request<any>(`/chapters/${chapterId}`);
    return this.unwrap(res);
  }

  async createChapter(data: any) {
    return this.request<any>("/chapters", { method: "POST", data });
  }

  async updateChapter(chapterId: string, data: any) {
    return this.request<any>(`/chapters/${chapterId}`, { method: "PUT", data });
  }

  async deleteChapter(chapterId: string) {
    return this.request<any>(`/chapters/${chapterId}`, { method: "DELETE" });
  }

  // Lessons
  async getSubjectChapterLessons(subjectId: string, chapterId: string) {
    const res = await this.request<any>(`/subjects/${subjectId}/chapters/${chapterId}/lessons`);
    return this.unwrap(res);
  }

  async createLesson(subjectId: string, chapterId: string, data: any) {
    return this.request<any>(`/subjects/${subjectId}/chapters/${chapterId}/lessons`, { method: "POST", data });
  }

  async updateLesson(subjectId: string, chapterId: string, lessonId: string, data: any) {
    return this.request<any>(`/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`, { method: "PATCH", data });
  }

  async deleteLesson(subjectId: string, chapterId: string, lessonId: string) {
    return this.request<any>(`/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`, { method: "DELETE" });
  }

  // Quizzes
  async getChapterQuizzes(chapterId: string) {
    const res = await this.request<any>(`/chapters/${chapterId}/quizzes`);
    return this.unwrap(res);
  }

  async createQuiz(chapterId: string, data: any) {
    return this.request<any>(`/chapters/${chapterId}/quizzes`, { method: "POST", data });
  }

  async updateQuiz(quizId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}`, { method: "PUT", data });
  }

  // Teacher - Students
  async getTeacherStudents(params?: { search?: string; limit?: number; offset?: number }) {
    const res = await this.request<any>("/teacher/students", { params });
    return res;
  }

  async getTeacherStudentProgress(studentId: string) {
    const res = await this.request<any>(`/teacher/students/${studentId}/progress`);
    return res;
  }

  async getTeacherStudentQuizAttempts(studentId: string, params?: { subjectId?: string; chapterId?: string }) {
    const res = await this.request<any>(`/teacher/students/${studentId}/quiz-attempts`, { params });
    return res;
  }

  // Quiz Analytics
  async getQuizAttempts(quizId: string, params?: { limit?: number; offset?: number }) {
    const res = await this.request<any>(`/quizzes/${quizId}/attempts`, { params });
    return res;
  }

  async getQuizStats(quizId: string) {
    const res = await this.request<any>(`/quizzes/${quizId}/stats`);
    return this.unwrap(res);
  }

  async deleteQuiz(quizId: string) {
    return this.request<any>(`/quizzes/${quizId}`, { method: "DELETE" });
  }

  async addQuestion(quizId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}/questions`, { method: "POST", data });
  }

  async updateQuestion(quizId: string, questionId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, { method: "PUT", data });
  }

  async deleteQuestion(quizId: string, questionId: string) {
    return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, { method: "DELETE" });
  }

  // Assessments
  async getAssessments() {
    const res = await this.request<any>("/assessments");
    return this.unwrap(res);
  }

  async createAssessment(data: any) {
    return this.request<any>("/assessments", { method: "POST", data });
  }

  async updateAssessment(id: string, data: any) {
    return this.request<any>(`/assessments/${id}`, { method: "PUT", data });
  }

  async deleteAssessment(id: string) {
    return this.request<any>(`/assessments/${id}`, { method: "DELETE" });
  }

  async addAssessmentQuestion(assessmentId: string, data: any) {
    return this.request<any>(`/assessments/${assessmentId}/questions`, { method: "POST", data });
  }

  async deleteAssessmentQuestion(assessmentId: string, questionId: string) {
    return this.request<any>(`/assessments/${assessmentId}/questions/${questionId}`, { method: "DELETE" });
  }
}

export const api = new WebAPIClient();
