import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useFocusEffect } from "@react-navigation/native";
import {
    getMyProfile,
    getWishlist,
    getBookReviews,
    getReadCompletions,
    getDiagnosisLatest,
    getDiagnosisTrend,
} from "@/services/api";

type Book = { id: string; title: string; author: string; createdAt?: string; coverUrl?: string };
type CompletedChat = {
    id: string;
    roomId?: string;
    sourceRoomId?: string;
    createdAt?: string;
    coverUrl?: string;
};
type ReviewPreviewItem = { id: string; createdAt?: string; coverUrl?: string };
type ChatEvent = { id: string; createdAt: string };

const MONTHLY_CHAT_EVENTS_KEY = "monthly_chat_events_v1";

const DEFAULT_AVATAR = require("../../assets/images/default-avatar.png");
const BOOK_COVER = require("../../assets/images/book-cover.png");

function monthRange(now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
}

function isInThisMonth(iso?: string) {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;
    const { start, end } = monthRange();
    return d >= start && d < end;
}

function pickLatest<T extends { createdAt?: string }>(arr: T[]) {
    if (arr.length === 0) return null;
    const withDate = arr.filter((x) => x.createdAt && !Number.isNaN(new Date(x.createdAt!).getTime()));
    if (withDate.length === 0) return arr[0];
    return [...withDate].sort((a, b) => +new Date(b.createdAt!) - +new Date(a.createdAt!))[0];
}

function mapGenreToKorean(genre: string) {
    const map: Record<string, string> = {
        ROMANCE: "로맨스",
        THRILLER: "스릴러",
        FANTASY: "판타지",
        SF: "SF",
        MYSTERY: "미스터리",
        COMING_OF_AGE: "성장소설",
        HISTORICAL_FICTION: "역사소설",
        HUMAN_DRAMA: "휴먼드라마",
        ESSAY: "에세이",
        HUMANITIES: "인문",
        SOCIAL: "사회",
        PHILOSOPHY: "철학",
        PSYCHOLOGY: "심리",
        SELF_DEVELOPMENT: "자기계발",
        BUSINESS: "경제 경영",
        SCIENCE: "과학",
        소설: "소설",
        시: "시",
        경제경영: "경제경영",
        역사: "역사",
        예술: "예술",
        IT: "IT",
        아동: "아동",
        청소년: "청소년",
        여행: "여행",
        건강: "건강",
        기타: "기타",
    };
    return map[genre] ?? genre;
}

function mapReadingStyleToKorean(style: string) {
    const map: Record<string, string> = {
        LIGHT_READ: "가볍게 읽는",
        SLOW_READ: "천천히 곱씹는",
        EASY_READ: "술술 읽히는",
        DEEP_FOCUS_BOOK: "한 권에 몰입",
        DEEP_FOCUS_SENTENCE: "문장 하나에 몰입",
        SHORT_CONTENT: "짧은 글 위주",
    };
    return map[style] ?? style;
}

function mapThinkingTypeToKorean(type?: string) {
    switch (type) {
        case "EMOTION":
            return "감정형";
        case "ANALYSIS":
            return "분석형";
        case "CRITICISM":
            return "비평형";
        case "EMPATHY":
            return "공감형";
        case "CREATIVITY":
            return "창의형";
        default:
            return "분석 중";
    }
}

function countRecent7DaysChats(completions: CompletedChat[]) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    return completions.filter((item) => {
        if (!item.createdAt) return false;
        const d = new Date(item.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        return d >= start && d <= now;
    }).length;
}

export default function ProfileScreen() {
    const router = useRouter();

    const [nickname, setNickname] = useState("사용자");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const [genres, setGenres] = useState<string[]>([]);
    const [stylesPref, setStylesPref] = useState<string[]>([]);

    const [likedBooks, setLikedBooks] = useState<Book[]>([]);
    const [completedChats, setCompletedChats] = useState<CompletedChat[]>([]);
    const [reviews, setReviews] = useState<ReviewPreviewItem[]>([]);
    const [chatEvents, setChatEvents] = useState<ChatEvent[]>([]);

    const [thinkingStylePreview, setThinkingStylePreview] = useState("분석 중");
    const [summaryPreview, setSummaryPreview] = useState("자가진단 요약이 없습니다.");
    const [growthPointPreview, setGrowthPointPreview] = useState("분석 중");
    const [weeklyChats, setWeeklyChats] = useState(0);
    const [trendPreview, setTrendPreview] = useState("최근 변화 데이터가 없습니다.");

    const load = useCallback(async () => {
        try {
            const userIdRaw = await AsyncStorage.getItem("auth_user_id");
            if (!userIdRaw) return;

            const userId = Number(userIdRaw);

            const [
                profileResult,
                wishlistResult,
                reviewsResult,
                completionsResult,
                eventResult,
                latestDiagnosisResult,
                trendResult,
            ] = await Promise.allSettled([
                getMyProfile(userId),
                getWishlist(userId),
                getBookReviews(userId),
                getReadCompletions(userId),
                AsyncStorage.getItem(MONTHLY_CHAT_EVENTS_KEY),
                getDiagnosisLatest(userId),
                getDiagnosisTrend(userId),
            ]);

            if (profileResult.status !== "fulfilled") {
                throw profileResult.reason;
            }

            const profile = profileResult.value.data;
            setNickname(profile.nickname || "사용자");
            setAvatarUri(profile.profileImage || null);
            setGenres((profile.genres || []).map(mapGenreToKorean));
            setStylesPref((profile.readingStyles || []).map(mapReadingStyleToKorean));

            if (wishlistResult.status === "fulfilled") {
                const liked = (wishlistResult.value.data || []).map((item: any) => ({
                    id: String(item.id),
                    title: item.bookTitle,
                    author: item.author || "",
                    createdAt: item.createdAt,
                    coverUrl: item.coverImage,
                }));
                setLikedBooks(liked);
            } else {
                setLikedBooks([]);
            }

            if (reviewsResult.status === "fulfilled") {
                const reviewList = (reviewsResult.value.data || []).map((item: any) => ({
                    id: String(item.id),
                    createdAt: item.createdAt,
                    coverUrl: item.coverImage,
                }));
                setReviews(reviewList);
            } else {
                setReviews([]);
            }

            let completions: CompletedChat[] = [];
            if (completionsResult.status === "fulfilled") {
                completions = (completionsResult.value.data || []).map((item: any) => {
                    const actualRoomId = item.roomId ?? item.sourceRoomId;

                    return {
                        id: String(item.id),
                        roomId: actualRoomId ? String(actualRoomId) : undefined,
                        sourceRoomId: item.sourceRoomId ? String(item.sourceRoomId) : undefined,
                        createdAt: item.completedAt,
                        coverUrl: item.bookCover,
                    };
                });

                setCompletedChats(completions);
            } else {
                setCompletedChats([]);
            }

            if (eventResult.status === "fulfilled") {
                try {
                    setChatEvents(eventResult.value ? (JSON.parse(eventResult.value) as ChatEvent[]) : []);
                } catch {
                    setChatEvents([]);
                }
            } else {
                setChatEvents([]);
            }

            setWeeklyChats(countRecent7DaysChats(completions));

            if (latestDiagnosisResult.status === "fulfilled") {
                const latest = latestDiagnosisResult.value.data;

                setThinkingStylePreview(mapThinkingTypeToKorean(latest.topType));
                setSummaryPreview(latest.summaryComment || "자가진단 요약이 없습니다.");
                setGrowthPointPreview(`${mapThinkingTypeToKorean(latest.growthType)} 확장 필요`);
            } else {
                setThinkingStylePreview("분석 중");
                setSummaryPreview("자가진단 요약이 없습니다.");
                setGrowthPointPreview("분석 중");
            }

            if (trendResult.status === "fulfilled") {
                const summary = trendResult.value.summary;

                const trendLine =
                    summary?.emotion ||
                    summary?.analysis ||
                    summary?.criticism ||
                    summary?.empathy ||
                    summary?.creativity ||
                    "최근 변화 데이터가 없습니다.";

                const shortTrend =
                    trendLine.length > 20 ? `${trendLine.slice(0, 20)}…` : trendLine;

                setTrendPreview(shortTrend);
            } else {
                setTrendPreview("최근 변화 데이터가 없습니다.");
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "마이페이지 불러오기에 실패했습니다.";
            Alert.alert("불러오기 실패", message);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useFocusEffect(
        useCallback(() => {
            load();
            return () => {};
        }, [load])
    );

    const likedCount = likedBooks.length;
    const completedCount = completedChats.length;
    const reviewCount = reviews.length;

    const monthlyChatCount = useMemo(() => {
        if (chatEvents.length > 0) {
            return chatEvents.filter((e) => isInThisMonth(e.createdAt)).length;
        }
        return completedChats.filter((c) => isInThisMonth(c.createdAt)).length;
    }, [chatEvents, completedChats]);

    const likedPreview = useMemo(() => {
        const latest = pickLatest(likedBooks);
        if (!latest) return null;
        return latest.coverUrl ? { uri: latest.coverUrl } : BOOK_COVER;
    }, [likedBooks]);

    const completedPreview = useMemo(() => {
        const latest = pickLatest(completedChats);
        if (!latest) return null;
        return latest.coverUrl ? { uri: latest.coverUrl } : BOOK_COVER;
    }, [completedChats]);

    const reviewPreview = useMemo(() => {
        const latest = pickLatest(reviews);
        if (!latest) return null;
        return latest.coverUrl ? { uri: latest.coverUrl } : BOOK_COVER;
    }, [reviews]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.topHeader}>
                <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={12} style={styles.headerIconBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => router.push("/(profile)/settings")} hitSlop={12} style={styles.headerIconBtn}>
                    <IconSymbol name="ellipsis" size={20} color={COLORS.primary} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.profileRow}>
                    <Image source={avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR} style={styles.avatar} />

                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{nickname}</Text>

                        <View style={{ marginTop: 6 }}>
                            <Text style={styles.hash} numberOfLines={1}>
                                {genres.length > 0 ? genres.map((g) => `#${g}`).join(" ") : "#장르를 선택해 주세요"}
                            </Text>
                            <Text style={[styles.hash, { marginTop: 2 }]} numberOfLines={1}>
                                {stylesPref.length > 0 ? stylesPref.map((s) => `#${s}`).join(" ") : "#읽는 방식을 선택해 주세요"}
                            </Text>
                        </View>

                        <Text style={styles.sub}>이번 달 대화 {monthlyChatCount}회</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>나의 서재</Text>
                    <View style={styles.cardLine} />

                    <View style={styles.statsRow}>
                        <StatBlock
                            icon="heart"
                            label="찜"
                            value={`${likedCount}권`}
                            previewCover={likedPreview}
                            onPress={() =>
                                router.push({
                                    pathname: "/(profile)/library",
                                    params: { tab: "liked" },
                                })
                            }
                        />
                        <StatBlock
                            icon="bubble"
                            label="완료 채팅"
                            value={`${completedCount}회`}
                            previewCover={completedPreview}
                            onPress={() =>
                                router.push({
                                    pathname: "/(profile)/library",
                                    params: { tab: "completed" },
                                })
                            }
                        />
                        <StatBlock
                            icon="book"
                            label="독서장"
                            value={`${reviewCount}장`}
                            previewCover={reviewPreview}
                            onPress={() =>
                                router.push({
                                    pathname: "/(profile)/library",
                                    params: { tab: "reviews" },
                                })
                            }
                        />
                    </View>
                </View>

                <Pressable
                    onPress={() => router.push("/(profile)/reading-preference")}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
                >
                    <View style={previewStyles.headerRow}>
                        <Text style={styles.cardTitle}>나의 독서 성향</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={previewStyles.moreText}>통계 보러가기</Text>
                        <Text style={previewStyles.moreArrow}>›</Text>
                    </View>

                    <View style={styles.cardLine} />

                    <View style={previewStyles.previewWrap}>
                        <View style={previewStyles.badgeRow}>
                            <View style={previewStyles.mainBadge}>
                                <Text style={previewStyles.mainBadgeText}>{thinkingStylePreview}</Text>
                            </View>

                            <View style={previewStyles.subBadge}>
                                <Text style={previewStyles.subBadgeText}>{growthPointPreview}</Text>
                            </View>
                        </View>

                        <Text style={previewStyles.summaryText} numberOfLines={2}>
                            {summaryPreview}
                        </Text>

                        <View style={previewStyles.miniChipRow}>
                            <View style={previewStyles.miniChip}>
                                <Text style={previewStyles.miniChipLabel}>최근 7일</Text>
                                <Text style={previewStyles.miniChipValue}>{weeklyChats}회</Text>
                            </View>

                            <View style={previewStyles.miniChip}>
                                <Text style={previewStyles.miniChipLabel}>최근 변화</Text>
                                <Text style={previewStyles.miniChipValue} numberOfLines={1}>
                                    {trendPreview}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatBlock({
                       icon,
                       label,
                       value,
                       previewCover,
                       onPress,
                   }: {
    icon: "heart" | "bubble" | "book";
    label: string;
    value: string;
    previewCover: any | null;
    onPress: () => void;
}) {
    const iconName = icon === "heart" ? "heart" : icon === "bubble" ? "bubble.left" : "book";

    return (
        <Pressable onPress={onPress} style={styles.statItem}>
            <View style={styles.statIconCircle}>
                <IconSymbol name={iconName} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>

            {previewCover ? <Image source={previewCover} style={styles.statCover} /> : <View style={styles.statCover} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },

    topHeader: {
        height: 44,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },

    container: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 50,
    },

    profileRow: {
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
        paddingVertical: 10,
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: COLORS.secondary,
    },
    name: {
        fontSize: 34,
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -0.5,
    },
    hash: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.primary,
        opacity: 0.95,
        lineHeight: 20,
    },
    sub: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.muted,
    },

    card: {
        marginTop: 18,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.stepGreen,
    },
    cardLine: {
        marginTop: 10,
        height: 1,
        backgroundColor: COLORS.border,
    },

    statsRow: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.secondary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statLabel: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.primary,
    },
    statValue: {
        marginTop: 6,
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.stepGreen,
    },
    statCover: {
        marginTop: 14,
        width: 74,
        height: 98,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },
});

const previewStyles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    moreText: {
        fontSize: 12,
        fontWeight: "900",
        color: COLORS.muted,
    },
    moreArrow: {
        marginLeft: 4,
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.muted,
        lineHeight: 18,
    },

    previewWrap: {
        marginTop: 16,
        gap: 14,
    },

    badgeRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },

    mainBadge: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "#B19277",
    },
    mainBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "900",
    },

    subBadge: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: COLORS.secondary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    subBadgeText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "800",
    },

    summaryText: {
        color: COLORS.primary,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "800",
    },

    miniChipRow: {
        flexDirection: "row",
        gap: 10,
    },

    miniChip: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: "#FFFDFC",
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    miniChipLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: "800",
        marginBottom: 6,
    },
    miniChipValue: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "900",
        lineHeight: 18,
    },
});