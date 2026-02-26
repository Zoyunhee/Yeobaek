import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";

const AUTH_TOKEN_KEY = "auth_token_v1"; // 너네 로그인 방식에 맞게 키만 바꿔줘

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
        <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.92 }]}>
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

    const onLogout = () => {
        Alert.alert("로그아웃", "정말 로그아웃 할까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "로그아웃",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                    router.replace("/(auth)/login");
                },
            },
        ]);
    };

    const handleLogout = async () => {
        await AsyncStorage.clear(); // 필요 없으면 삭제 가능

        router.replace("/(auth)/login"); // 로그인 화면 경로에 맞게 수정
    };

    return (
        <SafeAreaView style={s.safe}>
            {/* 헤더 */}
            <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.down" size={20} color={COLORS.primary} />
                </Pressable>
                <Text style={s.headerTitle}>개인 정보 설정</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* 메뉴 카드 */}
            <View style={s.card}>
                <Text style={s.sectionTitle}>계정</Text>

                <Row icon="person" title="닉네임 변경" onPress={() => router.push("/(profile)/name-edit")} />
                <View style={s.divider} />

                <Row icon="lock" title="비밀번호 변경" onPress={() => router.push("/(profile)/password-edit")} />
                <View style={s.divider} />

                <Row icon="photo" title="프로필 사진 변경" onPress={() => router.push("/(profile)/profile-photo-edit")} />
            </View>

            {/* 로그아웃 */}
            <Pressable onPress={handleLogout} style={s.logoutWrap}>
                <Text style={s.logoutText}>로그아웃</Text>
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
        paddingVertical: 12, // 터치여백
    },

    logoutText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.muted, // 또는 COLORS.primary
    },
});