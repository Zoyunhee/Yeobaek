import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from "react-native-svg";

// ✅ added: 설정 저장 후 돌아오면 즉시 반영
import { useFocusEffect } from "@react-navigation/native";

type Book = { id: string; title: string; author: string; createdAt?: string; coverUrl?: string };
type CompletedChat = { id: string; createdAt?: string; coverUrl?: string };
type Note = { id: string; createdAt?: string; coverUrl?: string };
type ChatEvent = { id: string; createdAt: string };

const PREF_GENRES_KEY = "pref_genres_v1";
const PREF_STYLES_KEY = "pref_styles_v1";

const LIKED_BOOKS_KEY = "liked_books_v1";
const COMPLETED_CHATS_KEY = "completed_chats_v1";
const NOTES_KEY = "reading_notes_v1";

// 이번 달 대화 이벤트 로그(추천 방식)
const MONTHLY_CHAT_EVENTS_KEY = "monthly_chat_events_v1";

// ✅ added: 닉네임/프로필 사진 저장 키 (설정 화면들과 동일해야 함)
const PROFILE_NICKNAME_KEY = "profile_nickname_v1";
const PROFILE_AVATAR_URI_KEY = "profile_avatar_uri_v1";

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

/** ✅ 프리뷰용 더미 (백엔드 붙이면 여기만 교체하면 됨) */
function makePreviewLine() {
    // 00, 04, 08, 12, 16, 20, 24
    return [8, 6, 7, 10, 15, 14, 11];
}
function makePreviewEmotions() {
    // HAPPY, SAD, NEUTRAL
    return { happy: 60, sad: 30, neutral: 10 };
}

export default function ProfileScreen() {
    const router = useRouter();

    // ✅ added: 닉네임/아바타 상태
    const [nickname, setNickname] = useState("은석");
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const [genres, setGenres] = useState<string[]>([]);
    const [stylesPref, setStylesPref] = useState<string[]>([]);

    const [likedBooks, setLikedBooks] = useState<Book[]>([]);
    const [completedChats, setCompletedChats] = useState<CompletedChat[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [chatEvents, setChatEvents] = useState<ChatEvent[]>([]);

    const load = useCallback(async () => {
        // ✅ changed: 닉네임/아바타도 같이 로드
        const [nickRaw, avatarRaw, gRaw, sRaw, bRaw, cRaw, nRaw, eRaw] = await Promise.all([
            AsyncStorage.getItem(PROFILE_NICKNAME_KEY),
            AsyncStorage.getItem(PROFILE_AVATAR_URI_KEY),

            AsyncStorage.getItem(PREF_GENRES_KEY),
            AsyncStorage.getItem(PREF_STYLES_KEY),
            AsyncStorage.getItem(LIKED_BOOKS_KEY),
            AsyncStorage.getItem(COMPLETED_CHATS_KEY),
            AsyncStorage.getItem(NOTES_KEY),
            AsyncStorage.getItem(MONTHLY_CHAT_EVENTS_KEY),
        ]);

        // ✅ added: nickname/avatar 적용
        setNickname(nickRaw && nickRaw.trim().length > 0 ? nickRaw : "은석");
        setAvatarUri(avatarRaw && avatarRaw.trim().length > 0 ? avatarRaw : null);

        // hashtags
        try {
            setGenres(gRaw ? (JSON.parse(gRaw) as string[]) : []);
        } catch {
            setGenres([]);
        }
        try {
            setStylesPref(sRaw ? (JSON.parse(sRaw) as string[]) : []);
        } catch {
            setStylesPref([]);
        }

        // counts
        try {
            setLikedBooks(bRaw ? (JSON.parse(bRaw) as Book[]) : []);
        } catch {
            setLikedBooks([]);
        }
        try {
            setCompletedChats(cRaw ? (JSON.parse(cRaw) as CompletedChat[]) : []);
        } catch {
            setCompletedChats([]);
        }
        try {
            setNotes(nRaw ? (JSON.parse(nRaw) as Note[]) : []);
        } catch {
            setNotes([]);
        }

        // monthly events (preferred)
        try {
            setChatEvents(eRaw ? (JSON.parse(eRaw) as ChatEvent[]) : []);
        } catch {
            setChatEvents([]);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // ✅ added: 설정 저장 후 back 하면 즉시 반영(닉네임/사진)
    useFocusEffect(
        useCallback(() => {
            load();
            return () => {};
        }, [load])
    );

    // counts
    const likedCount = likedBooks.length;
    const completedCount = completedChats.length;
    const noteCount = notes.length;

    // 이번 달 대화 횟수: events 우선, 없으면 completedChats의 createdAt로 fallback
    const monthlyChatCount = useMemo(() => {
        if (chatEvents.length > 0) {
            return chatEvents.filter((e) => isInThisMonth(e.createdAt)).length;
        }
        const fallback = completedChats.filter((c) => isInThisMonth(c.createdAt)).length;
        return fallback;
    }, [chatEvents, completedChats]);

    // latest preview (지금은 백엔드 없으니 coverUrl 있어도 일단 BOOK_COVER로 표시)
    const likedPreview = useMemo(() => (pickLatest(likedBooks) ? BOOK_COVER : null), [likedBooks]);
    const completedPreview = useMemo(() => (pickLatest(completedChats) ? BOOK_COVER : null), [completedChats]);
    const notePreview = useMemo(() => (pickLatest(notes) ? BOOK_COVER : null), [notes]);

    // ✅ 독서 성향 프리뷰용 더미 (백엔드 붙이면 여기만 교체)
    const thinkingStyle = "사색형";
    const weeklyChats = 0;
    const emotions = useMemo(() => makePreviewEmotions(), []);
    const line = useMemo(() => makePreviewLine(), []);

    return (
        <SafeAreaView style={styles.safe}>
            {/* 상단 헤더(피그마처럼) */}
            <View style={styles.topHeader}>
                <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={12} style={styles.headerIconBtn}>
                    <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
                </Pressable>
                <View style={{ flex: 1 }} />

                {/* ... 설정 누르면 설정 허브로 이동 */}
                <Pressable onPress={() => router.push("/(profile)/settings")} hitSlop={12} style={styles.headerIconBtn}>
                    <IconSymbol name="ellipsis" size={20} color={COLORS.primary} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* 프로필 */}
                <View style={styles.profileRow}>

                    <Image source={avatarUri ? ({ uri: avatarUri } as any) : DEFAULT_AVATAR} style={styles.avatar} />

                    <View style={{ flex: 1 }}>

                        <Text style={styles.name}>{nickname}</Text>

                        <View style={{ marginTop: 6 }}>
                            {/* 윗줄: 장르 */}
                            <Text style={styles.hash} numberOfLines={1}>
                                {genres.length > 0 ? genres.map((g) => `#${g}`).join(" ") : "#장르를 선택해 주세요"}
                            </Text>
                            {/* 아랫줄: 읽는 방식 */}
                            <Text style={[styles.hash, { marginTop: 2 }]} numberOfLines={1}>
                                {stylesPref.length > 0 ? stylesPref.map((s) => `#${s}`).join(" ") : "#읽는 방식을 선택해 주세요"}
                            </Text>
                        </View>

                        <Text style={styles.sub}>이번 달 대화 {monthlyChatCount}회</Text>
                    </View>
                </View>

                {/* 나의 서재 */}
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

                {/*  나의 독서 성향 (프리뷰 카드) */}
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

                        {/* 감정 비율을 Top1 바로 아래 */}
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

            {/* 각 칸 아래에 표지 1개 */}
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

/**  아주 작은 라인차트 (프리뷰 전용) */
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
                {/* 가이드 라인 */}
                <Line x1={padL} x2={W - padR} y1={padT + plotH * 0.5} y2={padT + plotH * 0.5} stroke="#E9E9E9" strokeWidth={1} />
                {/* 라인 */}
                <Path d={d} fill="none" stroke="#6C7BFF" strokeWidth={2.5} />
                {pts.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r={3.6} fill="#6C7BFF" />
                ))}

                {/* x축 라벨(짧게) */}
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