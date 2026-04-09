import { useRef, useState } from "react";
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import AppInput from "@/components/ui/AppInput";
import AppButton from "@/components/ui/AppButton";
import { COLORS } from "@/constants/colors";
import { login } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const pwRef = useRef<TextInput>(null);

    const saveUserToStorage = async (data: {
        id: number;
        userId: string;
        name: string;
        nickname?: string;
        email?: string;
        role: string;
        surveyCompleted: boolean;
    }) => {
        await AsyncStorage.setItem(
            "user",
            JSON.stringify({
                id: data.id,
                userId: data.userId,
                name: data.name,
                nickname: data.nickname ?? "",
                email: data.email ?? "",
                role: data.role,
                surveyCompleted: data.surveyCompleted,
            })
        );

        await AsyncStorage.setItem("auth_user_id", String(data.id));
        await AsyncStorage.setItem("auth_user_nickname", data.nickname ?? "");
        await AsyncStorage.setItem("auth_user_email", data.email ?? "");
    };

    const onSubmit = async () => {
        try {
            const data = await login(username.trim(), password);

            await saveUserToStorage({
                id: data.id,
                userId: data.userId,
                name: data.name,
                nickname: data.nickname ?? "",
                email: data.email ?? "",
                role: data.role,
                surveyCompleted: data.surveyCompleted,
            });

            if (data.surveyCompleted) {
                router.replace("/(tabs)");
            } else {
                router.replace("/(auth)/categoryselect");
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "로그인에 실패했습니다.";
            Alert.alert("로그인 실패", message);
        }
    };

    const onDevLogin = async () => {
        try {
            await saveUserToStorage({
                id: 1,
                userId: "testuser",
                name: "테스트 유저",
                nickname: "테스트계정",
                email: "test@test.com",
                role: "USER",
                surveyCompleted: true,
            });

            Alert.alert("테스트 로그인", "임시 로그인 처리되었습니다.");
            router.replace("/(tabs)");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "테스트 로그인에 실패했습니다.";
            Alert.alert("오류", message);
        }
    };

    const goJoin = () => router.push("/(auth)/join");

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safeArea}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.container}>
                            <Text style={styles.logo}>여백 餘白</Text>

                            <AppInput
                                placeholder="아이디"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => pwRef.current?.focus()}
                                style={styles.input}
                            />

                            <AppInput
                                ref={pwRef}
                                placeholder="비밀번호"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={onSubmit}
                                style={styles.input}
                            />

                            <AppButton
                                title="계속"
                                onPress={onSubmit}
                                variant="primary"
                                style={styles.btn}
                            />

                            <View style={styles.dividerWrap}>
                                <View style={styles.divider} />
                                <Text style={styles.orText}>또는</Text>
                                <View style={styles.divider} />
                            </View>

                            <AppButton
                                title="회원가입 하러 가기"
                                onPress={goJoin}
                                variant="secondary"
                                style={styles.btn}
                            />

                            <Pressable
                                onPress={onDevLogin}
                                style={({ pressed }) => [
                                    styles.devLoginBtn,
                                    pressed && { opacity: 0.8 },
                                ]}
                            >
                                <Text style={styles.devLoginText}>
                                    테스트용 로그인 건너뛰기
                                </Text>
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },

    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 80,
    },

    logo: {
        fontSize: 42,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 60,
    },

    input: {
        marginBottom: 14,
    },

    btn: {
        height: 48,
        borderRadius: 6,
    },

    dividerWrap: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 26,
    },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E0E0E0",
    },

    orText: {
        marginHorizontal: 12,
        fontSize: 12,
        color: COLORS.muted,
    },

    devLoginBtn: {
        marginTop: 18,
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
    },

    devLoginText: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.primary,
        textDecorationLine: "underline",
    },
});

// 테스트 로그인 버튼 나중에 삭제