import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

type RequestOptions = {
  method?: string;
  data?: any;
  params?: any;
  cache?: boolean;
  cacheTtlMs?: number;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

export type AIGradeProposal = {
  questionId: string;
  points: number;
  comment?: string;
  confidence?: number;
  rationale?: string;
};

export type SubjectReport = {
  subjectId: string;
  subjectName: string;
  quizCount?: number;
  examCount?: number;
  attemptCount?: number;
  averageScore?: number;
  passRate?: number;
  pendingEssayReviews?: number;
  quizzes?: Array<{ id: string; title: string; averageScore?: number; passRate?: number; pendingEssayReviews?: number }>;
  exams?: Array<{ id: string; title: string; averageScore?: number; passRate?: number; pendingEssayReviews?: number }>;
};

class WebAPIClient {
  private axiosInstance;
  private readonly getCache = new Map<string, CacheEntry>();

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
    this.clearCache();
  }

  clearCache() {
    this.getCache.clear();
  }

  private cacheKey(endpoint: string, params?: any) {
    if (!params) return endpoint;
    const normalized = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${endpoint}?${JSON.stringify(normalized)}`;
  }

  private defaultCacheTtl(endpoint: string) {
    if (
      endpoint.includes('/analytics/') ||
      endpoint.includes('/stats') ||
      endpoint.includes('/wau') ||
      endpoint.includes('/activity') ||
      endpoint.includes('/signups') ||
      endpoint.includes('/attempts')
    ) {
      return 30_000;
    }
    return 10 * 60_000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', data, params } = options;
    const useCache = method.toUpperCase() === 'GET' && options.cache !== false;
    const key = this.cacheKey(endpoint, params);

    if (useCache) {
      const cached = this.getCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value as T;
      }
      if (cached) this.getCache.delete(key);
    }

    const response = await this.axiosInstance.request<T>({
      url: endpoint,
      method,
      data,
      params,
    });
    if (useCache) {
      this.getCache.set(key, {
        value: response.data,
        expiresAt: Date.now() + (options.cacheTtlMs ?? this.defaultCacheTtl(endpoint)),
      });
    } else if (method.toUpperCase() !== 'GET') {
      this.clearCache();
    }
    return response.data;
  }

  private unwrap<T = any>(res: any): T {
    return res?.data ?? res;
  }

  // Auth
  async login(email: string, password: string) {
    this.clearCache();
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
    const res = await this.request<any>('/auth/me', { cache: false });
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

  async getAdminStudentStats() {
    const [all, active, inactive] = await Promise.all([
      this.getUsers({ role: 'student', limit: 1, offset: 0 }),
      this.getUsers({ role: 'student', isActive: 'true', limit: 1, offset: 0 }),
      this.getUsers({ role: 'student', isActive: 'false', limit: 1, offset: 0 }),
    ]);
    const totalOf = (result: any) =>
      Number(
        result?.total ??
        result?.meta?.total ??
        result?.pagination?.total ??
        result?.data?.total ??
        0,
      );
    return {
      total: totalOf(all),
      active: totalOf(active),
      inactive: totalOf(inactive),
    };
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
      params,
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

  async getQuiz(quizId: string) {
    const res = await this.request<any>(`/quizzes/${quizId}`, {
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

  async getPendingQuizCorrections(quizId: string) {
    const res = await this.request<any>(`/quizzes/${quizId}/pending-corrections`);
    return this.unwrap(res);
  }

  async correctQuizAttempt(quizId: string, data: {
    attemptId: string;
    corrections: { questionId: string; points: number; comment?: string }[];
    overallComment?: string;
  }) {
    const res = await this.request<any>(`/quizzes/${quizId}/correct`, {
      method: 'POST',
      data,
    });
    return this.unwrap(res);
  }

  async requestQuizAIGrade(quizId: string, attemptId: string) {
    const res = await this.request<any>(`/quizzes/${quizId}/ai-correct`, {
      method: 'POST',
      data: { attemptId },
    });
    return this.unwrap<{ corrections: AIGradeProposal[]; overallComment?: string }>(res);
  }

  async rejectQuizAIGrade(quizId: string, attemptId: string) {
    return this.request<any>(`/quizzes/${quizId}/ai-correct/reject`, {
      method: 'POST',
      data: { attemptId },
    });
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
  async adminCreateUser(data: { email: string; name?: string; role: string }) {
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

  async getSchools() {
    const res = await this.request<any>('/schools');
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

  async requestExamAIGrade(examId: string, attemptId: string) {
    const res = await this.request<any>(`/exams/${examId}/ai-correct`, {
      method: 'POST',
      data: { attemptId },
    });
    return this.unwrap<{ corrections: AIGradeProposal[]; overallComment?: string }>(res);
  }

  async rejectExamAIGrade(examId: string, attemptId: string) {
    return this.request<any>(`/exams/${examId}/ai-correct/reject`, {
      method: 'POST',
      data: { attemptId },
    });
  }

  async getSubjectReports() {
    const res = await this.request<any>('/admin/analytics/subject-reports');
    return this.unwrap<SubjectReport[]>(res);
  }

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const res = await this.request<any>('/notifications', {
      params,
      cacheTtlMs: 30_000,
    });
    return this.unwrap(res);
  }

  async getUnreadNotificationCount() {
    const res = await this.request<any>('/notifications/unread-count', {
      cacheTtlMs: 30_000,
    });
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

  // ─── Superadmin ────────────────────────────────────────────────

  // Superadmin Analytics
  async getSuperadminOverview() {
    const res = await this.request<any>('/superadmin/analytics/overview');
    return this.unwrap(res);
  }

  async getSuperadminChapterCompletion() {
    const res = await this.request<any>('/superadmin/analytics/chapter-completion');
    return this.unwrap(res);
  }

  async getSuperadminQuizStats() {
    const res = await this.request<any>('/superadmin/analytics/quiz-stats');
    return this.unwrap(res);
  }

  async getSuperadminWAU() {
    const res = await this.request<any>('/superadmin/analytics/wau');
    return this.unwrap(res);
  }

  async getSuperadminTeacherActivity() {
    const res = await this.request<any>('/superadmin/analytics/teacher-activity');
    return this.unwrap(res);
  }

  async getSuperadminSignupTrend() {
    const res = await this.request<any>('/superadmin/analytics/signups');
    return this.unwrap(res);
  }

  // Superadmin Users
  async getSuperadminUsers(params?: {
    search?: string;
    role?: string;
    isActive?: string;
    school?: string;
    limit?: number;
    offset?: number;
  }) {
    const res = await this.request<any>('/superadmin/users', { params });
    return res;
  }

  async getSuperadminUser(userId: string) {
    const res = await this.request<any>(`/superadmin/users/${userId}`);
    return this.unwrap(res);
  }

  async changeUserRole(userId: string, role: string) {
    return this.request<any>(`/superadmin/users/${userId}/role`, {
      method: 'PATCH',
      data: { role },
    });
  }

  async superadminDeactivateUser(userId: string) {
    return this.request<any>(`/superadmin/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async superadminReactivateUser(userId: string) {
    return this.request<any>(`/superadmin/users/${userId}/reactivate`, {
      method: 'PATCH',
    });
  }

  // Superadmin Schools
  async getSuperadminSchools(params?: { search?: string }) {
    const res = await this.request<any>('/superadmin/schools', {
      params,
      cacheTtlMs: 30_000,
    });
    return res;
  }

  async createSchool(data: { name: string }) {
    return this.request<any>('/superadmin/schools', { method: 'POST', data });
  }

  async updateSchool(schoolId: string, data: { name: string }) {
    return this.request<any>(`/superadmin/schools/${schoolId}`, { method: 'PUT', data });
  }

  async deleteSchool(schoolId: string) {
    return this.request<any>(`/superadmin/schools/${schoolId}`, { method: 'DELETE' });
  }

  // Superadmin Feedback
  async getSuperadminFeedback(params?: { status?: string; category?: string; page?: number; limit?: number }) {
    const res = await this.request<any>('/superadmin/feedback', { params });
    return res;
  }

  async superadminUpdateFeedback(id: string, data: { status?: string; adminReply?: string }) {
    return this.request<any>(`/superadmin/feedback/${id}`, { method: 'PATCH', data });
  }
}

export const api = new WebAPIClient();
