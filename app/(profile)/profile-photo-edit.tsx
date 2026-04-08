import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AppButton from "@/components/ui/AppButton";
import { deleteProfileImage, getMyProfile, uploadProfileImage } from "@/services/api";

const DEFAULT_AVATAR = require("../../assets/images/default-avatar.png");

export default function ProfilePhotoEdit() {
    const router = useRouter();

    const [userId, setUserId] = useState<number | null>(null);
    const [savedUri, setSavedUri] = useState<string | null>(null);
    const [draftUri, setDraftUri] = useState<string | null>(null);
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
                const initial = profile?.data?.profileImage ?? null;

                setSavedUri(initial);
                setDraftUri(initial);
            } catch (e) {
                Alert.alert("오류", "프로필 사진 정보를 불러오지 못했어요.");
            }
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
        if (uri) {
            setDraftUri(uri);
        }
    };

    const resetToDefault = () => {
        if (!draftUri) return;

        Alert.alert("기본 이미지로 변경", "기본 이미지로 되돌릴까요?", [
            { text: "취소", style: "cancel" },
            {
                text: "변경",
                style: "destructive",
                onPress: () => setDraftUri(null),
            },
        ]);
    };

    const save = async () => {
        if (!userId) {
            Alert.alert("오류", "로그인 정보가 없어요. 다시 로그인해 주세요.");
            return;
        }

        try {
            setLoading(true);

            if (!draftUri) {
                const res = await deleteProfileImage(userId);
                setSavedUri(null);
                setDraftUri(null);

                Alert.alert("완료", res.message || "프로필 사진이 변경됐어요.", [
                    {
                        text: "확인",
                        onPress: () => router.back(),
                    },
                ]);
                return;
            }

            if (draftUri !== savedUri) {
                const res = await uploadProfileImage(userId, draftUri);
                const nextUri = res.imageUrl ?? draftUri;

                setSavedUri(nextUri);
                setDraftUri(nextUri);

                Alert.alert("완료", res.message || "프로필 사진이 변경됐어요.", [
                    {
                        text: "확인",
                        onPress: () => router.back(),
                    },
                ]);
            }
        } catch (e: any) {
            Alert.alert("프로필 사진", e?.message ?? "프로필 사진 변경 중 오류가 발생했어요.");
        } finally {
            setLoading(false);
        }
    };

    const onClose = () => {
        if (!hasChanges) {
            router.back();
            return;
        }

        Alert.alert("변경사항이 있어요", "저장하지 않고 나갈까요?", [
            { text: "계속 편집", style: "cancel" },
            {
                text: "나가기",
                style: "destructive",
                onPress: () => router.back(),
            },
        ]);
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <Pressable onPress={onClose} hitSlop={12} style={s.headerBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>

                <Text style={s.headerTitle}>프로필 사진 변경</Text>

                <View style={{ width: 36 }} />
            </View>

            <View style={s.card}>
                <View style={s.previewWrap}>
                    <View style={s.avatarRing}>
                        <Image source={avatarSource} style={s.avatar} />
                    </View>
                </View>

                <AppButton
                    title="갤러리에서 선택"
                    variant="secondary"
                    onPress={pickFromGallery}
                    disabled={loading}
                />

                <AppButton
                    title="기본 이미지로"
                    variant="secondary"
                    onPress={resetToDefault}
                    disabled={!draftUri || loading}
                    style={{ marginTop: 12 }}
                />

                <View style={s.saveGap} />

                <AppButton
                    title={loading ? "저장 중..." : "저장"}
                    onPress={save}
                    disabled={!hasChanges || loading}
                />
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

    saveGap: {
        height: 22,
    },
});