import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import { getMyProfile, updateNickname } from "@/services/api";

function isValidNickname(value: string) {
    return /^[가-힣a-zA-Z0-9]{2,10}$/.test(value);
}

export default function NameEdit() {
    const router = useRouter();
    const ref = useRef<TextInput>(null);

    const [nickname, setNickname] = useState("");
    const [originalNickname, setOriginalNickname] = useState("");
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const rawUser = await AsyncStorage.getItem("user");
                if (!rawUser) {
                    Alert.alert("오류", "로그인 정보가 없어요. 다시 로그인해 주세요.");
                    return;
                }

                const user = JSON.parse(rawUser);
                const id = Number(user.id);

                if (!id) {
                    Alert.alert("오류", "사용자 정보를 확인할 수 없어요.");
                    return;
                }

                setUserId(id);

                const profile = await getMyProfile(id);
                const currentNickname = profile?.data?.nickname ?? "";

                setNickname(currentNickname);
                setOriginalNickname(currentNickname);

                setTimeout(() => {
                    ref.current?.focus();
                }, 200);
            } catch (e) {
                Alert.alert("오류", "프로필 정보를 불러오지 못했습니다.");
            }
        })();
    }, []);

    const onSubmit = async () => {
        const v = nickname.trim();

        if (!userId) {
            Alert.alert("오류", "로그인 정보가 없어요. 다시 로그인해 주세요.");
            return;
        }

        if (!isValidNickname(v)) {
            Alert.alert("닉네임", "닉네임은 2~10자, 한글/영문/숫자만 가능해요.");
            return;
        }

        if (v === originalNickname) {
            Alert.alert("닉네임", "기존 닉네임과 동일해요.");
            return;
        }

        try {
            setLoading(true);

            const res = await updateNickname(userId, v);

            const rawUser = await AsyncStorage.getItem("user");
            if (rawUser) {
                const user = JSON.parse(rawUser);
                const updatedUser = {
                    ...user,
                    nickname: res.nickname ?? v,
                };
                await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            }

            Alert.alert("완료", res.message || "닉네임이 변경되었습니다.", [
                {
                    text: "확인",
                    onPress: () => router.back(),
                },
            ]);
        } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "닉네임 변경 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>
                <Text style={s.headerTitle}>닉네임 변경</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={s.card}>
                <Text style={s.label}>닉네임 *</Text>
                <AppInput
                    ref={ref}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="2~10자, 한글/영문/숫자"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                />

                <AppButton
                    title={loading ? "변경 중..." : "완료"}
                    onPress={onSubmit}
                    style={{ marginTop: 14 }}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 18 },
    header: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
    headerTitle: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
    card: {
        marginTop: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        padding: 16,
    },
    label: { fontSize: 13, fontWeight: "900", color: COLORS.primary, marginBottom: 8 },
});