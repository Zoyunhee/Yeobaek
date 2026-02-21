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

export default function Login() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const pwRef = useRef<TextInput>(null);

    const onSubmit = async () => {
        // ✅ 개발용: 로그인 성공했다고 치고 무조건 취향선택 화면으로
        router.replace("/(auth)/categoryselect");
    };

    const goJoin = () => router.push("/(auth)/join");

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safeArea}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
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

                            <AppButton title="회원가입 하러 가기" onPress={goJoin} variant="secondary" style={styles.btn} />
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