import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Chapter } from "@/lib/types";

interface NextChapterCardProps {
  chapter: Chapter;
  isLocked: boolean;
}

export default function NextChapterCard({
  chapter,
  isLocked,
}: NextChapterCardProps) {
  return (
    <View style={[styles.container, isLocked && styles.containerLocked]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, isLocked && styles.iconContainerLocked]}>
          <Ionicons
            name={isLocked ? "lock-closed" : "book-outline"}
            size={32}
            color={isLocked ? "#999" : "#F2B138"}
          />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Next Chapter</Text>
            {isLocked && (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Locked</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, isLocked && styles.titleLocked]}>
            {chapter.title}
          </Text>
          {isLocked && (
            <View style={styles.tooltip}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.tooltipText}>
                Score 80% on the previous quiz to unlock
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  containerLocked: {
    opacity: 0.7,
    borderColor: "#D0D0D0",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconContainerLocked: {
    backgroundColor: "#F5F5F5",
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
  },
  lockedBadge: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#282F2E",
    marginBottom: 8,
  },
  titleLocked: {
    color: "#999",
  },
  tooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  tooltipText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
});
