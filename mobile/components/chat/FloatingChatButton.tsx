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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/lib/api";

const TEAL = "#084A59";
const GOLD = "#F2B138";

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

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({ role: m.role, content: m.content }));

            const reply = await apiClient.chatWithAI({
                message: text,
                subjectName,
                chapterName,
                lessonName,
                history,
            });

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: reply,
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I couldn't respond right now. Please try again.",
            };
            setMessages((prev) => [...prev, errorMsg]);
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
                    <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAI]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <>
            {/* FAB */}
            <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* Chat Modal */}
            <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
                <KeyboardAvoidingView
                    style={styles.modal}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="sparkles" size={18} color={GOLD} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Apex AI</Text>
                                <Text style={styles.headerSub}>
                                    {subjectName || "Ask anything"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.msgList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />

                    {/* Loading */}
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

                    {/* Input */}
                    <View style={styles.inputBar}>
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
    // FAB
    fabWrap: {
        position: "absolute",
        bottom: 24,
        right: 20,
        zIndex: 999,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: TEAL,
        justifyContent: "center",
        alignItems: "center",
    },

    // Modal
    modal: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: TEAL,
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 14,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#FFF",
    },
    headerSub: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        marginTop: 1,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Messages
    msgList: {
        padding: 16,
        paddingBottom: 8,
        flexGrow: 1,
    },
    msgRow: {
        flexDirection: "row",
        marginBottom: 12,
        alignItems: "flex-end",
    },
    msgRowUser: {
        justifyContent: "flex-end",
    },
    msgAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: TEAL,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    msgBubble: {
        maxWidth: "78%",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    msgBubbleUser: {
        backgroundColor: TEAL,
        borderBottomRightRadius: 4,
    },
    msgBubbleAI: {
        backgroundColor: "#FFF",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    msgText: {
        fontSize: 15,
        lineHeight: 21,
    },
    msgTextUser: {
        color: "#FFF",
    },
    msgTextAI: {
        color: "#1F2524",
    },

    // Typing
    typingRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
        paddingHorizontal: 16,
    },

    // Input
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === "ios" ? 28 : 10,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "#F7F8FA",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: "#1F2524",
        maxHeight: 100,
        borderWidth: 1,
        borderColor: "#E8E8E8",
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: TEAL,
        justifyContent: "center",
        alignItems: "center",
    },
});
