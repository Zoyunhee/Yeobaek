import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

export default function MessageBubble({
                                          isMe,
                                          text,
                                          senderName,
                                          variant = "group",
                                      }: {
    isMe: boolean;
    text: string;
    senderName?: string;
    variant?: "ai" | "group";
}) {
    const isQuestion = variant === "ai" && !isMe && text.includes("?");

    return (
        <View
            style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                maxWidth: "78%",
                marginVertical: 6,
            }}
        >
            {!isMe && senderName ? (
                <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
                    {senderName}
                </Text>
            ) : null}

            <View
                style={{
                    backgroundColor: isMe ? COLORS.mint : COLORS.mintLight,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderTopRightRadius: isMe ? 6 : 16,
                    borderTopLeftRadius: isMe ? 16 : 6,
                    borderWidth: isQuestion ? 1.5 : 0,
                    borderColor: isQuestion ? COLORS.mint : "transparent",
                }}
            >
                <Text style={{ color: COLORS.primary, lineHeight: 20 }}>{text}</Text>
            </View>
        </View>
    );
}