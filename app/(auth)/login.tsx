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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import AppInput from "@/components/ui/AppInput";
import AppButton from "@/components/ui/AppButton";
import { COLORS } from "@/constants/colors";

import AsyncStorage from "@react-native-async-storage/async-storage";

const SIGNUP_PENDING_KEY = "signup_pending_pref_v1";
const PREF_DONE_KEY = "pref_done_v1";

export default function Login() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const pwRef = useRef<TextInput>(null);

    const onSubmit = async () => {
        // TODO: 백엔드 붙이면 여기서 로그인 API 호출 후 "성공"일 때만 아래 실행

        const signupPending = await AsyncStorage.getItem(SIGNUP_PENDING_KEY);
        const prefDone = await AsyncStorage.getItem(PREF_DONE_KEY);

        // ✅ 회원가입 직후 첫 로그인만 preferences
        if (signupPending === "true" && prefDone !== "true") {
            router.replace("/(auth)/categoryselect");
            return;
        }

        router.replace("/(tabs)");
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

                            <AppButton title="계속" onPress={onSubmit} variant="primary" style={styles.btn} />

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
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, paddingHorizontal: 28, paddingTop: 80 },
    logo: {
        fontSize: 42,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 60,
    },
    input: { marginBottom: 14 },
    btn: { height: 48, borderRadius: 6 },
    dividerWrap: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 26,
    },
    divider: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
    orText: { marginHorizontal: 12, fontSize: 12, color: COLORS.muted },
});
