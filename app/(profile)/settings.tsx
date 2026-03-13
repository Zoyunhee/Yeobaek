import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { logout } from "@/services/api";

function Row({
                 icon,
                 title,
                 onPress,
             }: {
    icon: any;
    title: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [s.row, pressed && { opacity: 0.92 }]}
        >
            <View style={s.rowIcon}>
                <IconSymbol name={icon} size={18} color={COLORS.primary} />
            </View>

            <Text style={s.rowTitle}>{title}</Text>
            <View style={{ flex: 1 }} />
            <Text style={s.chev}>›</Text>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        Alert.alert("로그아웃", "정말 로그아웃 할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "로그아웃",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);

                        await logout();

                        await AsyncStorage.removeItem("user");

                        router.replace("/(auth)/login");
                    } catch (e: any) {
                        Alert.alert("로그아웃", e?.message ?? "로그아웃 중 오류가 발생했어요.");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.down" size={20} color={COLORS.primary} />
                </Pressable>
                <Text style={s.headerTitle}>개인 정보 설정</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={s.card}>
                <Text style={s.sectionTitle}>계정</Text>

                <Row
                    icon="person"
                    title="닉네임 변경"
                    onPress={() => router.push("/(profile)/name-edit")}
                />
                <View style={s.divider} />

                <Row
                    icon="lock"
                    title="비밀번호 변경"
                    onPress={() => router.push("/(profile)/password-edit")}
                />
                <View style={s.divider} />

                <Row
                    icon="photo"
                    title="프로필 사진 변경"
                    onPress={() => router.push("/(profile)/profile-photo-edit")}
                />
            </View>

            <Pressable onPress={handleLogout} style={s.logoutWrap} disabled={loading}>
                <Text style={s.logoutText}>{loading ? "로그아웃 중..." : "로그아웃"}</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 18 },

    header: {
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: COLORS.primary,
    },

    card: {
        marginTop: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        padding: 14,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.stepGreen,
        marginBottom: 8,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
    },
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: COLORS.secondary,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.primary,
    },
    chev: {
        fontSize: 22,
        fontWeight: "900",
        color: COLORS.muted,
        marginTop: -2,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },

    logoutWrap: {
        marginTop: 28,
        alignItems: "center",
        paddingVertical: 12,
    },

    logoutText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.muted,
    },
});