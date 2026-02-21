import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

export default function MessageBubble({ isMe, text, senderName }: { isMe: boolean; text: string; senderName?: string }) {
    return (
        <View style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "78%", marginVertical: 6 }}>
            {!isMe && senderName ? <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>{senderName}</Text> : null}
            <View
                style={{
                    backgroundColor: isMe ? COLORS.mint : COLORS.mintLight,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderTopRightRadius: isMe ? 6 : 16,
                    borderTopLeftRadius: isMe ? 16 : 6,
                }}
            >
                <Text style={{ color: COLORS.primary, lineHeight: 20 }}>{text}</Text>
            </View>
        </View>
    );
}
