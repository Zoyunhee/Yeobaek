import { useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Platform,
    ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import AppButton from "@/components/ui/AppButton";
import { COLORS } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { savePreferences } from "@/services/api";

type ChipValue = string;

const SIGNUP_PENDING_KEY = "signup_pending_pref_v1";
const PREF_DONE_KEY = "pref_done_v1";
const PREF_GENRES_KEY = "pref_genres_v1";
const PREF_STYLES_KEY = "pref_styles_v1";

const STEP1_MAX = 3;
const STEP2_MAX = 2;

const STEP1_GENRES: ChipValue[] = [
    "로맨스",
    "스릴러",
    "판타지",
    "SF",
    "미스터리",
    "성장소설",
    "역사소설",
    "휴먼드라마",
    "에세이",
    "인문",
    "사회",
    "철학",
    "심리",
    "자기계발",
    "경제 경영",
    "과학",
];

const STEP2_STYLES: ChipValue[] = [
    "가볍게 읽는",
    "천천히 곱씹는",
    "술술 읽히는",
    "한 권에 몰입",
    "문장 하나에 몰입",
    "짧은 글 위주",
];

const GENRE_MAP: Record<string, string> = {
    로맨스: "ROMANCE",
    스릴러: "THRILLER",
    판타지: "FANTASY",
    SF: "SF",
    미스터리: "MYSTERY",
    성장소설: "COMING_OF_AGE",
    역사소설: "HISTORICAL_FICTION",
    휴먼드라마: "HUMAN_DRAMA",
    에세이: "ESSAY",
    인문: "HUMANITIES",
    사회: "SOCIAL",
    철학: "PHILOSOPHY",
    심리: "PSYCHOLOGY",
    자기계발: "SELF_DEVELOPMENT",
    "경제 경영": "BUSINESS",
    과학: "SCIENCE",
};

const READING_STYLE_MAP: Record<string, string> = {
    "가볍게 읽는": "LIGHT_READ",
    "천천히 곱씹는": "SLOW_READ",
    "술술 읽히는": "EASY_READ",
    "한 권에 몰입": "DEEP_FOCUS_BOOK",
    "문장 하나에 몰입": "DEEP_FOCUS_SENTENCE",
    "짧은 글 위주": "SHORT_CONTENT",
};

function useSimpleToast() {
    const [msg, setMsg] = useState<string | null>(null);
    const y = useRef(new Animated.Value(20)).current;
    const op = useRef(new Animated.Value(0)).current;

    const show = (text: string) => {
        if (Platform.OS === "android") {
            ToastAndroid.show(text, ToastAndroid.SHORT);
            return;
        }

        setMsg(text);
        op.setValue(0);
        y.setValue(20);

        Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 160, useNativeDriver: true }),
            Animated.timing(y, { toValue: 0, duration: 160, useNativeDriver: true }),
        ]).start(() => {
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(op, { toValue: 0, duration: 160, useNativeDriver: true }),
                    Animated.timing(y, { toValue: 20, duration: 160, useNativeDriver: true }),
                ]).start(() => setMsg(null));
            }, 1200);
        });
    };

    const Toast = () =>
        msg ? (
            <Animated.View style={[styles.toast, { opacity: op, transform: [{ translateY: y }] }]}>
                <Text style={styles.toastText}>{msg}</Text>
            </Animated.View>
        ) : null;

    return { show, Toast };
}

function runShake(x: Animated.Value) {
    x.setValue(0);
    Animated.sequence([
        Animated.timing(x, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: -6, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: 6, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: -3, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: 3, duration: 40, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
}

function Chip({
                  label,
                  selected,
                  onPress,
                  shakeX,
              }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    shakeX: Animated.Value;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const bounce = () => {
        scale.setValue(1);
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.05, duration: 90, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
        ]).start();
    };

    const handlePress = () => {
        bounce();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ translateX: shakeX }, { scale }] }}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePress}
                style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}
            >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>#{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function Preferences() {
    const router = useRouter();
    const toast = useSimpleToast();

    const [genres, setGenres] = useState<ChipValue[]>([]);
    const [readingStyles, setReadingStyles] = useState<ChipValue[]>([]);

    const shakeMapRef = useRef<Record<string, Animated.Value>>({}).current;

    const getShakeX = (key: string) => {
        if (!shakeMapRef[key]) shakeMapRef[key] = new Animated.Value(0);
        return shakeMapRef[key];
    };

    const triggerShake = (key: string) => {
        runShake(getShakeX(key));
    };

    const canSubmit = useMemo(() => {
        return genres.length >= 1 && readingStyles.length >= 1;
    }, [genres, readingStyles]);

    const toggleStep1 = (value: ChipValue) => {
        setGenres((prev) => {
            const exists = prev.includes(value);
            if (exists) return prev.filter((v) => v !== value);

            if (prev.length >= STEP1_MAX) {
                triggerShake(value);
                toast.show(`STEP1은 최대 ${STEP1_MAX}개까지 선택할 수 있어요`);
                return prev;
            }
            return [...prev, value];
        });
    };

    const toggleStep2 = (value: ChipValue) => {
        setReadingStyles((prev) => {
            const exists = prev.includes(value);
            if (exists) return prev.filter((v) => v !== value);

            if (prev.length >= STEP2_MAX) {
                triggerShake(value);
                toast.show(`STEP2는 최대 ${STEP2_MAX}개까지 선택할 수 있어요`);
                return prev;
            }
            return [...prev, value];
        });
    };

    const onComplete = async () => {
        if (!canSubmit) {
            toast.show("STEP1, STEP2에서 최소 1개 이상 선택해주세요");
            return;
        }

        try {
            const mappedGenres = genres.map((g) => GENRE_MAP[g]).filter(Boolean);
            const mappedReadingStyles = readingStyles
                .map((s) => READING_STYLE_MAP[s])
                .filter(Boolean);

            await savePreferences({
                genres: mappedGenres,
                readingStyles: mappedReadingStyles,
            });

            await AsyncStorage.setItem(PREF_GENRES_KEY, JSON.stringify(genres));
            await AsyncStorage.setItem(PREF_STYLES_KEY, JSON.stringify(readingStyles));
            await AsyncStorage.setItem(PREF_DONE_KEY, "true");
            await AsyncStorage.removeItem(SIGNUP_PENDING_KEY);

            router.replace("/(tabs)");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "취향 저장에 실패했습니다.";
            toast.show(message);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <Text style={styles.logo}>여백 餘白</Text>
                    <Text style={styles.subtitle}>당신의 독서 취향을 알려주세요</Text>

                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.line} />
                        <Text style={styles.sectionTitle}>장르 선택</Text>
                        <View style={styles.line} />
                    </View>

                    <Text style={styles.stepTitle}>
                        <Text style={styles.stepNumber}>STEP1 </Text>
                        좋아하는 책 종류를 골라주세요 (최대 {STEP1_MAX}개)
                    </Text>
                    <Text style={styles.hint}>자주 읽는 책일수록 추천이 정확해져요</Text>

                    <View style={styles.chipWrap}>
                        {STEP1_GENRES.map((g) => (
                            <Chip
                                key={g}
                                label={g}
                                selected={genres.includes(g)}
                                onPress={() => toggleStep1(g)}
                                shakeX={getShakeX(g)}
                            />
                        ))}
                    </View>
                    <Text style={styles.countText}>
                        {genres.length}/{STEP1_MAX} 선택
                    </Text>

                    <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
                        <View style={styles.line} />
                        <Text style={styles.sectionTitle}>읽는 방식 선택</Text>
                        <View style={styles.line} />
                    </View>

                    <Text style={styles.stepTitle}>
                        <Text style={styles.stepNumber}>STEP2 </Text>
                        어떤 책이 잘 맞나요? (최대 {STEP2_MAX}개)
                    </Text>
                    <Text style={styles.hint}>평소 읽는 방식을 골라주세요</Text>

                    <View style={styles.chipWrap}>
                        {STEP2_STYLES.map((s) => (
                            <Chip
                                key={s}
                                label={s}
                                selected={readingStyles.includes(s)}
                                onPress={() => toggleStep2(s)}
                                shakeX={getShakeX(s)}
                            />
                        ))}
                    </View>
                    <Text style={styles.countText}>
                        {readingStyles.length}/{STEP2_MAX} 선택
                    </Text>

                    <AppButton
                        title="취향 선택 완료"
                        onPress={onComplete}
                        variant="primary"
                        disabled={!canSubmit}
                        style={styles.button}
                    />

                    <toast.Toast />
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: {
        paddingHorizontal: 28,
        paddingTop: 40,
        paddingBottom: 30,
    },
    logo: {
        fontSize: 42,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 18,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.primary,
        opacity: 0.3,
    },
    sectionTitle: {
        marginHorizontal: 12,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.primary,
    },
    stepTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.stepGreen,
    },
    stepNumber: {
        color: COLORS.stepGreen,
        fontWeight: "900",
    },
    hint: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.mint,
    },
    chipWrap: {
        marginTop: 14,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderWidth: 1,
    },
    chipDefault: {
        backgroundColor: COLORS.bg,
        borderColor: COLORS.primary,
    },
    chipSelected: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.primaryDark,
    },
    chipText: {
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.primary,
    },
    chipTextSelected: {
        color: COLORS.primaryDark,
    },
    countText: {
        marginTop: 10,
        fontSize: 11,
        color: COLORS.muted,
        fontWeight: "700",
    },
    button: {
        marginTop: 24,
    },
    toast: {
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.85)",
    },
    toastText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
});