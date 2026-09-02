import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Animated as RNAnimated, Easing, StatusBar } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useUserStore } from "@/lib/store/user";
import { useOverallProgress, useStreak, useUserQuizAttempts, useLearningPath } from "@/lib/hooks/api";
import { API_BASE_URL } from "@/lib/constants/api";

const DARK_TEAL = "#084A59";
const GOLD = "#F2B138";
const BLACK = "#011C26";
const CIRCUMFERENCE = 2 * Math.PI * 34;
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

function useAnimatedNumber(target: number, duration = 1200, delay = 200, focusKey = 0) {
    const anim = useRef(new RNAnimated.Value(0)).current;
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        anim.setValue(0);
        setDisplay(0);
        const timer = setTimeout(() => {
            RNAnimated.timing(anim, {
                toValue: target,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        }, delay);
        return () => clearTimeout(timer);
    }, [target, focusKey]);

    useEffect(() => {
        const listener = anim.addListener(({ value }) => {
            setDisplay(Math.round(value));
        });
        return () => anim.removeListener(listener);
    }, []);

    return display;
}

function useAnimatedTime(seconds: number, duration = 1200, delay = 200, focusKey = 0) {
    const anim = useRef(new RNAnimated.Value(0)).current;
    const [display, setDisplay] = useState("0s");

    useEffect(() => {
        anim.setValue(0);
        setDisplay("0s");
        const timer = setTimeout(() => {
            RNAnimated.timing(anim, {
                toValue: seconds,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        }, delay);
        return () => clearTimeout(timer);
    }, [seconds, focusKey]);

    useEffect(() => {
        const listener = anim.addListener(({ value }) => {
            const s = Math.round(value);
            if (s < 60) setDisplay(`${s}s`);
            else if (s < 3600) setDisplay(`${Math.round(s / 60)}m`);
            else {
                const h = Math.floor(s / 3600);
                const m = Math.round((s % 3600) / 60);
                setDisplay(m > 0 ? `${h}h ${m}m` : `${h}h`);
            }
        });
        return () => anim.removeListener(listener);
    }, []);

    return display;
}

export default function HomeTab() {
    const router = useRouter();
    const { user } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const [focusKey, setFocusKey] = useState(0);
    const { data: overallProgress, refetch: refetchProgress } = useOverallProgress();
    const { data: streakData, refetch: refetchStreak } = useStreak();
    const { data: quizAttempts = [], refetch: refetchAttempts } = useUserQuizAttempts(user?.id);
    const { data: learningPath, refetch: refetchLearningPath } = useLearningPath();

    useFocusEffect(
        useCallback(() => {
            setFocusKey((k) => k + 1);
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.allSettled([
            refetchProgress(),
            refetchStreak(),
            refetchAttempts(),
            refetchLearningPath(),
        ]);
        setRefreshing(false);
    };

    const displayName = user?.name || user?.email?.split("@")[0] || "Student";

    const completion = Math.round(overallProgress?.overall?.completionPercentage ?? 0);
    const lessonsDone = overallProgress?.overall?.lessons?.completed ?? 0;
    const lessonsTotal = overallProgress?.overall?.lessons?.total ?? 0;
    const quizzesPassed = overallProgress?.overall?.quizzes?.passed ?? 0;
    const quizzesTotal = overallProgress?.overall?.quizzes?.total ?? 0;
    const totalTimeSpent = overallProgress?.overall?.totalTimeSpent ?? 0;
    const streak = streakData?.streak ?? 0;

    const averageScore = useMemo(() => {
        if (!Array.isArray(quizAttempts) || quizAttempts.length === 0) return 0;
        const total = quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
        return Math.round(total / quizAttempts.length);
    }, [quizAttempts]);

    const animatedCompletion = useRef(new RNAnimated.Value(0)).current;
    useEffect(() => {
        animatedCompletion.setValue(0);
        const timer = setTimeout(() => {
            RNAnimated.timing(animatedCompletion, {
                toValue: completion,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        }, 300);
        return () => clearTimeout(timer);
    }, [completion, focusKey]);

    const animCompletion = useAnimatedNumber(completion, 1400, 300, focusKey);
    const animLessonsDone = useAnimatedNumber(lessonsDone, 1000, 400, focusKey);
    const animQuizzesPassed = useAnimatedNumber(quizzesPassed, 1000, 500, focusKey);
    const animTimeSpent = useAnimatedTime(totalTimeSpent, 1000, 600, focusKey);
    const animAvgScore = useAnimatedNumber(averageScore, 1000, 700, focusKey);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={DARK_TEAL} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
                }
            >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {user?.image ? (
                        <Image
                            source={{ uri: user.image.startsWith("http") ? user.image : `${API_BASE_URL}${user.image}` }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={22} color="#FFF" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.greeting}>Welcome back</Text>
                        <Text style={styles.name}>{displayName}</Text>
                    </View>
                </View>
                {streak > 0 && (
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakIcon}>{"\uD83D\uDD25"}</Text>
                        <Text style={styles.streakText}>{streak}</Text>
                    </View>
                )}
            </View>

                {/* Streak Banner (only when streak is 0) */}
                {streak === 0 && (
                    <View style={styles.streakBanner}>
                        <View style={styles.streakBannerIconWrap}>
                            <Text style={styles.streakBannerEmoji}>{"\uD83D\uDD25"}</Text>
                        </View>
                        <View style={styles.streakBannerInfo}>
                            <Text style={styles.streakBannerTitle}>Start your streak!</Text>
                            <Text style={styles.streakBannerText}>Complete a lesson or quiz today</Text>
                        </View>
                    </View>
                )}

                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressRingWrap}>
                        <Svg width={80} height={80} viewBox="0 0 80 80">
                            <Circle cx={40} cy={40} r={34} fill="none" stroke="#084A5920" strokeWidth={6} />
                            <AnimatedCircle
                                cx={40}
                                cy={40}
                                r={34}
                                fill="none"
                                stroke={GOLD}
                                strokeWidth={6}
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={animatedCompletion.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: [CIRCUMFERENCE, 0],
                                })}
                                strokeLinecap="round"
                                transform="rotate(-90 40 40)"
                            />
                        </Svg>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.progressPercent}>{animCompletion}%</Text>
                            <Text style={styles.progressLabel}>complete</Text>
                        </View>
                    </View>
                    <View style={styles.progressStats}>
                        <View style={styles.progressStat}>
                            <Ionicons name="book-outline" size={16} color={DARK_TEAL} />
                            <Text style={styles.progressStatValue}>{animLessonsDone}/{lessonsTotal}</Text>
                            <Text style={styles.progressStatLabel}>Lessons</Text>
                        </View>
                        <View style={styles.progressStatDivider} />
                        <View style={styles.progressStat}>
                            <Ionicons name="checkmark-circle-outline" size={16} color={DARK_TEAL} />
                            <Text style={styles.progressStatValue}>{animQuizzesPassed}/{quizzesTotal}</Text>
                            <Text style={styles.progressStatLabel}>Quizzes</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: "#084A5912" }]}>
                            <Ionicons name="time-outline" size={16} color={DARK_TEAL} />
                        </View>
                        <Text style={styles.statValue}>{animTimeSpent}</Text>
                        <Text style={styles.statLabel}>Time Spent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: "#F2B13818" }]}>
                            <Ionicons name="trophy-outline" size={16} color={GOLD} />
                        </View>
                        <Text style={styles.statValue}>{animAvgScore}%</Text>
                        <Text style={styles.statLabel}>Avg Score</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: "#12A67C12" }]}>
                            <Ionicons name="ribbon-outline" size={16} color="#12A67C" />
                        </View>
                        <Text style={styles.statValue}>{animQuizzesPassed}</Text>
                        <Text style={styles.statLabel}>Passed</Text>
                    </View>
                </View>

                {/* Continue Your Path */}
                {learningPath && learningPath.perSubject.length > 0 && (() => {
                    const incompleteSubjects = learningPath.perSubject.filter(
                        (s) => s.completionPercentage < 100
                    );
                    if (incompleteSubjects.length === 0) return null;
                    return (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Continue Learning</Text>
                            {incompleteSubjects.map((subject) => {
                                const next = subject.currentChapter || subject.nextRecommended || subject.startChapter;
                                if (!next) return null;
                                return (
                                    <TouchableOpacity
                                        key={subject.subjectId}
                                        style={styles.pathCard}
                                        onPress={() => {
                                            router.navigate("/(tabs)/learn");
                                            requestAnimationFrame(() => {
                                                router.push({
                                                    pathname: "/(tabs)/learn/[id]",
                                                    params: { id: next.id, subjectId: subject.subjectId },
                                                } as any);
                                            });
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.pathLeft}>
                                            <View style={styles.pathDot} />
                                            <View>
                                                <Text style={styles.pathSubject}>{subject.subjectName}</Text>
                                                <Text style={styles.pathChapter}>{next.title}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.pathRight}>
                                            <Text style={styles.pathPercent}>{subject.completionPercentage}%</Text>
                                            <Ionicons name="chevron-forward" size={14} color="#084A5950" />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {learningPath.studyPlan && (
                                <Text style={styles.studyPlan}>{learningPath.studyPlan}</Text>
                            )}
                        </View>
                    );
                })()}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate("/(tabs)/learn")} activeOpacity={0.7}>
                            <View style={[styles.actionIconWrap, { backgroundColor: "#084A5912" }]}>
                                <Ionicons name="book-outline" size={20} color={DARK_TEAL} />
                            </View>
                            <Text style={styles.actionTitle}>Learn</Text>
                            <Text style={styles.actionDesc}>Continue lessons</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate("/(tabs)/exams" as any)} activeOpacity={0.7}>
                            <View style={[styles.actionIconWrap, { backgroundColor: "#F2B13818" }]}>
                                <Ionicons name="school-outline" size={20} color={GOLD} />
                            </View>
                            <Text style={styles.actionTitle}>Exams</Text>
                            <Text style={styles.actionDesc}>Take exams</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
                            <View style={[styles.actionIconWrap, { backgroundColor: "#12A67C12" }]}>
                                <Ionicons name="person-outline" size={20} color="#12A67C" />
                            </View>
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionDesc}>View progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push({ pathname: "/(tabs)/profile", params: { openFeedback: "true" } } as any)} activeOpacity={0.7}>
                            <View style={[styles.actionIconWrap, { backgroundColor: "#BF522A12" }]}>
                                <Ionicons name="chatbubble-outline" size={20} color="#BF522A" />
                            </View>
                            <Text style={styles.actionTitle}>Feedback</Text>
                            <Text style={styles.actionDesc}>Send feedback</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: DARK_TEAL },
    container: { flex: 1, backgroundColor: "#F7F8FA" },
    content: { padding: 20, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginTop: 8,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: GOLD },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: DARK_TEAL,
        justifyContent: "center",
        alignItems: "center",
    },
    greeting: { fontSize: 13, color: "#888", fontWeight: "500" },
    name: { fontSize: 24, fontWeight: "800", color: BLACK, marginTop: 1 },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: GOLD + "18",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    streakIcon: { fontSize: 16 },
    streakText: { fontSize: 14, fontWeight: "700", color: GOLD },

    // Streak Banner
    streakBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: GOLD + "12",
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: GOLD + "25",
    },
    streakBannerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: GOLD + "20",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    streakBannerEmoji: { fontSize: 24 },
    streakBannerInfo: { flex: 1 },
    streakBannerTitle: { fontSize: 14, fontWeight: "700", color: BLACK },
    streakBannerText: { fontSize: 12, color: "#666", marginTop: 2 },

    // Progress Card
    progressCard: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        alignItems: "center",
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    progressRingWrap: {
        width: 80,
        height: 80,
        marginRight: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    progressTextContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    progressPercent: { fontSize: 20, fontWeight: "800", color: DARK_TEAL },
    progressLabel: { fontSize: 10, color: "#999", marginTop: -2 },
    progressStats: { flex: 1, flexDirection: "row", alignItems: "center" },
    progressStat: { flex: 1, alignItems: "center" },
    progressStatValue: { fontSize: 16, fontWeight: "700", color: BLACK, marginTop: 4 },
    progressStatLabel: { fontSize: 11, color: "#999", marginTop: 2 },
    progressStatDivider: { width: 1, height: 30, backgroundColor: "#F0F0F0" },

    // Stats Row
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    statValue: { fontSize: 16, fontWeight: "700", color: BLACK, marginTop: 8 },
    statLabel: { fontSize: 10, color: "#999", marginTop: 2, fontWeight: "500" },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: BLACK, marginBottom: 12 },

    // Learning Path
    pathCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    pathLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
    pathDot: { width: 4, height: 32, borderRadius: 2, backgroundColor: GOLD },
    pathSubject: { fontSize: 11, color: "#999", fontWeight: "600" },
    pathChapter: { fontSize: 14, fontWeight: "600", color: BLACK, marginTop: 2 },
    pathRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    pathPercent: { fontSize: 12, fontWeight: "700", color: DARK_TEAL },
    studyPlan: { fontSize: 12, color: "#999", fontStyle: "italic", marginTop: 4 },

    // Actions
    actionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    actionCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: "#FFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    actionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    actionTitle: { marginTop: 10, fontSize: 13, fontWeight: "700", color: BLACK },
    actionDesc: { marginTop: 3, fontSize: 11, color: "#999" },
});
