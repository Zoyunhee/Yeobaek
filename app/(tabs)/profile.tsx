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
    getReadingNotes,
    getReadCompletions,
    getThinkingStyleStats,
    getActivityStats,
    getEmotionGenreStats,
    getAvailableGenres,
} from "@/services/api";

type Book = { id: string; title: string; author: string; createdAt?: string; coverUrl?: string };
type CompletedChat = { id: string; createdAt?: string; coverUrl?: string };
type Note = { id: string; createdAt?: string; coverUrl?: string };
type ChatEvent = { id: string; createdAt: string };

type ThinkingStyleApi = {
    critic: number;
    emotion: number;
    analysis: number;
    empathy: number;
    creative: number;
};

type PreviewEmotionItem = {
    emoji: string;
    percent: number;
};

const MONTHLY_CHAT_EVENTS_KEY = "monthly_chat_events_v1";

const DEFAULT_AVATAR = require("../../assets/images/default-avatar.png");
const BOOK_COVER = require("../../assets/images/book-cover.png");

const EMOTION_ITEMS = [
    { key: "EXCITED", emoji: "🤩" },
    { key: "HAPPY", emoji: "😊" },
    { key: "CALM", emoji: "🙂" },
    { key: "ANXIOUS", emoji: "😟" },
    { key: "SAD", emoji: "😢" },
    { key: "ANGRY", emoji: "😠" },
] as const;

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

function getTopThinkingStyleLabel(data: ThinkingStyleApi | null) {
    if (!data) return "분석 중";

    const entries = [
        { label: "비평형", value: data.critic },
        { label: "감정형", value: data.emotion },
        { label: "분석형", value: data.analysis },
        { label: "공감형", value: data.empathy },
        { label: "창의형", value: data.creative },
    ].sort((a, b) => b.value - a.value);

    return entries[0]?.label ?? "분석 중";
}

function buildPreviewEmotions(
    apiSlices: Array<{ label: string; value: number }> = []
): { top1: string; items: PreviewEmotionItem[] } {
    const valueMap = new Map<string, number>();

    for (const slice of apiSlices) {
        valueMap.set(String(slice.label), Number(slice.value) || 0);
    }

    const fixed = EMOTION_ITEMS.map((item) => ({
        emoji: item.emoji,
        value: valueMap.get(item.key) ?? 0,
    }));

    const total = fixed.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return {
            top1: "🙂",
            items: [
                { emoji: "🙂", percent: 100 },
                { emoji: "😊", percent: 0 },
                { emoji: "😢", percent: 0 },
            ],
        };
    }

    const top3 = [...fixed]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((item) => ({
            emoji: item.emoji,
            percent: Math.round((item.value / total) * 100),
        }));

    return {
        top1: top3[0]?.emoji ?? "🙂",
        items: top3,
    };
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

function getMostActiveHourLabel(
    activity: Array<{ hour: number; participationScore: number }> = []
) {
    if (activity.length === 0) return "데이터 없음";

    const top = [...activity].sort(
        (a, b) => (Number(b.participationScore) || 0) - (Number(a.participationScore) || 0)
    )[0];

    if (!top) return "데이터 없음";

    return `${String(top.hour).padStart(2, "0")}시`;
}

function getChronotypeLabel(
    activity: Array<{ hour: number; participationScore: number }> = []
) {
    if (activity.length === 0) return "분석 중";

    let morning = 0;   // 05~11
    let afternoon = 0; // 12~17
    let evening = 0;   // 18~21
    let night = 0;     // 22~04

    for (const item of activity) {
        const hour = Number(item.hour);
        const score = Number(item.participationScore) || 0;

        if (hour >= 5 && hour <= 11) morning += score;
        else if (hour >= 12 && hour <= 17) afternoon += score;
        else if (hour >= 18 && hour <= 21) evening += score;
        else night += score;
    }

    const buckets = [
        { label: "오전형", value: morning },
        { label: "오후형", value: afternoon },
        { label: "저녁형", value: evening },
        { label: "야간형", value: night },
    ].sort((a, b) => b.value - a.value);

    return buckets[0]?.label ?? "분석 중";
}

export default function ProfileScreen() {
    const router = useRouter();

    const [nickname, setNickname] = useState("사용자");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const [genres, setGenres] = useState<string[]>([]);
    const [stylesPref, setStylesPref] = useState<string[]>([]);

    const [likedBooks, setLikedBooks] = useState<Book[]>([]);
    const [completedChats, setCompletedChats] = useState<CompletedChat[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [chatEvents, setChatEvents] = useState<ChatEvent[]>([]);

    const [thinkingStylePreview, setThinkingStylePreview] = useState("분석 중");
    const [weeklyChats, setWeeklyChats] = useState(0);
    const [activeHourLabel, setActiveHourLabel] = useState("데이터 없음");
    const [chronotypeLabel, setChronotypeLabel] = useState("분석 중");
    const [emotionTop1, setEmotionTop1] = useState("🙂");
    const [emotionPreview, setEmotionPreview] = useState<PreviewEmotionItem[]>([
        { emoji: "🙂", percent: 100 },
    ]);

    const load = useCallback(async () => {
        try {
            const userIdRaw = await AsyncStorage.getItem("auth_user_id");

            if (!userIdRaw) {
                return;
            }

            const userId = Number(userIdRaw);

            const [
                profileRes,
                wishlistRes,
                notesRes,
                completionsRes,
                eventRaw,
                thinkingRes,
                activityRes,
                genresRes,
            ] = await Promise.all([
                getMyProfile(userId),
                getWishlist(userId),
                getReadingNotes(userId),
                getReadCompletions(userId),
                AsyncStorage.getItem(MONTHLY_CHAT_EVENTS_KEY),
                getThinkingStyleStats(),
                getActivityStats(),
                getAvailableGenres(),
            ]);

            const profile = profileRes.data;

            setNickname(profile.nickname || "사용자");
            setAvatarUri(profile.profileImage || null);
            setGenres((profile.genres || []).map(mapGenreToKorean));
            setStylesPref((profile.readingStyles || []).map(mapReadingStyleToKorean));

            const liked = (wishlistRes.data || []).map((item) => ({
                id: String(item.id),
                title: item.bookTitle,
                author: item.author || "",
                createdAt: item.createdAt,
                coverUrl: item.coverImage,
            }));
            setLikedBooks(liked);

            const noteList = (notesRes.data || []).map((item) => ({
                id: String(item.id),
                createdAt: item.createdAt,
                coverUrl: item.coverImage,
            }));
            setNotes(noteList);

            const completions = (completionsRes.data || []).map((item) => ({
                id: String(item.id),
                createdAt: item.completedAt,
                coverUrl: item.bookCover,
            }));
            setCompletedChats(completions);

            try {
                setChatEvents(eventRaw ? (JSON.parse(eventRaw) as ChatEvent[]) : []);
            } catch {
                setChatEvents([]);
            }

            const activity = activityRes.data || [];

            setThinkingStylePreview(getTopThinkingStyleLabel(thinkingRes.data));
            setWeeklyChats(countRecent7DaysChats(completions));
            setActiveHourLabel(getMostActiveHourLabel(activity));
            setChronotypeLabel(getChronotypeLabel(activity));

            const availableGenres = (genresRes.data || []).filter(Boolean);

            if (availableGenres.length === 0) {
                setEmotionTop1("🙂");
                setEmotionPreview([
                    { emoji: "🙂", percent: 100 },
                    { emoji: "😊", percent: 0 },
                    { emoji: "😢", percent: 0 },
                ]);
            } else {
                const emotionResults = await Promise.all(
                    availableGenres.map((g) =>
                        getEmotionGenreStats({
                            mode: "GENRE_TO_EMOTION",
                            genre: g,
                        })
                    )
                );

                const mergedMap = new Map<string, number>();

                for (const res of emotionResults) {
                    const slices = res.data?.slices || [];

                    for (const slice of slices) {
                        const label = String(slice.label);
                        const value = Number(slice.value) || 0;
                        mergedMap.set(label, (mergedMap.get(label) ?? 0) + value);
                    }
                }

                const mergedSlices = Array.from(mergedMap.entries()).map(([label, value]) => ({
                    label,
                    value,
                }));

                const preview = buildPreviewEmotions(mergedSlices);
                setEmotionTop1(preview.top1);
                setEmotionPreview(preview.items);
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
    const noteCount = notes.length;

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

    const notePreview = useMemo(() => {
        const latest = pickLatest(notes);
        if (!latest) return null;
        return latest.coverUrl ? { uri: latest.coverUrl } : BOOK_COVER;
    }, [notes]);

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

                <Pressable
                    onPress={() => router.push("/(profile)/library")}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
                >
                    <Text style={styles.cardTitle}>나의 서재</Text>
                    <View style={styles.cardLine} />

                    <View style={styles.statsRow}>
                        <StatBlock icon="heart" label="찜" value={`${likedCount}권`} previewCover={likedPreview} />
                        <StatBlock icon="bubble" label="완료 채팅" value={`${completedCount}회`} previewCover={completedPreview} />
                        <StatBlock icon="book" label="독서장" value={`${noteCount}장`} previewCover={notePreview} />
                    </View>
                </Pressable>

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

                    <View style={previewStyles.bullets}>
                        <BulletRow title="사고 스타일" value={thinkingStylePreview} />
                        <BulletRow title="최근 감정 Top1" value={emotionTop1} />

                        <View style={previewStyles.emojiRow}>
                            {emotionPreview.map((item, idx) => (
                                <Text key={`${item.emoji}-${idx}`} style={previewStyles.emojiItem}>
                                    {item.emoji} {item.percent}%
                                </Text>
                            ))}
                        </View>

                        <BulletRow title="최근 7일 채팅" value={`${weeklyChats}회`} />
                        <BulletRow title="가장 활발한 시간대" value={activeHourLabel} />
                        <BulletRow title="독서/채팅 성향" value={chronotypeLabel} />
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
                   }: {
    icon: "heart" | "bubble" | "book";
    label: string;
    value: string;
    previewCover: any | null;
}) {
    const iconName = icon === "heart" ? "heart" : icon === "bubble" ? "bubble.left" : "book";

    return (
        <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
                <IconSymbol name={iconName} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>

            {previewCover ? <Image source={previewCover} style={styles.statCover} /> : <View style={styles.statCover} />}
        </View>
    );
}

function BulletRow({ title, value }: { title: string; value: string }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>
                {title} : <Text style={styles.bulletValue}>{value}</Text>
            </Text>
        </View>
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

    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    bulletDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginTop: 7,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.primary,
        lineHeight: 20,
    },
    bulletValue: {
        fontWeight: "900",
        color: COLORS.primary,
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

    bullets: {
        marginTop: 14,
        gap: 12,
    },

    emojiRow: {
        marginTop: 6,
        marginBottom: 4,
        flexDirection: "row",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
    },
    emojiItem: {
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.primary,
    },
});