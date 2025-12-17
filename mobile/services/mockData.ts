import { User, Level, Chapter, Quiz, AssessmentQuestion, DashboardData, Progress } from "./types";
import { CHAPTERS } from "@/data/chapters";
import { ASSESSMENT_QUESTIONS } from "@/data/assessmentQuestions";
import { QUIZ_QUESTIONS, PAST_PAPER_REFERENCES } from "@/data/quizQuestions";

// Mock user data
let mockUsers: User[] = [];
let currentUser: User | null = null;
let authToken: string | null = null;

// Mock progress data
const mockProgress: Record<string, Progress> = {};

// Generate mock quiz from chapter
export const getMockQuiz = (chapterId: string): Quiz | null => {
    const questions = QUIZ_QUESTIONS[chapterId];
    if (!questions) return null;

    return {
        id: `quiz-${chapterId}`,
        chapterId,
        questions,
        passingScore: 80,
    };
};

// Mock API functions
export const mockAPI = {
    // Auth
    async signup(data: {
        name: string;
        email: string;
        password: string;
        school: string;
        examYear: number;
    }): Promise<{ token: string; user: User }> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user: User = {
            id: `user-${Date.now()}`,
            name: data.name,
            email: data.email,
            role: "student" as const,
            school: data.school,
            examYear: data.examYear,
            createdAt: new Date().toISOString(),
        };

        mockUsers.push(user);
        currentUser = user;
        authToken = `mock-token-${Date.now()}`;

        // Initialize progress
        mockProgress[user.id] = {
            userId: user.id,
            currentChapterId: CHAPTERS[0].id,
            completedChapters: [],
            overallProgress: 0,
            streak: 1,
            lastActiveDate: new Date().toISOString(),
        };

        return { token: authToken, user };
    },

    async login(email: string, password: string): Promise<{ token: string; user: User }> {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = mockUsers.find((u) => u.email === email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        currentUser = user;
        authToken = `mock-token-${Date.now()}`;

        // Initialize progress if not exists
        if (!mockProgress[user.id]) {
            mockProgress[user.id] = {
                userId: user.id,
                currentChapterId: CHAPTERS[0].id,
                completedChapters: [],
                overallProgress: 0,
                streak: 1,
                lastActiveDate: new Date().toISOString(),
            };
        }

        return { token: authToken, user };
    },

    async getCurrentUser(): Promise<User | null> {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return currentUser;
    },

    // Assessment
    async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return ASSESSMENT_QUESTIONS;
    },

    async submitAssessment(answers: { questionId: string; answerIndex: number }[]): Promise<{
        score: number;
        totalQuestions: number;
        level: Level;
        message: string;
    }> {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const questions = ASSESSMENT_QUESTIONS;
        let score = 0;

        answers.forEach((answer) => {
            const question = questions.find((q) => q.id === answer.questionId);
            if (question && question.correctAnswer === answer.answerIndex) {
                score++;
            }
        });

        const percentage = (score / questions.length) * 100;
        let level: Level;
        let message: string;

        if (percentage >= 100) {
            level = Level.ADVANCED;
            message = "Excellent! You have a strong foundation. We'll challenge you with advanced concepts!";
        } else if (percentage >= 60) {
            level = Level.CORE;
            message = "Great! We'll start you with Core concepts to strengthen your foundation.";
        } else {
            level = Level.FOUNDATIONAL;
            message = "We'll start you with foundational concepts to strengthen your base. Perfect for building a solid understanding!";
        }

        // Update user level
        if (currentUser) {
            currentUser.level = level;
        }

        return {
            score,
            totalQuestions: questions.length,
            level,
            message,
        };
    },

    // Dashboard
    async getDashboard(): Promise<DashboardData> {
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!currentUser) {
            throw new Error("Not authenticated");
        }

        const progress = mockProgress[currentUser.id] || {
            userId: currentUser.id,
            currentChapterId: CHAPTERS[0].id,
            completedChapters: [],
            overallProgress: 0,
            streak: 1,
            lastActiveDate: new Date().toISOString(),
        };

        const currentChapter = CHAPTERS.find((c) => c.id === progress.currentChapterId) || CHAPTERS[0];
        const currentChapterIndex = CHAPTERS.findIndex((c) => c.id === currentChapter.id);
        const nextChapter = CHAPTERS[currentChapterIndex + 1];
        const isNextChapterLocked = !progress.completedChapters.includes(currentChapter.id);

        return {
            user: currentUser,
            progress,
            currentChapter,
            nextChapter,
            isNextChapterLocked,
        };
    },

    // Chapters
    async getChapter(chapterId: string): Promise<Chapter | null> {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return CHAPTERS.find((c) => c.id === chapterId) || null;
    },

    async getChapterQuiz(chapterId: string): Promise<Quiz | null> {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return getMockQuiz(chapterId);
    },

    async submitQuiz(
        quizId: string,
        answers: { questionId: string; answerIndex: number }[]
    ): Promise<{
        score: number;
        totalQuestions: number;
        percentage: number;
        passed: boolean;
        pastPaperReference?: string;
        unlockedNextChapter: boolean;
    }> {
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!currentUser) {
            throw new Error("Not authenticated");
        }

        // Extract chapterId from quizId (format: "quiz-chapter-1")
        const chapterId = quizId.replace("quiz-", "");
        const quiz = getMockQuiz(chapterId);
        if (!quiz) {
            throw new Error("Quiz not found");
        }

        let score = 0;
        answers.forEach((answer) => {
            const question = quiz.questions.find((q) => q.id === answer.questionId);
            if (question && question.correctAnswer === answer.answerIndex) {
                score++;
            }
        });

        const percentage = (score / quiz.questions.length) * 100;
        const passed = percentage >= quiz.passingScore;

        // Update progress if passed
        let unlockedNextChapter = false;
        if (passed) {
            const progress = mockProgress[currentUser.id];
            if (progress && !progress.completedChapters.includes(quiz.chapterId)) {
                progress.completedChapters.push(quiz.chapterId);

                // Unlock next chapter
                const currentChapterIndex = CHAPTERS.findIndex((c) => c.id === quiz.chapterId);
                if (currentChapterIndex < CHAPTERS.length - 1) {
                    progress.currentChapterId = CHAPTERS[currentChapterIndex + 1].id;
                    unlockedNextChapter = true;
                }

                // Update overall progress
                progress.overallProgress = (progress.completedChapters.length / CHAPTERS.length) * 100;
            }
        }

        const pastPaperReference = PAST_PAPER_REFERENCES[quiz.chapterId];

        return {
            score,
            totalQuestions: quiz.questions.length,
            percentage,
            passed,
            pastPaperReference,
            unlockedNextChapter,
        };
    },
};

