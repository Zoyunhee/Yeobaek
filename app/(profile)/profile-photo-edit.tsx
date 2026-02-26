import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";

const DEFAULT_AVATAR = require("../../assets/images/default-avatar.png");
const PROFILE_AVATAR_URI_KEY = "profile_avatar_uri_v1";

export default function ProfilePhotoEdit() {
    const router = useRouter();

    const [savedUri, setSavedUri] = useState<string | null>(null);
    const [draftUri, setDraftUri] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem(PROFILE_AVATAR_URI_KEY);
            const initial = saved && saved.trim().length > 0 ? saved : null;
            setSavedUri(initial);
            setDraftUri(initial);
        })();
    }, []);

    const hasChanges = useMemo(() => savedUri !== draftUri, [savedUri, draftUri]);

    const avatarSource = useMemo(() => {
        return draftUri ? ({ uri: draftUri } as any) : DEFAULT_AVATAR;
    }, [draftUri]);

    const pickFromGallery = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("권한 필요", "갤러리 접근 권한을 허용해 주세요.");
            return;
        }

        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });

        if (res.canceled) return;
        const uri = res.assets?.[0]?.uri;
        if (uri) setDraftUri(uri);
    };

    const resetToDefault = () => {
        if (!draftUri) return;

        Alert.alert("기본 이미지로 변경", "기본 이미지로 되돌릴까요?", [
            { text: "취소", style: "cancel" },
            { text: "변경", style: "destructive", onPress: () => setDraftUri(null) },
        ]);
    };

    const save = async () => {
        if (!draftUri) {
            await AsyncStorage.removeItem(PROFILE_AVATAR_URI_KEY);
            setSavedUri(null);
            Alert.alert("완료", "프로필 사진이 변경됐어요.", [{ text: "확인", onPress: () => router.back() }]);
            return;
        }

        await AsyncStorage.setItem(PROFILE_AVATAR_URI_KEY, draftUri);
        setSavedUri(draftUri);
        Alert.alert("완료", "프로필 사진이 변경됐어요.", [{ text: "확인", onPress: () => router.back() }]);
    };

    const onClose = () => {
        if (!hasChanges) {
            router.back();
            return;
        }
        Alert.alert("변경사항이 있어요", "저장하지 않고 나갈까요?", [
            { text: "계속 편집", style: "cancel" },
            { text: "나가기", style: "destructive", onPress: () => router.back() },
        ]);
    };

    return (
        <SafeAreaView style={s.safe}>
            {/* 상단 헤더 */}
            <View style={s.header}>
                <Pressable onPress={onClose} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>

                <Text style={s.headerTitle}>프로필 사진 변경</Text>

                <View style={{ width: 36 }} />
            </View>

            {/* 본문 카드 */}
            <View style={s.card}>
                {/* 미리보기 */}
                <View style={s.previewWrap}>
                    <View style={s.avatarRing}>
                        <Image source={avatarSource} style={s.avatar} />
                    </View>
                </View>

                {/* 두 버튼: 같은 색(secondary)으로 통일 */}
                <AppButton title="갤러리에서 선택" variant="secondary" onPress={pickFromGallery} />

                <AppButton
                    title="기본 이미지로"
                    variant="secondary"
                    onPress={resetToDefault}
                    disabled={!draftUri}
                    style={{ marginTop: 12 }}
                />

                {/*  저장 버튼: 위 두 버튼보다 여백 더 주고 색 다르게(primary) */}
                <View style={s.saveGap} />
                <AppButton title="저장" onPress={save} disabled={!hasChanges} />
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },

    header: {
        height: 52,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: COLORS.primary,
    },

    card: {
        marginTop: 8,
        marginHorizontal: 18,
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    previewWrap: {
        alignItems: "center",
        marginBottom: 16,
    },

    avatarRing: {
        width: 154,
        height: 154,
        borderRadius: 77,
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },

    avatar: {
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: COLORS.secondary,
    },

    previewHint: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.muted,
    },

    // 저장 버튼 위 여백(2버튼과 저장 버튼 구분)
    saveGap: {
        height: 22,
    },
});