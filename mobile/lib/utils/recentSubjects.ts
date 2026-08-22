import { getCacheSync, setCache } from "@/lib/utils/cache";

const RECENT_SUBJECTS_KEY = "cache:recent-subjects";
const RECENT_SUBJECTS_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days
const MAX_RECENT = 10;

export interface RecentSubject {
    subjectId: string;
    visitedAt: number;
}

export function getRecentSubjects(): RecentSubject[] {
    return getCacheSync<RecentSubject[]>(RECENT_SUBJECTS_KEY) || [];
}

export function trackSubjectVisit(subjectId: string) {
    const recent = getRecentSubjects();
    const filtered = recent.filter((r) => r.subjectId !== subjectId);
    filtered.unshift({ subjectId, visitedAt: Date.now() });
    const trimmed = filtered.slice(0, MAX_RECENT);
    setCache(RECENT_SUBJECTS_KEY, trimmed, RECENT_SUBJECTS_TTL).catch(() => {});
}

export function getTopRecentSubjectIds(count: number): string[] {
    return getRecentSubjects()
        .sort((a, b) => b.visitedAt - a.visitedAt)
        .slice(0, count)
        .map((r) => r.subjectId);
}
