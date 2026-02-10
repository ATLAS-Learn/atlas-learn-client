import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
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
});
