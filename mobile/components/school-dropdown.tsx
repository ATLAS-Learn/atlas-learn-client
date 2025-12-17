import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SCHOOLS } from "@/constants/schools";

interface SchoolDropdownProps {
    selectedSchool: string;
    onSelect: (school: string) => void;
    error?: string;
}

export default function SchoolDropdown({
    selectedSchool,
    onSelect,
    error,
}: SchoolDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.inputContainer, error && styles.inputError]}
                onPress={() => setIsOpen(true)}
            >
                <Ionicons name="school" size={24} color="#B3B3B3" style={styles.icon} />
                <Text style={[styles.input, !selectedSchool && styles.placeholder]}>
                    {selectedSchool || "Select School"}
                </Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#B3B3B3"
                />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={isOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select School</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={SCHOOLS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => {
                                        onSelect(item);
                                        setIsOpen(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                    {selectedSchool === item && (
                                        <Ionicons name="checkmark" size={20} color="#F2B138" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        backgroundColor: "#F9FBFB",
        borderRadius: 16,
        paddingHorizontal: 10,
        height: 64,
    },
    inputError: {
        borderColor: "red",
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
    placeholder: {
        color: "#B3B3B3",
    },
    errorText: {
        color: "red",
        marginTop: 5,
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#282F2E",
    },
    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    optionText: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
});

