import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@/lib/store/user";
import { useAuthStore } from "@/lib/store/auth";
import { apiClient } from "@/lib/api";
import { UserRole } from "@/lib/types";
import ProgressBar from "@/components/progress/progress-bar";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, setUser } = useUserStore();
    const { logout } = useAuthStore();
    const [requestingUpgrade, setRequestingUpgrade] = useState(false);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
    const [sessions, setSessions] = useState<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
    const [roleRequestModalVisible, setRoleRequestModalVisible] = useState(false);
    const [roleRequestReason, setRoleRequestReason] = useState("");
    const [roleRequestSchool, setRoleRequestSchool] = useState("");

    useEffect(() => {
        refreshUser();
    }, []);

    useEffect(() => {
        loadProgress();
    }, [user?.id, user?.role]);

    const refreshUser = async () => {
        try {
            const freshUser = await apiClient.getCurrentUser();
            setUser(freshUser);
        } catch {
            // Keep local user data if refresh fails.
        }
    };

    const loadProgress = async () => {
        if (!user || user.role !== UserRole.STUDENT) return;
        
        setLoadingProgress(true);
        try {
            const [attempts, quizzes] = await Promise.all([
                apiClient.getUserQuizAttempts(user.id),
                apiClient.getQuizzes(1000), // Get all quizzes
            ]);
            const passedQuizIds = new Set(
                attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.quizId)
            );
            const totalQuizzes = quizzes.length;
            const percentage =
                totalQuizzes > 0 ? Math.round((passedQuizIds.size / totalQuizzes) * 100) : 0;
            setProgressPercentage(percentage);
        } catch (error) {
            console.error("Error loading progress:", error);
            setProgressPercentage(0);
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)");
    };

    const handleRequestRoleUpgrade = async () => {
        if (user?.role !== UserRole.STUDENT) {
            return;
        }
        setRoleRequestModalVisible(true);
    };

    const closeRoleRequestModal = () => {
        if (requestingUpgrade) return;
        setRoleRequestModalVisible(false);
    };

    const submitRoleUpgradeRequest = async () => {
        if (!roleRequestReason.trim()) {
            Alert.alert("Missing Reason", "Please provide a reason for requesting teacher role.");
            return;
        }
        if (!roleRequestSchool.trim()) {
            Alert.alert("Missing School", "Please provide your school name.");
            return;
        }

        setRequestingUpgrade(true);
        try {
            const response = await apiClient.requestRoleUpgrade({
                reason: roleRequestReason.trim(),
                school: roleRequestSchool.trim(),
            });

            try {
                const updatedUser = await apiClient.getCurrentUser();
                setUser(updatedUser);
            } catch {
                // Role request succeeded; user refresh can fail independently.
            }

            setRoleRequestModalVisible(false);
            setRoleRequestReason("");
            setRoleRequestSchool("");
            Alert.alert("Request Submitted", response.message);
            router.push("/(tabs)/profile/pending-approval");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit role upgrade request. Please try again.");
        } finally {
            setRequestingUpgrade(false);
        }
    };

    const handleOpenSessions = async () => {
        setSessionsModalVisible(true);
        await loadSessions();
    };

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const sessionsList = await apiClient.getSessions();
            setSessions(sessionsList);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load active sessions.");
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        Alert.alert(
            "Revoke Session",
            "Are you sure you want to revoke this session? You will be signed out from that device.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Revoke",
                    style: "destructive",
                    onPress: async () => {
                        setRevokingSessionId(sessionId);
                        try {
                            await apiClient.revokeSession(sessionId);
                            Alert.alert("Success", "Session revoked successfully.");
                            await loadSessions(); // Refresh sessions list
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to revoke session.");
                        } finally {
                            setRevokingSessionId(null);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={48} color="#666" />
                </View>
                <Text style={styles.name}>{user?.name || "User"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                {user?.role && (
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Text>
                    </View>
                )}
            </View>

            {user?.role === UserRole.STUDENT && (
                <View style={styles.progressSection}>
                    {loadingProgress ? (
                        <View style={styles.progressLoadingContainer}>
                            <ActivityIndicator size="small" color="#F2B138" />
                        </View>
                    ) : (
                        <ProgressBar progress={progressPercentage} />
                    )}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learning</Text>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/(tabs)/profile/quiz-scores" as any)}
                >
                    <Ionicons name="document-text-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Quiz Scores</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="notifications-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleOpenSessions}>
                    <Ionicons name="phone-portrait-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Active Sessions</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            {user?.role === UserRole.ADMIN && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push("/(tabs)/profile/admin-role-upgrades")}
                    >
                        <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
                        <Text style={styles.menuText}>Role Upgrade Requests</Text>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>
            )}

            {user?.role === UserRole.STUDENT && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleRequestRoleUpgrade}
                        disabled={requestingUpgrade || user?.roleUpgradeStatus === "pending"}
                    >
                        <Ionicons name="school-outline" size={24} color="#666" />
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuText}>Request Teacher Role</Text>
                            {user?.roleUpgradeStatus === "pending" && (
                                <Text style={styles.statusText}>Pending approval</Text>
                            )}
                            {user?.roleUpgradeStatus === "approved" && (
                                <Text style={[styles.statusText, styles.statusApproved]}>Approved</Text>
                            )}
                            {user?.roleUpgradeStatus === "rejected" && (
                                <Text style={[styles.statusText, styles.statusRejected]}>Rejected</Text>
                            )}
                        </View>
                        {requestingUpgrade ? (
                            <ActivityIndicator size="small" color="#F2B138" />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Modal
                visible={roleRequestModalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeRoleRequestModal}
            >
                <View style={styles.requestModalOverlay}>
                    <View style={styles.requestModalCard}>
                        <Text style={styles.requestModalTitle}>Request Teacher Role</Text>
                        <Text style={styles.requestModalSubtitle}>
                            Provide details for admin review.
                        </Text>

                        <Text style={styles.requestFieldLabel}>Reason</Text>
                        <TextInput
                            style={[styles.requestInput, styles.requestInputMultiline]}
                            placeholder="I teach mathematics and need access to class analytics."
                            value={roleRequestReason}
                            onChangeText={setRoleRequestReason}
                            multiline
                            numberOfLines={4}
                            editable={!requestingUpgrade}
                        />

                        <Text style={styles.requestFieldLabel}>School</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="XYZ Secondary School"
                            value={roleRequestSchool}
                            onChangeText={setRoleRequestSchool}
                            editable={!requestingUpgrade}
                        />

                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={styles.requestCancelButton}
                                onPress={closeRoleRequestModal}
                                disabled={requestingUpgrade}
                            >
                                <Text style={styles.requestCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestSubmitButton}
                                onPress={submitRoleUpgradeRequest}
                                disabled={requestingUpgrade}
                            >
                                {requestingUpgrade ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.requestSubmitText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Sessions Modal */}
            <Modal
                visible={sessionsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSessionsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Active Sessions</Text>
                        <TouchableOpacity onPress={() => setSessionsModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#282F2E" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {loadingSessions ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#F2B138" />
                                <Text style={styles.loadingText}>Loading sessions...</Text>
                            </View>
                        ) : sessions.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="phone-portrait-outline" size={48} color="#999" />
                                <Text style={styles.emptyText}>No active sessions</Text>
                            </View>
                        ) : (
                            sessions.map((session) => (
                                <View key={session.id} style={styles.sessionItem}>
                                    <View style={styles.sessionInfo}>
                                        <View style={styles.sessionHeader}>
                                            <Ionicons name="phone-portrait" size={20} color="#666" />
                                            <Text style={styles.sessionDevice}>
                                                {session.userAgent || "Unknown Device"}
                                            </Text>
                                        </View>
                                        {session.ipAddress && (
                                            <Text style={styles.sessionIp}>IP: {session.ipAddress}</Text>
                                        )}
                                        <Text style={styles.sessionDate}>
                                            Last active: {formatDate(session.lastActiveAt)}
                                        </Text>
                                        <Text style={styles.sessionDate}>
                                            Created: {formatDate(session.createdAt)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.revokeButton}
                                        onPress={() => handleRevokeSession(session.id)}
                                        disabled={revokingSessionId === session.id}
                                    >
                                        {revokingSessionId === session.id ? (
                                            <ActivityIndicator size="small" color="#F44336" />
                                        ) : (
                                            <>
                                                <Ionicons name="trash-outline" size={18} color="#F44336" />
                                                <Text style={styles.revokeButtonText}>Revoke</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    header: {
        alignItems: "center",
        padding: 32,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: "#FFF9E6",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#F2B138",
    },
    progressSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    progressLoadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 42,
    },
    section: {
        marginTop: 24,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 12,
        marginTop: 16,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        gap: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: "#282F2E",
        fontWeight: "500",
    },
    menuTextContainer: {
        flex: 1,
    },
    statusText: {
        fontSize: 12,
        color: "#F2B138",
        fontWeight: "600",
        marginTop: 4,
    },
    statusApproved: {
        color: "#4CAF50",
    },
    statusRejected: {
        color: "#F44336",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: 24,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#FFEBEE",
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F44336",
    },
    requestModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        padding: 20,
    },
    requestModalCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
    },
    requestModalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#282F2E",
        marginBottom: 4,
    },
    requestModalSubtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 16,
    },
    requestFieldLabel: {
        fontSize: 14,
        color: "#282F2E",
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 8,
    },
    requestInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: "#282F2E",
        backgroundColor: "#FAFAFA",
    },
    requestInputMultiline: {
        minHeight: 96,
        textAlignVertical: "top",
    },
    requestActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 18,
    },
    requestCancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    requestCancelText: {
        fontSize: 15,
        color: "#666",
        fontWeight: "600",
    },
    requestSubmitButton: {
        backgroundColor: "#F2B138",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        minWidth: 90,
        alignItems: "center",
    },
    requestSubmitText: {
        fontSize: 15,
        color: "#fff",
        fontWeight: "700",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#282F2E",
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    sessionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    sessionInfo: {
        flex: 1,
        marginRight: 12,
    },
    sessionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    sessionDevice: {
        fontSize: 16,
        fontWeight: "600",
        color: "#282F2E",
    },
    sessionIp: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    sessionDate: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    revokeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FFEBEE",
        backgroundColor: "#FFF",
    },
    revokeButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#F44336",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
        marginTop: 16,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
});
