import { View, type TextStyle, type ViewStyle } from "react-native";
import Markdown, { type MarkdownProps } from "react-native-markdown-display";

interface SafeMarkdownProps {
    markdown: string;
    markdownStyle?: MarkdownProps["style"] & Record<string, unknown>;
    flavor?: "commonmark" | "github";
    textStyle?: TextStyle;
    compact?: boolean;
    containerStyle?: ViewStyle;
}

const defaultMarkdownStyle = {
    body: {
        color: "#374151",
        fontSize: 16,
        lineHeight: 24,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 12,
    },
    heading1: {
        color: "#1F2524",
        fontSize: 24,
        lineHeight: 30,
        marginTop: 18,
        marginBottom: 10,
    },
    heading2: {
        color: "#1F2524",
        fontSize: 21,
        lineHeight: 27,
        marginTop: 16,
        marginBottom: 8,
    },
    heading3: {
        color: "#1F2524",
        fontSize: 18,
        lineHeight: 24,
        marginTop: 14,
        marginBottom: 6,
    },
    heading4: {
        color: "#1F2524",
        fontSize: 16,
        lineHeight: 22,
        marginTop: 12,
        marginBottom: 4,
    },
    strong: { fontWeight: "700" as const },
    em: { fontStyle: "italic" as const },
    link: {
        color: "#084A59",
        textDecorationLine: "underline" as const,
    },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    list_item: { marginBottom: 4 },
    blockquote: {
        backgroundColor: "#F3F4F6",
        borderColor: "#084A59",
        borderLeftWidth: 3,
        marginLeft: 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    code_inline: {
        backgroundColor: "#F0F0F0",
        color: "#B45309",
        fontSize: 14,
        paddingHorizontal: 4,
    },
    code_block: {
        backgroundColor: "#1F2937",
        borderColor: "#1F2937",
        color: "#E5E7EB",
        marginBottom: 12,
        padding: 12,
    },
    fence: {
        backgroundColor: "#1F2937",
        borderColor: "#1F2937",
        color: "#E5E7EB",
        marginBottom: 12,
        padding: 12,
    },
};

export default function SafeMarkdown({
    markdown,
    markdownStyle,
    textStyle,
    compact = false,
    containerStyle,
}: SafeMarkdownProps) {
    const customStyle = markdownStyle ?? {};
    const paragraphStyle = compact
        ? { marginTop: 0, marginBottom: 0 }
        : defaultMarkdownStyle.paragraph;

    return (
        <View style={containerStyle}>
            <Markdown
                style={{
                    ...defaultMarkdownStyle,
                    ...customStyle,
                    paragraph: {
                        ...paragraphStyle,
                        ...(customStyle.paragraph as object | undefined),
                    },
                    body: {
                        ...defaultMarkdownStyle.body,
                        ...(compact && { fontSize: 15, lineHeight: 21 }),
                        ...(customStyle.body as object | undefined),
                        ...textStyle,
                    },
                    heading1: customStyle.heading1 ?? customStyle.h1,
                    heading2: customStyle.heading2 ?? customStyle.h2,
                    heading3: customStyle.heading3 ?? customStyle.h3,
                    heading4: customStyle.heading4 ?? customStyle.h4,
                    code_inline: customStyle.code_inline ?? customStyle.code,
                    code_block: customStyle.code_block ?? customStyle.codeBlock,
                    fence: customStyle.fence ?? customStyle.codeBlock,
                    link: {
                        ...defaultMarkdownStyle.link,
                        ...(customStyle.link as object | undefined),
                        ...(customStyle.link && {
                            textDecorationLine: (customStyle.link as { underline?: boolean }).underline
                                ? "underline"
                                : undefined,
                        }),
                    },
                }}
            >
                {markdown}
            </Markdown>
        </View>
    );
}
