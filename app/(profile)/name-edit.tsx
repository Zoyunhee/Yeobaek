import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";

const PROFILE_NICKNAME_KEY = "profile_nickname_v1";

export default function NameEdit() {
    const router = useRouter();
    const ref = useRef<TextInput>(null);
    const [nickname, setNickname] = useState("");

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem(PROFILE_NICKNAME_KEY);
            setNickname(saved ?? "");
            setTimeout(() => ref.current?.focus(), 200);
        })();
    }, []);

    const onSubmit = async () => {
        const v = nickname.trim();
        if (v.length < 2 || v.length > 10) {
            Alert.alert("닉네임", "2~10자로 입력해 주세요.");
            return;
        }
        await AsyncStorage.setItem(PROFILE_NICKNAME_KEY, v);
        router.back();
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
                    placeholder="2~10자"
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