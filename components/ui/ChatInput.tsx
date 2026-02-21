// components/ui/ChatInput.tsx
import React, { useMemo, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
    const [value, setValue] = useState("");
    const [contentH, setContentH] = useState(18);

    const minH = 34;   // ✅ 얇게
    const maxH = 84;   // ✅ 너무 커지지 않게

    const inputH = useMemo(() => Math.min(maxH, Math.max(minH, contentH + 10)), [contentH]);

    const send = () => {
        const t = value.trim();
        if (!t) return;
        onSend(t);
        setValue("");
        setContentH(18);
        Keyboard.dismiss();
    };

    return (
        <View
            style={{
                flexDirection: "row",
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,                 // ✅ 얇게
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                backgroundColor: COLORS.bg,
                alignItems: "flex-end",
            }}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: COLORS.white,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,              // ✅ 얇게
                }}
            >
                <TextInput
                    value={value}
                    onChangeText={setValue}
                    placeholder="메시지..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                    style={{
                        color: COLORS.text,
                        fontSize: 15,
                        height: inputH,
                        padding: 0,                    // ✅ iOS/Android 두께 줄이는 핵심
                        margin: 0,
                    }}
                    onContentSizeChange={(e) => setContentH(e.nativeEvent.contentSize.height)}
                    returnKeyType="send"
                    blurOnSubmit={false}
                />
            </View>

            <Pressable
                onPress={send}
                style={{
                    width: 44,
                    height: 44,                      // ✅ 버튼도 살짝 줄임
                    borderRadius: 10,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name="send" size={18} color={COLORS.white} />
            </Pressable>
        </View>
    );
}
