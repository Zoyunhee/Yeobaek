import { useRef, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Text,
    Pressable,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppInput from "@/components/ui/AppInput";
import AppButton from "@/components/ui/AppButton";
import { COLORS } from "@/constants/colors";

/** 인증코드 오류 다이알로그(간단 Modal) */
function ErrorDialog({
                         visible,
                         title = "Error!",
                         message,
                         onClose,
                     }: {
    visible: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={dialogStyles.backdrop}>
                <View style={dialogStyles.card}>
                    <Text style={dialogStyles.title}>{title}</Text>
                    <Text style={dialogStyles.message}>{message}</Text>

                    <Pressable onPress={onClose} style={dialogStyles.okBtn} hitSlop={8}>
                        <Text style={dialogStyles.okText}>확인</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

/** secondary 컬러 버튼 (인증코드 전송/확인) */
function SecondaryButton({
                             title,
                             onPress,
                             disabled,
                         }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                secondaryBtnStyles.btn,
                pressed && !disabled && { opacity: 0.9 },
                disabled && { opacity: 0.5 },
            ]}
        >
            <Text style={secondaryBtnStyles.text}>{title}</Text>
        </Pressable>
    );
}

export default function Join() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [nickname, setNickname] = useState("");

    // 이메일 본인인증
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [serverCode, setServerCode] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState(false);

    // 오류 다이알로그
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("인증코드가 틀렸습니다. 다시 입력하십시오");

    const pwRef = useRef<TextInput>(null);
    const pw2Ref = useRef<TextInput>(null);
    const nickRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const codeRef = useRef<TextInput>(null);

    const createAccount = () => {
        // TODO: 실제 회원가입/검증 로직 연결
        router.replace("/login");
    };

    const sendVerificationCode = () => {
        // TODO: 서버 API 연동
        // 데모용 6자리 코드 생성
        const generated = String(Math.floor(100000 + Math.random() * 900000));
        setServerCode(generated);
        setEmailVerified(false);
        setCode("");
        // 필요하면 여기서 토스트/문구 표시
    };

    const verifyCode = () => {
        if (!serverCode) return;

        const ok = code.trim() === serverCode;
        if (!ok) {
            setErrorMessage("인증코드가 틀렸습니다. 다시 입력하십시오");
            setErrorVisible(true);
            return;
        }
        setEmailVerified(true);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>회원가입</Text>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                        <Text style={styles.label}>아이디 *</Text>
                        <AppInput
                            placeholder="4 - 20자, 영문 + 숫자만 사용"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            onSubmitEditing={() => pwRef.current?.focus()}
                            style={styles.input}
                        />

                        <Text style={styles.label}>비밀번호 *</Text>
                        <AppInput
                            ref={pwRef}
                            placeholder="8 - 16자, 영문 대소문자, 숫자, 특수문자"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            returnKeyType="next"
                            onSubmitEditing={() => pw2Ref.current?.focus()}
                            style={styles.input}
                        />

                        <Text style={styles.label}>비밀번호 확인 *</Text>
                        <AppInput
                            ref={pw2Ref}
                            placeholder="비밀번호를 다시 입력하세요"
                            value={password2}
                            onChangeText={setPassword2}
                            secureTextEntry
                            returnKeyType="next"
                            onSubmitEditing={() => nickRef.current?.focus()}
                            style={styles.input}
                        />

                        <Text style={styles.label}>닉네임 *</Text>
                        <AppInput
                            ref={nickRef}
                            placeholder="2 - 10자"
                            value={nickname}
                            onChangeText={setNickname}
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            style={styles.input}
                        />

                        {/* 이메일 본인인증 추가 */}
                        <Text style={styles.label}>이메일 본인 인증 *</Text>
                        <AppInput
                            ref={emailRef}
                            placeholder="이메일 입력"
                            value={email}
                            onChangeText={(t) => {
                                setEmail(t);
                                setEmailVerified(false);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="done"
                            onSubmitEditing={sendVerificationCode}
                            style={styles.input}
                        />

                        <SecondaryButton
                            title="인증코드 전송하기"
                            onPress={sendVerificationCode}
                            disabled={!email.trim()}
                        />

                        <View style={{ height: 12 }} />

                        <AppInput
                            ref={codeRef}
                            placeholder="인증코드 입력"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            returnKeyType="done"
                            onSubmitEditing={verifyCode}
                            style={styles.input}
                        />

                        <SecondaryButton
                            title={emailVerified ? "인증 완료" : "인증코드 확인하기"}
                            onPress={verifyCode}
                            disabled={!serverCode || !code.trim() || emailVerified}
                        />

                        <View style={{ height: 24 }} />

                        <AppButton title="계정 생성" onPress={createAccount} variant="primary" style={styles.cta} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <ErrorDialog
                visible={errorVisible}
                message={errorMessage}
                onClose={() => setErrorVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },

    header: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        backgroundColor: COLORS.bg,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
    },

    container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
        marginTop: 14,
        marginBottom: 8,
    },
    input: { marginBottom: 12 },
    cta: { height: 52, borderRadius: 8, marginTop: 10 },
});

const secondaryBtnStyles = StyleSheet.create({
    btn: {
        height: 48,
        borderRadius: 8,
        backgroundColor: COLORS.secondary, // secondary 색상 베이지
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    text: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
    },
});

const dialogStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    card: {
        width: "100%",
        borderRadius: 14,
        backgroundColor: COLORS.white,
        paddingTop: 18,
        paddingHorizontal: 18,
        paddingBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.text,
        marginBottom: 10,
    },
    message: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.muted,
        lineHeight: 20,
        marginBottom: 14,
    },
    okBtn: {
        height: 44,
        borderRadius: 10,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
    },
    okText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.text,
    },
});
