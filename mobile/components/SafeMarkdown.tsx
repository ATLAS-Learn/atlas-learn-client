import React from "react";
import { Text, type TextStyle } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import type { MarkdownStyle } from "react-native-enriched-markdown/src/types/MarkdownStyle";

interface SafeMarkdownProps {
    markdown: string;
    markdownStyle?: MarkdownStyle;
    flavor?: "commonmark" | "github";
    textStyle?: TextStyle;
}

class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

export default function SafeMarkdown({
    markdown,
    markdownStyle,
    flavor = "github",
    textStyle,
}: SafeMarkdownProps) {
    const fallback = (
        <Text style={[{ fontSize: 15, lineHeight: 22, color: "#1F2524" }, textStyle]}>
            {markdown}
        </Text>
    );

    return (
        <ErrorBoundary fallback={fallback}>
            <EnrichedMarkdownText
                flavor={flavor}
                markdown={markdown}
                markdownStyle={markdownStyle}
            />
        </ErrorBoundary>
    );
}
