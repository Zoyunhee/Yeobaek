import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";

const PASSWORD_KEY = "profile_password_dummy_v1"; // 백엔드 붙이면 API로 교체

function isValidPw(pw: string) {
    if (pw.length < 8 || pw.length > 16) return false;
    const hasAlpha = /[A-Za-z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    return hasAlpha && hasNum && hasSpecial;
}

export default function PasswordEdit() {
    const router = useRouter();
    const ref2 = useRef<TextInput>(null);
    const [pw1, setPw1] = useState("");
    const [pw2, setPw2] = useState("");

    const onSubmit = async () => {
        if (!isValidPw(pw1)) {
            Alert.alert("비밀번호", "8~16자, 영문/숫자/특수문자를 포함해 주세요.");
            return;
        }
        if (pw1 !== pw2) {
            Alert.alert("비밀번호", "비밀번호가 일치하지 않아요.");
            return;
        }
        await AsyncStorage.setItem(PASSWORD_KEY, pw1); // 임시 저장
        Alert.alert("완료", "비밀번호가 변경됐어요. (임시 저장)", [{ text: "확인", onPress: () => router.back() }]);
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>
                <Text style={s.headerTitle}>비밀번호 변경</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={s.card}>
                <Text style={s.label}>새 비밀번호 *</Text>
                <AppInput
                    value={pw1}
                    onChangeText={setPw1}
                    placeholder="8~16자, 영문/숫자/특수문자 포함"
                    secureTextEntry
                    returnKeyType="next"
                    onSubmitEditing={() => ref2.current?.focus()}
                />

                <Text style={[s.label, { marginTop: 12 }]}>새 비밀번호 확인 *</Text>
                <AppInput
                    ref={ref2}
                    value={pw2}
                    onChangeText={setPw2}
                    placeholder="다시 한 번 입력"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                />

                <AppButton title="완료" onPress={onSubmit} style={{ marginTop: 14 }} />
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 18 },
    header: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerBtn: {
        width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    },
    headerTitle: { fontSize: 16, fontWeight: "900", color: COLORS.primary },

    card: {
        marginTop: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 18, padding: 16,
    },
    label: { fontSize: 13, fontWeight: "900", color: COLORS.primary, marginBottom: 8 },
});