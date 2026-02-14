import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

// 카드 민트 바탕 -> 베스트셀러 배경

export default function SectionBox({
                                       title,
                                       variant = "plain",
                                       children,
                                   }: {
    title: string;
    variant?: "plain" | "mint";
    children: React.ReactNode;
}) {
    return (
        <View style={[styles.box, variant === "mint" && styles.mint]}>
            <Text style={styles.title}>{title}</Text>
            <View style={{ marginTop: 10 }}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    box: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
    mint: { backgroundColor: COLORS.mintLight },
    title: { fontSize: 13, fontWeight: "800", color: COLORS.stepGreen },
});