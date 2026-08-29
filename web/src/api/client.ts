import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

class WebAPIClient {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;
        return Promise.reject(new Error(msg));
      },
    );
  }

  isLoggedIn() {
    return !!localStorage.getItem('admin_user');
  }

  getCurrentUserFromStorage() {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  }

  setUserInStorage(user: any) {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }

  clearUser() {
    localStorage.removeItem('admin_user');
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; data?: any; params?: any } = {},
  ): Promise<T> {
    const { method = 'GET', data, params } = options;
    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      method,
      data,
      params,
    });
    return response.data;
  }

  private unwrap<T = any>(res: any): T {
    return res?.data ?? res;
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<any>('/auth/sign-in/email', {
      method: 'POST',
      data: { email, password },
    });
    // Session cookie is set automatically by the server
    // Fetch user info after login
    const me = await this.getCurrentUser();
    this.setUserInStorage(me);
    return { ...res, user: me };
  }

  async logout() {
    try {
      await this.request<any>('/auth/sign-out', { method: 'POST' });
    } finally {
      this.clearUser();
    }
  }

  async getCurrentUser() {
    const res = await this.request<any>('/auth/me');
    const full = this.unwrap(res);
    // /auth/me returns { user, session } - extract just user
    return full?.user ?? full;
  }

  // Admin Users
  async getUsers(params?: {
    search?: string;
    role?: string;
    isActive?: string;
    limit?: number;
    offset?: number;
  }) {
    const res = await this.request<any>('/admin/users', { params });
    return res;
  }

  async getUser(userId: string) {
    const res = await this.request<any>(`/admin/users/${userId}`);
    return this.unwrap(res);
  }

  async deactivateUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async reactivateUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}/reactivate`, {
      method: 'PATCH',
    });
  }

  // Analytics
  async getAnalyticsOverview() {
    const res = await this.request<any>('/admin/analytics/overview');
    return this.unwrap(res);
  }

  async getChapterCompletion() {
    const res = await this.request<any>('/admin/analytics/chapter-completion');
    return this.unwrap(res);
  }

  async getQuizAnalytics() {
    const res = await this.request<any>('/admin/analytics/quiz-stats');
    return this.unwrap(res);
  }

  async getWAU() {
    const res = await this.request<any>('/admin/analytics/wau');
    return this.unwrap(res);
  }

  async getTeacherActivity() {
    const res = await this.request<any>('/admin/analytics/teacher-activity');
    return this.unwrap(res);
  }

  async getSignupTrend() {
    const res = await this.request<any>('/admin/analytics/signups');
    return this.unwrap(res);
  }

  // Role Upgrades
  async getPendingRoleUpgrades() {
    const res = await this.request<any>('/auth/pending-role-upgrades');
    return res;
  }

  // Feedback (admin)
  async getAllFeedback(params?: { status?: string; category?: string; page?: number; limit?: number }) {
    const res = await this.request<any>('/admin/feedback', { params });
    return res;
  }

  async updateFeedback(id: string, data: { status?: string; adminReply?: string }) {
    return this.request<any>(`/admin/feedback/${id}`, { method: 'PATCH', data });
  }

  async approveRoleUpgrade(userId: string) {
    return this.request<any>(`/auth/approve-role-upgrade/${userId}`, {
      method: 'POST',
    });
  }

  async rejectRoleUpgrade(userId: string) {
    return this.request<any>(`/auth/reject-role-upgrade/${userId}`, {
      method: 'POST',
    });
  }

  async getRoleUpgradeHistory() {
    return this.request<any>('/auth/role-upgrade-history');
  }

  // Subjects
  async getSubjects(params?: any) {
    const res = await this.request<any>('/subjects', {
      params: { ...params, includeChapters: true },
    });
    return this.unwrap(res);
  }

  async createSubject(data: {
    name: string;
    code: string;
    description?: string;
  }) {
    return this.request<any>('/subjects', { method: 'POST', data });
  }

  async updateSubject(id: string, data: any) {
    return this.request<any>(`/subjects/${id}`, { method: 'PUT', data });
  }

  async deleteSubject(id: string) {
    return this.request<any>(`/subjects/${id}`, { method: 'DELETE' });
  }

  // Chapters
  async getChapters(params?: any) {
    const res = await this.request<any>('/chapters', { params });
    return this.unwrap(res);
  }

  async getChapter(chapterId: string) {
    const res = await this.request<any>(`/chapters/${chapterId}`);
    return this.unwrap(res);
  }

  async createChapter(data: any) {
    return this.request<any>('/chapters', { method: 'POST', data });
  }

  async updateChapter(chapterId: string, data: any) {
    return this.request<any>(`/chapters/${chapterId}`, { method: 'PUT', data });
  }

  async deleteChapter(chapterId: string) {
    return this.request<any>(`/chapters/${chapterId}`, { method: 'DELETE' });
  }

  // Lessons
  async getSubjectChapterLessons(subjectId: string, chapterId: string) {
    const res = await this.request<any>(
      `/subjects/${subjectId}/chapters/${chapterId}/lessons`,
    );
    return this.unwrap(res);
  }

  async createLesson(subjectId: string, chapterId: string, data: any) {
    return this.request<any>(
      `/subjects/${subjectId}/chapters/${chapterId}/lessons`,
      { method: 'POST', data },
    );
  }

  async updateLesson(
    subjectId: string,
    chapterId: string,
    lessonId: string,
    data: any,
  ) {
    return this.request<any>(
      `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`,
      { method: 'PATCH', data },
    );
  }

  async deleteLesson(subjectId: string, chapterId: string, lessonId: string) {
    return this.request<any>(
      `/subjects/${subjectId}/chapters/${chapterId}/lessons/${lessonId}`,
      { method: 'DELETE' },
    );
  }

  // Quizzes
  async getChapterQuizzes(chapterId: string) {
    const res = await this.request<any>(`/chapters/${chapterId}/quizzes`, {
      params: { includeQuestions: true },
    });
    return this.unwrap(res);
  }

  async createQuiz(chapterId: string, data: any) {
    return this.request<any>(`/chapters/${chapterId}/quizzes`, {
      method: 'POST',
      data,
    });
  }

  async updateQuiz(quizId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}`, { method: 'PUT', data });
  }

  // Teacher - Students
  async getTeacherStudents(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const res = await this.request<any>('/teacher/students', { params });
    return res;
  }

  async getTeacherStudentProgress(studentId: string) {
    const res = await this.request<any>(
      `/teacher/students/${studentId}/progress`,
    );
    return res;
  }

  async getTeacherStudentQuizAttempts(
    studentId: string,
    params?: { subjectId?: string; chapterId?: string },
  ) {
    const res = await this.request<any>(
      `/teacher/students/${studentId}/quiz-attempts`,
      { params },
    );
    return res;
  }

  // Quiz Analytics
  async getQuizAttempts(
    quizId: string,
    params?: { limit?: number; offset?: number },
  ) {
    const res = await this.request<any>(`/quizzes/${quizId}/attempts`, {
      params,
    });
    return res;
  }

  async getSingleQuizStats(quizId: string) {
    const res = await this.request<any>(`/quizzes/${quizId}/stats`);
    return this.unwrap(res);
  }

  async deleteQuiz(quizId: string) {
    return this.request<any>(`/quizzes/${quizId}`, { method: 'DELETE' });
  }

  async addQuestion(quizId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      data,
    });
  }

  async updateQuestion(quizId: string, questionId: string, data: any) {
    return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      data,
    });
  }

  async deleteQuestion(quizId: string, questionId: string) {
    return this.request<any>(`/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
    });
  }

  // Assessments
  async getAssessments() {
    const res = await this.request<any>('/assessments');
    return this.unwrap(res);
  }

  async createAssessment(data: any) {
    return this.request<any>('/assessments', { method: 'POST', data });
  }

  async updateAssessment(id: string, data: any) {
    return this.request<any>(`/assessments/${id}`, { method: 'PUT', data });
  }

  async deleteAssessment(id: string) {
    return this.request<any>(`/assessments/${id}`, { method: 'DELETE' });
  }

  async addAssessmentQuestion(assessmentId: string, data: any) {
    return this.request<any>(`/assessments/${assessmentId}/questions`, {
      method: 'POST',
      data,
    });
  }

  async deleteAssessmentQuestion(assessmentId: string, questionId: string) {
    return this.request<any>(
      `/assessments/${assessmentId}/questions/${questionId}`,
      { method: 'DELETE' },
    );
  }

  // Auth - Email+Password (for web dashboard)
  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      data: { token, password },
    });
  }

  // Invite management (admin)
  async adminCreateUser(data: { email: string; name: string; role: string }) {
    return this.request<any>('/auth/admin/create-user', {
      method: 'POST',
      data,
    });
  }

  async getPendingInvites() {
    const res = await this.request<any>('/auth/admin/invites');
    return res;
  }

  async resendInvite(userId: string) {
    return this.request<any>('/auth/admin/resend-invite', {
      method: 'POST',
      data: { userId },
    });
  }

  async cancelInvite(userId: string) {
    return this.request<any>('/auth/admin/cancel-invite', {
      method: 'POST',
      data: { userId },
    });
  }

  // Set password (public - from invite link)
  async validateInviteToken(token: string) {
    const res = await this.request<any>(`/auth/invite/${token}`);
    return res;
  }

  async setPassword(token: string, password: string, profile?: { name?: string; school?: string; teacherSubjects?: string[] }) {
    return this.request<any>('/auth/set-password', {
      method: 'POST',
      data: { token, password, ...profile },
    });
  }

  // Exams
  async getExams(params?: { subjectId?: string; limit?: number; offset?: number }) {
    const res = await this.request<any>('/exams', { params });
    return res;
  }

  async getExam(examId: string) {
    const res = await this.request<any>(`/exams/${examId}`);
    return this.unwrap(res);
  }

  async createExam(data: any) {
    return this.request<any>('/exams', { method: 'POST', data });
  }

  async updateExam(examId: string, data: any) {
    return this.request<any>(`/exams/${examId}`, { method: 'PUT', data });
  }

  async togglePublishExam(examId: string) {
    return this.request<any>(`/exams/${examId}/publish`, { method: 'PATCH' });
  }

  async deleteExam(examId: string) {
    return this.request<any>(`/exams/${examId}`, { method: 'DELETE' });
  }

  async getExamAttempts(examId: string, params?: { limit?: number; offset?: number }) {
    const res = await this.request<any>(`/exams/${examId}/attempts`, { params });
    return res;
  }

  async getExamSubjects() {
    const res = await this.request<any>('/exams/subjects');
    return this.unwrap(res);
  }

  // AI Generation
  async generateExamQuestions(data: {
    prompt?: string;
    subjectId: string;
    chapterIds?: string[];
    count?: number;
    questionType?: 'MCQ' | 'STRUCTURAL' | 'MIXED';
  }) {
    const res = await this.request<any>('/exams/generate-questions', {
      method: 'POST',
      data,
    });
    return this.unwrap(res);
  }

  async generateQuizQuestions(data: {
    prompt?: string;
    chapterId: string;
    count?: number;
    questionType?: 'MCQ' | 'STRUCTURAL' | 'MIXED';
  }) {
    const res = await this.request<any>('/quizzes/generate-questions', {
      method: 'POST',
      data,
    });
    return this.unwrap(res);
  }

  // Exam corrections
  async getPendingCorrections(examId: string) {
    const res = await this.request<any>(`/exams/${examId}/pending-corrections`);
    return this.unwrap(res);
  }

  async correctExamAttempt(examId: string, data: {
    attemptId: string;
    corrections: { questionId: string; points: number; comment?: string }[];
    overallComment?: string;
  }) {
    const res = await this.request<any>(`/exams/${examId}/correct`, {
      method: 'POST',
      data,
    });
    return this.unwrap(res);
  }

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const res = await this.request<any>('/notifications', { params });
    return this.unwrap(res);
  }

  async getUnreadNotificationCount() {
    const res = await this.request<any>('/notifications/unread-count');
    return this.unwrap(res);
  }

  async markNotificationRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', { method: 'PATCH' });
  }

  // Chapters (for curriculum picker)
  async getChaptersBySubject(subjectId: string) {
    const res = await this.request<any>('/chapters', { params: { subjectId } });
    return this.unwrap(res);
  }
}

export const api = new WebAPIClient();
