import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    PanResponder,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiClient } from "@/lib/api";

const TEAL = "#084A59";
const GOLD = "#F2B138";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FAB_SIZE = 60;

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface FloatingChatButtonProps {
    subjectName?: string;
    chapterName?: string;
    lessonName?: string;
}

export default function FloatingChatButton({
    subjectName,
    chapterName,
    lessonName,
}: FloatingChatButtonProps) {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm Apex AI. Ask me anything about this lesson and I'll help you understand it better.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Position state
    const posX = useRef(new Animated.Value(SCREEN_WIDTH - FAB_SIZE - 20)).current;
    const posY = useRef(new Animated.Value(SCREEN_HEIGHT - 200)).current;
    const isDragging = useRef(false);
    const touchStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
            onPanResponderGrant: () => {
                isDragging.current = false;
                touchStart.current = { x: (posX as any)._value, y: (posY as any)._value };
            },
            onPanResponderMove: (_, gs) => {
                if (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3) {
                    isDragging.current = true;
                }
                let newX = touchStart.current.x + gs.dx;
                let newY = touchStart.current.y + gs.dy;
                newX = Math.max(0, Math.min(newX, SCREEN_WIDTH - FAB_SIZE));
                newY = Math.max(insets.top, Math.min(newY, SCREEN_HEIGHT - FAB_SIZE - insets.bottom));
                posX.setValue(newX);
                posY.setValue(newY);
            },
            onPanResponderRelease: () => {
                const finalX = (posX as any)._value;
                const finalY = (posY as any)._value;
                const snapX = finalX < SCREEN_WIDTH / 2 ? 20 : SCREEN_WIDTH - FAB_SIZE - 20;
                const clampedY = Math.max(insets.top, Math.min(finalY, SCREEN_HEIGHT - FAB_SIZE - insets.bottom));
                Animated.spring(posX, { toValue: snapX, useNativeDriver: false, tension: 120, friction: 12 }).start();
                Animated.spring(posY, { toValue: clampedY, useNativeDriver: false, tension: 120, friction: 12 }).start();
            },
        })
    ).current;

    const handlePress = () => {
        if (!isDragging.current) setVisible(true);
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const history = messages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }));
            const reply = await apiClient.chatWithAI({ message: text, subjectName, chapterName, lessonName, history });
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: reply }]);
        } catch {
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I couldn't respond right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === "user";
        return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={styles.msgAvatar}>
                        <Ionicons name="sparkles" size={14} color={GOLD} />
                    </View>
                )}
                <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
                    <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAI]}>{item.content}</Text>
                </View>
            </View>
        );
    };

    return (
        <>
            {/* Draggable FAB */}
            <Animated.View
                style={[styles.fabWrap, { left: posX, top: posY, transform: [{ scale: pulseAnim }] }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8}>
                    <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* Chat Modal */}
            <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
                <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="sparkles" size={18} color={GOLD} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Apex AI</Text>
                                <Text style={styles.headerSub}>{subjectName || "Ask anything"}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.msgList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {loading && (
                        <View style={styles.typingRow}>
                            <View style={styles.msgAvatar}>
                                <Ionicons name="sparkles" size={14} color={GOLD} />
                            </View>
                            <View style={[styles.msgBubble, styles.msgBubbleAI, { paddingVertical: 12 }]}>
                                <ActivityIndicator size="small" color={TEAL} />
                            </View>
                        </View>
                    )}

                    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask a question..."
                            placeholderTextColor="#999"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
                            onPress={sendMessage}
                            disabled={!input.trim() || loading}
                        >
                            <Ionicons name="arrow-up" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fabWrap: {
        position: "absolute",
        zIndex: 999,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: TEAL,
        justifyContent: "center",
        alignItems: "center",
    },
    modal: { flex: 1, backgroundColor: "#F7F8FA" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: TEAL, paddingHorizontal: 16, paddingBottom: 14,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerIcon: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: "#FFF" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 1 },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
    },
    msgList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
    msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
    msgRowUser: { justifyContent: "flex-end" },
    msgAvatar: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: TEAL,
        justifyContent: "center", alignItems: "center", marginRight: 8,
    },
    msgBubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    msgBubbleUser: { backgroundColor: TEAL, borderBottomRightRadius: 4 },
    msgBubbleAI: { backgroundColor: "#FFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#F0F0F0" },
    msgText: { fontSize: 15, lineHeight: 21 },
    msgTextUser: { color: "#FFF" },
    msgTextAI: { color: "#1F2524" },
    typingRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, paddingHorizontal: 16 },
    inputBar: {
        flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F0F0F0", gap: 8,
    },
    input: {
        flex: 1, backgroundColor: "#F7F8FA", borderRadius: 20, paddingHorizontal: 16,
        paddingVertical: 10, fontSize: 15, color: "#1F2524", maxHeight: 100, borderWidth: 1, borderColor: "#E8E8E8",
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: TEAL,
        justifyContent: "center", alignItems: "center",
    },
});
