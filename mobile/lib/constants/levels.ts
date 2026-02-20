import { Level } from "@/lib/types";

export interface LevelInfo {
    level: Level;
    label: string;
    description: string;
    color: string;
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
    [Level.FOUNDATIONAL]: {
        level: Level.FOUNDATIONAL,
        label: "Foundational",
        description: "We'll start you with foundational concepts to strengthen your base. Perfect for building a solid understanding!",
        color: "#4CAF50",
    },
    [Level.CORE]: {
        level: Level.CORE,
        label: "Core",
        description: "Great! We'll start you with Core concepts to strengthen your foundation. You're ready to dive deeper!",
        color: "#2196F3",
    },
    [Level.ADVANCED]: {
        level: Level.ADVANCED,
        label: "Advanced",
        description: "Excellent! You have a strong foundation. We'll challenge you with advanced concepts to push your limits!",
        color: "#9C27B0",
    },
};

export const getLevelFromScore = (score: number, totalQuestions: number): Level => {
    const percentage = (score / totalQuestions) * 100;

    if (percentage >= 100) {
        return Level.ADVANCED;
    } else if (percentage >= 60) {
        return Level.CORE;
    } else {
        return Level.FOUNDATIONAL;
    }
};
