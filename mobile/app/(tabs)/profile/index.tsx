import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, ScrollView, TextInput, useWindowDimensions, Image, Linking, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useUserStore } from "@/lib/store/user";
import { useAuthStore } from "@/lib/store/auth";
import { apiClient } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants/api";
import { useOverallProgress } from "@/lib/hooks/api";
import ProgressBar from "@/components/progress/progress-bar";

function parseUserAgent(ua: string | undefined): { browser: string; os: string; deviceType: "mobile" | "desktop" | "unknown" } {
    if (!ua) return { browser: "Unknown", os: "Unknown", deviceType: "unknown" };

    let browser = "Unknown";
    if (ua.includes("ExpoGo") || ua.includes("expo")) browser = "Expo Go";
    else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

    let os = "Unknown";
    if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    let deviceType: "mobile" | "desktop" | "unknown" = "unknown";
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone") || ua.includes("ExpoGo")) deviceType = "mobile";
    else if (ua.includes("Windows") || ua.includes("Macintosh") || ua.includes("Linux")) deviceType = "desktop";

    return { browser, os, deviceType };
}

export default function ProfileScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { user, setUser } = useUserStore();
    const { logout } = useAuthStore();
    const { data: overallProgressData, isLoading: loadingProgress } = useOverallProgress();
    const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
    const [sessions, setSessions] = useState<{ id: string; createdAt: string; expiresAt: string; userAgent?: string; ipAddress?: string }[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [editUsername, setEditUsername] = useState("");
    const [editImage, setEditImage] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editSchool, setEditSchool] = useState("");
    const [editExamYear, setEditExamYear] = useState("");
    const [editPickedImage, setEditPickedImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackCategory, setFeedbackCategory] = useState<string>("general");
    const [feedbackSubject, setFeedbackSubject] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackRating, setFeedbackRating] = useState<number>(0);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);

    // Fetch unread notification count
    useEffect(() => {
        apiClient.getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
    }, []);

    // User data comes from the persisted store (single /auth/me fetch at startup).
    // Profile edits below update the store directly after saving.

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)");
    };

    const handleOpenSessions = async () => {
        setSessionsModalVisible(true);
        await loadSessions();
    };

    const openEditProfileModal = () => {
        setEditName(user?.name || "");
        setEditUsername(user?.username || "");
        setEditImage(user?.image || "");
        setEditBio(user?.bio || "");
        setEditSchool(user?.school || "");
        setEditExamYear(user?.examYear ? String(user.examYear) : "");
        setEditPickedImage(null);
        setEditProfileModalVisible(true);
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant photo library access to upload a profile picture.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setEditPickedImage(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant camera access to take a profile picture.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setEditPickedImage(result.assets[0].uri);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert("Missing Name", "Name is required.");
            return;
        }

        const parsedExamYear = editExamYear.trim() ? Number(editExamYear) : undefined;
        if (editExamYear.trim() && (!Number.isFinite(parsedExamYear) || !Number.isInteger(parsedExamYear))) {
            Alert.alert("Invalid Exam Year", "Exam year must be a valid number.");
            return;
        }

        setSavingProfile(true);
        try {
            let imageUrl = editImage.trim() || undefined;
            if (editPickedImage) {
                setUploadingImage(true);
                imageUrl = await apiClient.uploadProfileImage(editPickedImage);
                setUploadingImage(false);
            }
            const updatedUser = await apiClient.updateCurrentUserProfile({
                name: editName.trim(),
                username: editUsername.trim() || undefined,
                image: imageUrl,
                bio: editBio.trim() || undefined,
                school: editSchool.trim() || undefined,
                examYear: parsedExamYear,
            });
            // Cache-bust the image URL so React Native Image reloads immediately
            const displayImage = imageUrl ? `${imageUrl}?t=${Date.now()}` : updatedUser.image;
            setUser({ ...updatedUser, image: displayImage });
            setEditProfileModalVisible(false);
            Alert.alert("Success", "Profile updated successfully.");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
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
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackSubject.trim()) {
            Alert.alert("Missing Subject", "Please enter a subject for your feedback.");
            return;
        }
        if (!feedbackMessage.trim()) {
            Alert.alert("Missing Message", "Please enter your feedback message.");
            return;
        }

        setSubmittingFeedback(true);
        try {
            await apiClient.submitFeedback({
                category: feedbackCategory,
                subject: feedbackSubject.trim(),
                message: feedbackMessage.trim(),
                rating: feedbackRating > 0 ? feedbackRating : undefined,
            });
            setFeedbackModalVisible(false);
            setFeedbackSubject("");
            setFeedbackMessage("");
            setFeedbackRating(0);
            setFeedbackCategory("general");
            Alert.alert("Thank You!", "Your feedback has been submitted successfully.");
        } catch {
            // Offline fallback — queue for background sync
            const { enqueueFeedback } = await import("@/lib/utils/syncQueue");
            await enqueueFeedback({
                category: feedbackCategory,
                subject: feedbackSubject.trim(),
                message: feedbackMessage.trim(),
                rating: feedbackRating > 0 ? feedbackRating : undefined,
            });
            setFeedbackModalVisible(false);
            setFeedbackSubject("");
            setFeedbackMessage("");
            setFeedbackRating(0);
            setFeedbackCategory("general");
            Alert.alert("Feedback Queued", "Your feedback will be submitted when you're back online.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleWhatsApp = () => {
        const phoneNumber = "237600000000";
        const message = encodeURIComponent("Hello! I need help with Apex Learn.");
        const url = `https://wa.me/${phoneNumber}?text=${message}`;
        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "WhatsApp is not installed on this device.");
        });
    };

    const handleJoinWhatsAppChannel = () => {
        const channelUrl = "https://chat.whatsapp.com/YOUR_GROUP_LINK";
        Linking.openURL(channelUrl).catch(() => {
            Alert.alert("Error", "WhatsApp is not installed on this device.");
        });
    };

    const handleAvatarPickImage = async () => {
        setAvatarModalVisible(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant photo library access.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
    };

    const handleAvatarTakePhoto = async () => {
        setAvatarModalVisible(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please grant camera access.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
    };

    const handleAvatarRemove = async () => {
        setAvatarModalVisible(false);
        try {
            const updatedUser = await apiClient.updateCurrentUserProfile({ image: undefined });
            const displayImage = updatedUser.image ? `${updatedUser.image}?t=${Date.now()}` : undefined;
            setUser({ ...updatedUser, image: displayImage });
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove profile picture.");
        }
    };

    const uploadAvatar = async (uri: string) => {
        try {
            const imageUrl = await apiClient.uploadProfileImage(uri);
            const displayImage = `${imageUrl}?t=${Date.now()}`;
            setUser({ ...user!, image: displayImage });
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to upload profile picture.");
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingHorizontal: width < 390 ? 16 : 24 }]}>
                <View>
                    <View style={styles.avatarContainer}>
                        {user?.image ? (
                            <Image source={{ uri: user.image.startsWith("http") ? user.image : `${API_BASE_URL}${user.image}` }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={48} color="#666" />
                        )}
                    </View>
                    <TouchableOpacity style={styles.avatarEditButton} onPress={() => setAvatarModalVisible(true)}>
                        <Ionicons name="pencil" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.name}>{user?.name || "User"}</Text>
                <Text style={styles.email}>{user?.email || ""}</Text>
                {!!user?.school && <Text style={styles.metaText}>School: {user.school}</Text>}
                {!!user?.examYear && <Text style={styles.metaText}>Exam Year: {user.examYear}</Text>}
                {!!user?.username && <Text style={styles.metaText}>Username: @{user.username}</Text>}
                {!!user?.lastLoginAt && <Text style={styles.metaText}>Last Login: {formatDate(user.lastLoginAt)}</Text>}
                {!!user?.bio && <Text style={styles.metaText} numberOfLines={2}>{user.bio}</Text>}
            </View>

            <View style={styles.progressSection}>
                {loadingProgress ? (
                    <View style={styles.progressLoadingContainer}>
                        <ActivityIndicator size="small" color="#F2B138" />
                    </View>
                ) : (
                    <ProgressBar progress={Number(overallProgressData?.overall?.completionPercentage || 0)} />
                )}
            </View>

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
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/(tabs)/profile/exam-history" as any)}
                >
                    <Ionicons name="school-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Exam History</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/(tabs)/profile/assessment-result" as any)}
                >
                    <Ionicons name="trophy-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Assessment Result</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <TouchableOpacity style={styles.menuItem} onPress={openEditProfileModal}>
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setFeedbackModalVisible(true)}>
                    <Ionicons name="chatbubble-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Send Feedback</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setUnreadCount(0); router.push("/(tabs)/profile/notifications" as any); }}>
                    <Ionicons name="notifications-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                        </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleOpenSessions}>
                    <Ionicons name="phone-portrait-outline" size={24} color="#666" />
                    <Text style={styles.menuText}>Active Sessions</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <TouchableOpacity style={styles.menuItem} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                    <Text style={styles.menuText}>Contact on WhatsApp</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleJoinWhatsAppChannel}>
                    <Ionicons name="people-outline" size={24} color="#25D366" />
                    <Text style={styles.menuText}>Join WhatsApp Channel</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#E57373" />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={editProfileModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setEditProfileModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.feedbackModalOverlay}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                    <View style={styles.requestModalCard}>
                        <Text style={styles.requestModalTitle}>Edit Profile</Text>
                        <Text style={styles.requestModalSubtitle}>Update the fields you want to change.</Text>

                        <Text style={styles.requestFieldLabel}>Name</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="Full Name"
                            value={editName}
                            onChangeText={setEditName}
                            editable={!savingProfile}
                        />

                        <Text style={styles.requestFieldLabel}>Username</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="Username"
                            value={editUsername}
                            onChangeText={setEditUsername}
                            autoCapitalize="none"
                            editable={!savingProfile}
                        />

                        <Text style={styles.requestFieldLabel}>Profile Picture</Text>
                        <View style={styles.imagePreviewRow}>
                            <View style={styles.imagePreviewContainer}>
                                {editPickedImage ? (
                                    <Image source={{ uri: editPickedImage }} style={styles.imagePreview} />
                                ) : user?.image ? (
                                    <Image source={{ uri: user.image.startsWith("http") ? user.image : `${API_BASE_URL}${user.image}` }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.imagePreviewPlaceholder}>
                                        <Ionicons name="person" size={32} color="#999" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.imagePickerButtons}>
                                <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage} disabled={savingProfile}>
                                    <Ionicons name="images-outline" size={18} color="#F2B138" />
                                    <Text style={styles.imagePickerButtonText}>Gallery</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.imagePickerButton} onPress={handleTakePhoto} disabled={savingProfile}>
                                    <Ionicons name="camera-outline" size={18} color="#F2B138" />
                                    <Text style={styles.imagePickerButtonText}>Camera</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.requestFieldLabel}>Bio</Text>
                        <TextInput
                            style={[styles.requestInput, styles.requestInputMultiline]}
                            placeholder="Short bio"
                            value={editBio}
                            onChangeText={setEditBio}
                            multiline
                            numberOfLines={3}
                            editable={!savingProfile}
                        />

                        <Text style={styles.requestFieldLabel}>School</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="School"
                            value={editSchool}
                            onChangeText={setEditSchool}
                            editable={!savingProfile}
                        />

                        <Text style={styles.requestFieldLabel}>Exam Year</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="2026"
                            value={editExamYear}
                            onChangeText={setEditExamYear}
                            keyboardType="number-pad"
                            editable={!savingProfile}
                        />

                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={styles.requestCancelButton}
                                onPress={() => setEditProfileModalVisible(false)}
                                disabled={savingProfile}
                            >
                                <Text style={styles.requestCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestSubmitButton}
                                onPress={handleSaveProfile}
                                disabled={savingProfile}
                            >
                                {savingProfile ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.requestSubmitText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Sessions Modal */}
            <Modal
                visible={sessionsModalVisible}
                animationType="slide"
                onRequestClose={() => setSessionsModalVisible(false)}
            >
                <View style={styles.feedbackModalOverlay}>
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
                            sessions.map((session) => {
                                const parsed = parseUserAgent(session.userAgent);
                                const icon = parsed.deviceType === "mobile" ? "phone-portrait" : "laptop";
                                return (
                                    <View key={session.id} style={styles.sessionItem}>
                                        <View style={styles.sessionInfo}>
                                            <View style={styles.sessionHeader}>
                                                <Ionicons name={icon as any} size={20} color="#666" />
                                                <Text style={styles.sessionDevice}>
                                                    {parsed.browser} on {parsed.os}
                                                </Text>
                                            </View>
                                            <Text style={styles.sessionUserAgent} numberOfLines={1}>
                                                {session.userAgent || "Unknown device"}
                                            </Text>
                                            {session.ipAddress && (
                                                <Text style={styles.sessionIp}>IP: {session.ipAddress}</Text>
                                            )}
                                            <Text style={styles.sessionDate}>
                                                Expires: {formatDate(session.expiresAt)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.revokeButton}
                                            onPress={() => handleRevokeSession(session.id)}
                                            disabled={revokingSessionId === session.id}
                                        >
                                            {revokingSessionId === session.id ? (
                                                <ActivityIndicator size="small" color="#E57373" />
                                            ) : (
                                                <>
                                                    <Ionicons name="trash-outline" size={18} color="#E57373" />
                                                    <Text style={styles.revokeButtonText}>Revoke</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Feedback Modal */}
            <Modal
                visible={feedbackModalVisible}
                animationType="slide"
                onRequestClose={() => setFeedbackModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.feedbackModalOverlay}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                    <View style={styles.requestModalCard}>
                        <Text style={styles.requestModalTitle}>Send Feedback</Text>
                        <Text style={styles.requestModalSubtitle}>
                            Help us improve Apex Learn. Your feedback is sent to our team.
                        </Text>

                        <Text style={styles.requestFieldLabel}>Category</Text>
                        <View style={styles.categoryRow}>
                            {(["general", "bug", "feature_request", "suggestion", "complaint"] as const).map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryChip, feedbackCategory === cat && styles.categoryChipActive]}
                                    onPress={() => setFeedbackCategory(cat)}
                                    disabled={submittingFeedback}
                                >
                                    <Text style={[styles.categoryChipText, feedbackCategory === cat && styles.categoryChipTextActive]}>
                                        {cat.replace(/_/g, " ")}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.requestFieldLabel}>Rating (optional)</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setFeedbackRating(star === feedbackRating ? 0 : star)}
                                    disabled={submittingFeedback}
                                >
                                    <Ionicons
                                        name={star <= feedbackRating ? "star" : "star-outline"}
                                        size={32}
                                        color={star <= feedbackRating ? "#F2B138" : "#CCC"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.requestFieldLabel}>Subject</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder="Brief summary of your feedback"
                            value={feedbackSubject}
                            onChangeText={setFeedbackSubject}
                            editable={!submittingFeedback}
                        />

                        <Text style={styles.requestFieldLabel}>Message</Text>
                        <TextInput
                            style={[styles.requestInput, styles.requestInputMultiline]}
                            placeholder="Describe your feedback in detail..."
                            value={feedbackMessage}
                            onChangeText={setFeedbackMessage}
                            multiline
                            numberOfLines={5}
                            editable={!submittingFeedback}
                        />

                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={styles.requestCancelButton}
                                onPress={() => setFeedbackModalVisible(false)}
                                disabled={submittingFeedback}
                            >
                                <Text style={styles.requestCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestSubmitButton}
                                onPress={handleSubmitFeedback}
                                disabled={submittingFeedback}
                            >
                                {submittingFeedback ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.requestSubmitText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* Avatar Edit Modal */}
            <Modal
                visible={avatarModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAvatarModalVisible(false)}
            >
                <TouchableOpacity style={styles.avatarModalOverlay} activeOpacity={1} onPress={() => setAvatarModalVisible(false)}>
                    <View style={styles.avatarModalCard}>
                        <Text style={styles.avatarModalTitle}>Profile Picture</Text>
                        <TouchableOpacity style={styles.avatarModalOption} onPress={handleAvatarPickImage}>
                            <Ionicons name="images-outline" size={22} color="#F2B138" />
                            <Text style={styles.avatarModalOptionText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatarModalOption} onPress={handleAvatarTakePhoto}>
                            <Ionicons name="camera-outline" size={22} color="#F2B138" />
                            <Text style={styles.avatarModalOptionText}>Take a Photo</Text>
                        </TouchableOpacity>
                        {user?.image && (
                            <TouchableOpacity style={[styles.avatarModalOption, styles.avatarModalOptionDanger]} onPress={handleAvatarRemove}>
                                <Ionicons name="trash-outline" size={22} color="#E57373" />
                                <Text style={[styles.avatarModalOptionText, styles.avatarModalOptionTextDanger]}>Remove Photo</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.avatarModalCancel} onPress={() => setAvatarModalVisible(false)}>
                            <Text style={styles.avatarModalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },
    scrollContent: {
        paddingBottom: 24,
    },

    // Header — full-width teal background
    header: {
        alignItems: "center",
        paddingTop: 28,
        paddingBottom: 40,
        backgroundColor: "#084A59",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    avatarContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.3)",
    },
    avatarImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    avatarEditButton: {
        position: "absolute",
        bottom: 2,
        right: -2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#F2B138",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#084A59",
    },
    name: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFF",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "rgba(255,255,255,0.7)",
        marginBottom: 10,
    },
    metaText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        marginTop: 3,
    },

    // Progress
    progressSection: {
        marginTop: -16,
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    progressLoadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 42,
    },

    // Sections
    section: {
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        color: "#1F2524",
        fontWeight: "600",
    },
    badge: {
        backgroundColor: "#DC2626",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
    badgeText: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "700",
    },

    // Logout
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginHorizontal: 16,
        marginTop: 24,
        padding: 15,
        backgroundColor: "#FFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FFEBEE",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#E57373",
    },

    // Modals
    requestModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        padding: 20,
    },
    feedbackModalOverlay: {
        flexGrow: 1,
        backgroundColor: "#F7F8FA",
        padding: 20,
        paddingTop: 60,
    },
    requestModalCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
    },
    requestModalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1F2524",
        marginBottom: 4,
    },
    requestModalSubtitle: {
        fontSize: 14,
        color: "#999",
        marginBottom: 16,
    },
    requestFieldLabel: {
        fontSize: 14,
        color: "#1F2524",
        fontWeight: "700",
        marginBottom: 8,
        marginTop: 8,
    },
    requestInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1F2524",
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
        color: "#999",
        fontWeight: "600",
    },
    requestSubmitButton: {
        backgroundColor: "#084A59",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
        minWidth: 90,
        alignItems: "center",
    },
    requestSubmitText: {
        fontSize: 15,
        color: "#fff",
        fontWeight: "700",
    },

    // Sessions modal
    modalContainer: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#084A59",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFF",
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
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionInfo: {
        flex: 1,
        marginRight: 12,
    },
    sessionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    sessionDevice: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1F2524",
    },
    sessionUserAgent: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
        fontStyle: "italic",
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
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FFEBEE",
        backgroundColor: "#FFF",
    },
    revokeButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E57373",
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

    // Image picker
    imagePreviewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
    },
    imagePreviewContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        overflow: "hidden",
        backgroundColor: "#F5F5F5",
    },
    imagePreview: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    imagePreviewPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    imagePickerButtons: {
        flex: 1,
        gap: 8,
    },
    imagePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        backgroundColor: "#FAFAFA",
    },
    imagePickerButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },

    // Feedback
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },
    categoryChip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        backgroundColor: "#FAFAFA",
    },
    categoryChipActive: {
        backgroundColor: "#FFF3E0",
        borderColor: "#F2B138",
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        textTransform: "capitalize",
    },
    categoryChipTextActive: {
        color: "#F2B138",
    },
    ratingRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },

    // Avatar modal
    avatarModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarModalCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        width: 280,
        padding: 8,
        overflow: "hidden",
    },
    avatarModalTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#1F2524",
        textAlign: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    avatarModalOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    avatarModalOptionText: {
        fontSize: 16,
        color: "#1F2524",
    },
    avatarModalOptionDanger: {
        borderBottomColor: "#F0F0F0",
    },
    avatarModalOptionTextDanger: {
        color: "#E57373",
    },
    avatarModalCancel: {
        paddingVertical: 14,
        alignItems: "center",
    },
    avatarModalCancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#999",
    },
});
