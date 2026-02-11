import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "@/lib/store/user";
import { useAuthStore } from "@/lib/store/auth";
import { useProgressStore } from "@/lib/store/progress";
import { apiClient } from "@/lib/api";
import { UserRole } from "@/lib/types";
import ProgressBar from "@/components/progress/progress-bar";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, setUser } = useUserStore();
    const { logout } = useAuthStore();
    const { progress, calculateOverallProgress } = useProgressStore();
    const [requestingUpgrade, setRequestingUpgrade] = useState(false);
    const [roleUpgradeStatus, setRoleUpgradeStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
    const [sessions, setSessions] = useState<Array<{ id: string; createdAt: string; lastActiveAt: string; userAgent?: string; ipAddress?: string }>>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        if (!user || user.role !== UserRole.STUDENT) return;
        
        setLoadingProgress(true);
        try {
            const [chapters, quizzes] = await Promise.all([
                apiClient.getChapters(),
                apiClient.getQuizzes(1000), // Get all quizzes
            ]);
            await calculateOverallProgress(chapters, quizzes);
        } catch (error) {
            console.error("Error loading progress:", error);
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

        Alert.alert(
            "Request Teacher Role",
            "Are you sure you want to request a Teacher role upgrade? This will require admin approval.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Request",
                    onPress: async () => {
                        setRequestingUpgrade(true);
                        try {
                            const response = await apiClient.requestRoleUpgrade();
                            setRoleUpgradeStatus(response.status);
                            Alert.alert(
                                "Request Submitted",
                                "Your request for Teacher role has been submitted. You will be notified once it's reviewed by an admin.",
                                [{ text: "OK" }]
                            );
                            // Optionally refresh user data to get updated status
                            try {
                                const updatedUser = await apiClient.getCurrentUser();
                                setUser(updatedUser);
                            } catch (error) {
                                // Silently fail - user data refresh is optional
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to submit role upgrade request. Please try again.");
                        } finally {
                            setRequestingUpgrade(false);
                        }
                    },
                },
            ]
        );
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

            {user?.role === UserRole.STUDENT && progress && (
                <View style={styles.progressSection}>
                    <ProgressBar progress={progress.overallProgress} />
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

            {user?.role === UserRole.STUDENT && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleRequestRoleUpgrade}
                        disabled={requestingUpgrade || roleUpgradeStatus === 'pending'}
                    >
                        <Ionicons name="school-outline" size={24} color="#666" />
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuText}>Request Teacher Role</Text>
                            {roleUpgradeStatus === 'pending' && (
                                <Text style={styles.statusText}>Pending approval</Text>
                            )}
                            {roleUpgradeStatus === 'approved' && (
                                <Text style={[styles.statusText, styles.statusApproved]}>Approved</Text>
                            )}
                            {roleUpgradeStatus === 'rejected' && (
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
