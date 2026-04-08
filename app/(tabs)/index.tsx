import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import BookCard, { Book } from "@/components/ui/BookCard";
import SectionBox from "@/components/ui/SectionBox";

import {
    getRecommendations,
    getMonthlyBestsellers,
    getTodayQuiz,
    submitQuizAnswer,
    RecommendedBook,
    BestsellerBook,
    DailyQuiz,
} from "@/services/api";

const AUTH_USER_ID_KEY = "auth_user_id";
const AUTH_USER_NICKNAME_KEY = "auth_user_nickname";

// ── 헬퍼 ────────────────────────────────────────────────────────

function recommendedToBook(book: RecommendedBook, index: number): Book {
    return {
        id: book.isbn ?? String(index),
        isbn: book.isbn,
        title: book.title,
        author: book.authors?.join(", ") ?? "",
        publisher: book.publisher ?? "",
        desc: book.description ?? book.matchReason ?? "",
        coverUrl: book.thumbnail ?? "",
    };
}

function bestsellerToBook(book: any, index: number): Book {
    return {
        id: book.isbn13 ?? book.isbn ?? String(index),
        isbn: book.isbn13 ?? book.isbn ?? "",
        title: book.title ?? "",
        author: Array.isArray(book.authors)
            ? book.authors.join(", ")
            : (book.author ?? ""),
        publisher: book.publisher ?? "",
        desc: book.description ?? "",
        coverUrl: book.cover ?? book.thumbnail ?? "",
    };
}

/** 응답 shape 에 관계없이 배열을 꺼냄 */
function extractArray<T>(res: any, ...keys: string[]): T[] {
    if (!res) return [];
    for (const k of keys) {
        if (Array.isArray(res[k])) return res[k] as T[];
    }
    if (Array.isArray(res)) return res as T[];
    return [];
}

/**
 * quizId 를 안전하게 추출.
 * 백엔드가 id / quizId 어느 쪽으로 줘도 동작.
 */
function extractQuizId(quiz: any): number | null {
    return quiz?.quizId ?? quiz?.id ?? null;
}

// ── 컴포넌트 ────────────────────────────────────────────────────

export default function HomeScreen() {
    const router = useRouter();
    const [q, setQ] = useState("");

    const [userId, setUserId] = useState<number | null>(null);
    const [nickname, setNickname] = useState<string>("");

    const [recommended, setRecommended] = useState<RecommendedBook[]>([]);
    const [bestsellers, setBestsellers] = useState<BestsellerBook[]>([]);
    const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
    const [quizId, setQuizId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [quizAnswered, setQuizAnswered] = useState(false);
    const [quizResult, setQuizResult] = useState<{
        correct: boolean;
        explanation?: string;
    } | null>(null);

    // ── AsyncStorage → userId / nickname ─────────────────────────

    useEffect(() => {
        (async () => {
            const storedId = await AsyncStorage.getItem(AUTH_USER_ID_KEY);
            const storedNickname = await AsyncStorage.getItem(AUTH_USER_NICKNAME_KEY);
            if (storedId) setUserId(Number(storedId));
            if (storedNickname) setNickname(storedNickname);
        })();
    }, []);

    // ── 홈 데이터 로딩 ────────────────────────────────────────────

    const fetchHome = useCallback(async (uid: number) => {
        try {
            setLoading(true);
            setError(null);

            const [recRes, bestRes, quizRes] = await Promise.allSettled([
                getRecommendations(uid),
                getMonthlyBestsellers(),
                getTodayQuiz(uid),
            ]);

            // 추천 도서
            if (recRes.status === "fulfilled") {
                setRecommended(
                    extractArray<RecommendedBook>(recRes.value, "recommendations", "data", "items")
                );
            } else {
                console.warn("[홈] 추천 도서 실패:", recRes.reason);
            }

            // 월간 베스트셀러
            if (bestRes.status === "fulfilled") {
                const raw = bestRes.value as any;
                const list: BestsellerBook[] =
                    Array.isArray(raw?.data?.items) ? raw.data.items
                        : Array.isArray(raw?.data) ? raw.data
                            : Array.isArray(raw?.items) ? raw.items
                                : Array.isArray(raw) ? raw
                                    : [];
                setBestsellers(list);
            } else {
                console.warn("[홈] 베스트셀러 실패:", bestRes.reason);
            }

            // 오늘의 퀴즈
            if (quizRes.status === "fulfilled") {
                const raw = quizRes.value as any;
                const quizData = raw?.data ?? raw;
                const id = extractQuizId(quizData);
                console.log("[홈] 퀴즈 원본:", JSON.stringify(raw));
                setQuiz(quizData);
                setQuizId(id);
                if (quizData?.completed) setQuizAnswered(true);
            } else {
                console.warn("[홈] 퀴즈 실패:", quizRes.reason);
            }
        } catch (e: any) {
            setError(e?.message ?? "네트워크 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userId !== null) fetchHome(userId);
    }, [userId, fetchHome]);

    // ── 퀴즈 제출 ────────────────────────────────────────────────

    const onPressAnswer = async (userAnswer: boolean) => {
        if (!quiz || quizAnswered || userId === null) return;

        if (quizId === null) {
            Alert.alert("오류", "퀴즈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        setQuizAnswered(true);

        try {
            const res = await submitQuizAnswer(userId, quizId, userAnswer) as any;
            const data = res?.data ?? res;

            const isCorrect: boolean =
                data?.isCorrect ?? data?.correct ??
                res?.isCorrect ?? res?.correct ?? false;

            const rawExplanation: string =
                data?.explanation ?? res?.explanation ?? "";
            const explanation: string = rawExplanation || "";

            setQuizResult({ correct: isCorrect, explanation });
            console.log("[퀴즈] 제출 응답:", JSON.stringify(res));

            Alert.alert(
                isCorrect ? "정답입니다 🎉" : "틀렸어요 😢",
                isCorrect ? "퀴즈를 맞히셨어요!" : "다시 한 번 확인해보세요.",
                [{ text: "확인" }]
            );
        } catch (e: any) {
            Alert.alert("알림", e?.message ?? "퀴즈 제출에 실패했습니다.");
            setQuizAnswered(false);
        }
    };

    // ── 렌더링 ───────────────────────────────────────────────────

    if (loading || userId === null) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={() => fetchHome(userId)}>
                    <Text style={styles.retryText}>다시 시도</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const pickTitle = `🟢 ${nickname}님을 위한 추천 도서`;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.screen}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.logo}>여백 餘白</Text>
                        <Text style={styles.subtitle}>오늘은 어떤 책 이야기를 해볼까요?</Text>
                    </View>

                    <SearchBar
                        value={q}
                        onChangeText={setQ}
                        editable={false}
                        onPress={() => router.push("/(home)/homesearch")}
                    />

                    <View style={{ height: 12 }} />

                    {/* 취향 추천 도서 */}
                    <SectionBox title={pickTitle}>
                        {recommended.length > 0 ? (
                            <BookCard
                                book={recommendedToBook(recommended[0], 0)}
                                showButtons
                                variant="flat"
                                onPress={() =>
                                    router.push({
                                        pathname: "/(home)/resultdetails",
                                        params: {
                                            isbn: recommended[0].isbn,
                                            title: recommended[0].title,
                                            author: recommended[0].authors?.join(", ") ?? "",
                                            desc: recommended[0].description ?? recommended[0].matchReason ?? "",
                                            coverUrl: recommended[0].thumbnail ?? "",
                                            publisher: recommended[0].publisher ?? "",
                                        },
                                    })
                                }
                            />
                        ) : (
                            <Text style={styles.emptyText}>추천 도서를 불러오지 못했습니다.</Text>
                        )}
                    </SectionBox>

                    <View style={{ height: 12 }} />

                    {/* 월간 베스트셀러 */}
                    <SectionBox title="월간 베스트 셀러" variant="mint">
                        {bestsellers.length > 0 ? (
                            <BookCard
                                book={bestsellerToBook(bestsellers[0], 0)}
                                showButtons
                                variant="flat"
                                onPress={() =>
                                    router.push({
                                        pathname: "/(home)/resultdetails",
                                        params: {
                                            isbn: bestsellers[0].isbn13 ?? bestsellers[0].isbn,
                                            title: bestsellers[0].title ?? "",
                                            author: Array.isArray((bestsellers[0] as any).authors)
                                                ? (bestsellers[0] as any).authors.join(", ")
                                                : ((bestsellers[0] as any).author ?? ""),
                                            desc: (bestsellers[0] as any).description ?? "",
                                            coverUrl: (bestsellers[0] as any).cover ?? (bestsellers[0] as any).thumbnail ?? "",
                                            publisher: (bestsellers[0] as any).publisher ?? "",
                                        },
                                    })
                                }
                            />
                        ) : (
                            <Text style={styles.emptyText}>베스트셀러를 불러오지 못했습니다.</Text>
                        )}
                    </SectionBox>

                    <View style={{ height: 12 }} />

                    {/* 오늘의 퀴즈 */}
                    {quiz && (
                        <View style={styles.quizBox}>
                            <Text style={styles.quizTitle}>오늘의 여백 퀴즈</Text>
                            <Text style={styles.quizQ}>Q : {quiz.question}</Text>

                            {quiz.completed || quizAnswered ? (
                                <View style={styles.quizDoneWrap}>
                                    <Text style={styles.quizDoneText}>
                                        {quizResult
                                            ? quizResult.correct
                                                ? "✅ 정답을 맞히셨어요!"
                                                : "❌ 틀렸어요. 내일 다시 도전하세요!"
                                            : "오늘의 퀴즈를 이미 완료했습니다."}
                                    </Text>

                                    {quizResult?.explanation ? (
                                        <Text style={styles.quizExplanation}>
                                            {quizResult.explanation}
                                        </Text>
                                    ) : quiz.completed && (quiz as any).explanation ? (
                                        <Text style={styles.quizExplanation}>
                                            {(quiz as any).explanation}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : (
                                <View style={styles.quizBtns}>
                                    <Pressable style={styles.quizBtn} onPress={() => onPressAnswer(true)}>
                                        <Text style={styles.quizBtnText}>O</Text>
                                    </Pressable>
                                    <Pressable style={styles.quizBtn} onPress={() => onPressAnswer(false)}>
                                        <Text style={styles.quizBtnText}>X</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={{ height: 18 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    screen: { flex: 1, backgroundColor: COLORS.bg },
    center: { alignItems: "center", justifyContent: "center" },

    content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18, gap: 10 },

    header: { alignItems: "center", gap: 8, marginBottom: 6 },
    logo: { fontSize: 28, fontWeight: "900", color: COLORS.primary },
    subtitle: { fontSize: 13, fontWeight: "700", color: COLORS.primaryDark },

    errorText: { fontSize: 14, color: COLORS.primary, marginBottom: 12 },
    retryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryText: { color: COLORS.white, fontWeight: "700" },

    emptyText: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "600",
        paddingVertical: 8,
        textAlign: "center",
    },

    quizBox: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },
    quizTitle: { fontSize: 13, fontWeight: "900", color: COLORS.stepGreen },
    quizQ: { marginTop: 10, fontSize: 13, fontWeight: "800", color: COLORS.primary },

    quizBtns: { flexDirection: "row", gap: 12, marginTop: 14 },
    quizBtn: {
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    quizBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 15 },

    quizDoneWrap: { marginTop: 12 },
    quizDoneText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
    quizExplanation: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.stepGreen,
        lineHeight: 18,
    },
});