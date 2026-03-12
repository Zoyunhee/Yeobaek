import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import {
    getMyProfile,
    getWishlist,
    getReadingNotes,
    getReadCompletions,
} from "@/services/api";

type Book = { id: string; title: string; author: string; createdAt?: string; coverUrl?: string };
type CompletedChat = { id: string; createdAt?: string; coverUrl?: string };
type Note = { id: string; createdAt?: string; coverUrl?: string };
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

function makePreviewLine() {
    return [8, 6, 7, 10, 15, 14, 11];
}

function makePreviewEmotions() {
    return { happy: 60, sad: 30, neutral: 10 };
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

export default function ProfileScreen() {
    const router = useRouter();

    const [nickname, setNickname] = useState("은석");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const [genres, setGenres] = useState<string[]>([]);
    const [stylesPref, setStylesPref] = useState<string[]>([]);

    const [likedBooks, setLikedBooks] = useState<Book[]>([]);
    const [completedChats, setCompletedChats] = useState<CompletedChat[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [chatEvents, setChatEvents] = useState<ChatEvent[]>([]);

    const load = useCallback(async () => {
        try {
            const userIdRaw = await AsyncStorage.getItem("auth_user_id");

            if (!userIdRaw) {
                return;
            }

            const userId = Number(userIdRaw);

            const [profileRes, wishlistRes, notesRes, completionsRes, eventRaw] = await Promise.all([
                getMyProfile(userId),
                getWishlist(userId),
                getReadingNotes(userId),
                getReadCompletions(userId),
                AsyncStorage.getItem(MONTHLY_CHAT_EVENTS_KEY),
            ]);

            const profile = profileRes.data;

            setNickname(profile.nickname || "은석");
            setAvatarUri(profile.profileImage || null);
            setGenres((profile.genres || []).map(mapGenreToKorean));
            setStylesPref((profile.readingStyles || []).map(mapReadingStyleToKorean));

            setLikedBooks(
                (wishlistRes.data || []).map((item) => ({
                    id: String(item.id),
                    title: item.bookTitle,
                    author: item.author || "",
                    createdAt: item.createdAt,
                    coverUrl: item.coverImage,
                }))
            );

            setNotes(
                (notesRes.data || []).map((item) => ({
                    id: String(item.id),
                    createdAt: item.createdAt,
                    coverUrl: item.coverImage,
                }))
            );

            setCompletedChats(
                (completionsRes.data || []).map((item) => ({
                    id: String(item.id),
                    createdAt: item.completedAt,
                    coverUrl: item.bookCover,
                }))
            );

            try {
                setChatEvents(eventRaw ? (JSON.parse(eventRaw) as ChatEvent[]) : []);
            } catch {
                setChatEvents([]);
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

    const thinkingStyle = "사색형";
    const weeklyChats = 0;
    const emotions = useMemo(() => makePreviewEmotions(), []);
    const line = useMemo(() => makePreviewLine(), []);

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
                        <BulletRow title="사고 스타일" value={thinkingStyle} />
                        <BulletRow title="최근 감정 Top1" value="😁" />

                        <View style={previewStyles.emojiRow}>
                            <Text style={previewStyles.emojiItem}>😁 {emotions.happy}%</Text>
                            <Text style={previewStyles.emojiItem}>😭 {emotions.sad}%</Text>
                            <Text style={previewStyles.emojiItem}>😶 {emotions.neutral}%</Text>
                        </View>

                        <BulletRow title="최근 7일 채팅" value={`${weeklyChats}회`} />
                    </View>

                    <Text style={previewStyles.miniTitle}>[ 미니 채팅 시간 그래프 ]</Text>
                    <MiniLineChart values={line} />
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

function MiniLineChart({ values }: { values: number[] }) {
    const W = 320;
    const H = 88;

    const padL = 16;
    const padR = 12;
    const padT = 14;
    const padB = 18;

    const maxV = Math.max(...values, 1);
    const minV = 0;

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const step = plotW / (values.length - 1);

    const pts = values.map((v, i) => {
        const x = padL + i * step;
        const t = (v - minV) / (maxV - minV || 1);
        const y = padT + (1 - t) * plotH;
        return { x, y };
    });

    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

    return (
        <View style={previewStyles.miniChartWrap}>
            <Svg width={W} height={H}>
                <Rect x={0} y={0} width={W} height={H} rx={12} ry={12} fill={COLORS.white} />
                <Line x1={padL} x2={W - padR} y1={padT + plotH * 0.5} y2={padT + plotH * 0.5} stroke="#E9E9E9" strokeWidth={1} />
                <Path d={d} fill="none" stroke="#6C7BFF" strokeWidth={2.5} />
                {pts.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r={3.6} fill="#6C7BFF" />
                ))}

                {["00", "04", "08", "12", "16", "20", "24"].map((t, i) => {
                    const x = padL + i * step;
                    const isLast = i === 6;
                    return (
                        <SvgText
                            key={t}
                            x={isLast ? W - padR : x}
                            y={H - 6}
                            fontSize={10}
                            fill={COLORS.primary}
                            textAnchor={isLast ? "end" : "middle"}
                        >
                            {t}
                        </SvgText>
                    );
                })}
            </Svg>
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

    miniTitle: {
        marginTop: 14,
        fontSize: 12,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
        opacity: 0.95,
    },

    miniChartWrap: {
        marginTop: 10,
        alignItems: "center",
    },

    emojiRow: {
        marginTop: 6,
        marginBottom: 4,
        flexDirection: "row",
        justifyContent: "center",
        gap: 14,
    },
    emojiItem: {
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.primary,
    },
});