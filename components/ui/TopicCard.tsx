import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/constants/colors";

export default function TopicCard({ title, body }: { title: string; body: string }) {
    return (
        <View style={{ backgroundColor: COLORS.mintLight, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.mint }}>
            <Text style={{ color: COLORS.primary, fontWeight: "900", marginBottom: 6 }}>{title}</Text>
            <Text style={{ color: COLORS.primaryDark, lineHeight: 20 }}>{body}</Text>
        </View>
    );
}
// 발제문 카드