import React from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { MoodScore } from "@/src/chat/types";

const items: { score: MoodScore; label: string }[] = [
    { score: 5, label: "5 매우 좋음" },
    { score: 4, label: "4 약간 좋음" },
    { score: 3, label: "3 그저 그럼" },
    { score: 2, label: "2 기분 안 좋음" },
    { score: 1, label: "1 슬픔" },
    { score: 0, label: "0 화남" },
];

export default function MoodSelector({ value, onChange }: { value: MoodScore | null; onChange: (v: MoodScore) => void }) {
    return (
        <View style={{ gap: 10 }}>
            {items.map((it) => {
                const active = value === it.score;
                return (
                    <Pressable
                        key={it.score}
                        onPress={() => onChange(it.score)}
                        style={{
                            paddingVertical: 10,
                            borderRadius: 999,
                            alignItems: "center",
                            backgroundColor: active ? COLORS.primary : COLORS.secondary,
                        }}
                    >
                        <Text style={{ color: active ? COLORS.white : COLORS.primary, fontWeight: "900" }}>{it.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
