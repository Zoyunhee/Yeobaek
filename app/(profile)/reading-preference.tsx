import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Modal,
    Image,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
    Circle,
    G,
    Line,
    Path,
    Polygon,
    Text as SvgText,
} from "react-native-svg";
import { COLORS } from "@/constants/colors";

type StyleKey = "emotion" | "analysis" | "critic" | "empathy" | "creative";

type TimelineBook = {
    id: string;
    title: string;
    cover: string;
    scores: Record<StyleKey, number>;
    changes: Record<StyleKey, number>;
    insight: string;
};

const STYLE_META: { key: StyleKey; label: string }[] = [
    { key: "emotion", label: "감정" },
    { key: "analysis", label: "분석" },
    { key: "critic", label: "비평" },
    { key: "empathy", label: "공감" },
    { key: "creative", label: "창의" },
];

const DUMMY_PROFILE: Record<StyleKey, number> = {
    emotion: 78,
    analysis: 54,
    critic: 43,
    empathy: 70,
    creative: 58,
};

const DUMMY_SUMMARY =
    "당신은 감정 중심 독서가 강하며 최근 분석적 사고가 증가하는 경향이 있습니다.";

const DUMMY_TIMELINE: TimelineBook[] = [
    {
        id: "1",
        title: "어린왕자",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop",
        scores: {
            emotion: 54,
            analysis: 28,
            critic: 22,
            empathy: 52,
            creative: 49,
        },
        changes: {
            emotion: 10,
            analysis: 6,
            critic: 3,
            empathy: 12,
            creative: 8,
        },
        insight: "감정적 몰입과 공감 사고에 영향을 준 책",
    },
    {
        id: "2",
        title: "코스모스",
        cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400&auto=format&fit=crop",
        scores: {
            emotion: 63,
            analysis: 61,
            critic: 34,
            empathy: 48,
            creative: 58,
        },
        changes: {
            emotion: 10,
            analysis: 30,
            critic: 8,
            empathy: 2,
            creative: 9,
        },
        insight: "분석적 사고 증가에 큰 영향",
    },
    {
        id: "3",
        title: "사피엔스",
        cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=400&auto=format&fit=crop",
        scores: {
            emotion: 67,
            analysis: 69,
            critic: 47,
            empathy: 51,
            creative: 55,
        },
        changes: {
            emotion: 4,
            analysis: 8,
            critic: 13,
            empathy: 3,
            creative: -3,
        },
        insight: "비평적 시선과 분석 사고를 동시에 자극한 책",
    },
    {
        id: "4",
        title: "데미안",
        cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400&auto=format&fit=crop",
        scores: {
            emotion: 78,
            analysis: 54,
            critic: 43,
            empathy: 70,
            creative: 58,
        },
        changes: {
            emotion: 11,
            analysis: -15,
            critic: -4,
            empathy: 19,
            creative: 3,
        },
        insight: "감정과 자기 성찰 중심 독서 경험을 강화한 책",
    },
];

const GUIDE_BOOKS = {
    taste: {
        title: "아몬드",
        description: "감정과 공감 중심의 독서 취향에 잘 맞는 책",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop",
    },
    growth: {
        title: "사피엔스",
        description: "상대적으로 낮은 비평 사고를 확장하는 데 도움을 줄 수 있는 책",
        cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop",
    },
};

function radarPoint(
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number,
    value: number
) {
    const angle = ((angleDeg - 90) * Math.PI) / 180;
    const r = (radius * value) / 100;
    return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
    };
}

function RadarChart({
                        data,
                    }: {
    data: Record<StyleKey, number>;
}) {
    const { width } = useWindowDimensions();
    const size = Math.min(width - 60, 280);
    const cx = size / 2;
    const cy = size / 2 + 8;
    const radius = size * 0.33;
    const levels = [20, 40, 60, 80, 100];

    const angles = [-90, -18, 54, 126, 198];

    const points = STYLE_META.map((item, index) =>
        radarPoint(cx, cy, radius, angles[index], data[item.key])
    );

    const pointString = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
        <View style={styles.radarWrap}>
            <Svg width={size} height={size + 20}>
                {levels.map((level) => {
                    const levelPoints = STYLE_META.map((_, index) =>
                        radarPoint(cx, cy, radius, angles[index], level)
                    );
                    return (
                        <Polygon
                            key={level}
                            points={levelPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke="#D9D4CF"
                            strokeWidth={1}
                        />
                    );
                })}

                {STYLE_META.map((item, index) => {
                    const outer = radarPoint(cx, cy, radius, angles[index], 100);
                    return (
                        <G key={item.key}>
                            <Line
                                x1={cx}
                                y1={cy}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="#D9D4CF"
                                strokeWidth={1}
                            />
                            <SvgText
                                x={outer.x}
                                y={outer.y - (index === 0 ? 10 : 0)}
                                fontSize={14}
                                fill={COLORS.primary}
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {item.label}
                            </SvgText>
                        </G>
                    );
                })}

                <Polygon
                    points={pointString}
                    fill="rgba(167, 116, 72, 0.22)"
                    stroke="#B67946"
                    strokeWidth={2}
                />

                {points.map((p, index) => (
                    <Circle key={index} cx={p.x} cy={p.y} r={4} fill="#B67946" />
                ))}
            </Svg>
        </View>
    );
}

function TimelineChart({
                           books,
                           selectedStyle,
                           onPressPoint,
                       }: {
    books: TimelineBook[];
    selectedStyle: StyleKey;
    onPressPoint: (book: TimelineBook) => void;
}) {
    const { width } = useWindowDimensions();
    const chartWidth = Math.max(width - 36, 340);
    const chartHeight = 240;

    const paddingLeft = 44;
    const paddingRight = 26;
    const paddingTop = 24;
    const paddingBottom = 48;

    const minY = 40;
    const maxY = 80;

    const plotW = chartWidth - paddingLeft - paddingRight;
    const plotH = chartHeight - paddingTop - paddingBottom;

    const getY = (value: number) =>
        paddingTop + plotH * (1 - (value - minY) / (maxY - minY));

    const points = books.map((book, index) => {
        const x =
            books.length === 1
                ? paddingLeft + plotW / 2
                : paddingLeft + (plotW * index) / (books.length - 1);

        const y = getY(book.scores[selectedStyle]);

        return { x, y, book };
    });

    const pathD = points
        .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    const yTicks = [40, 50, 60, 70, 80];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrap}>
                <Svg width={chartWidth} height={chartHeight}>
                    {yTicks.map((tick) => {
                        const y = getY(tick);
                        return (
                            <G key={tick}>
                                <Line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={chartWidth - paddingRight}
                                    y2={y}
                                    stroke="#E7E1DB"
                                    strokeWidth={1}
                                />
                                <SvgText
                                    x={paddingLeft - 12}
                                    y={y + 4}
                                    fontSize={11}
                                    fill={COLORS.primary}
                                    textAnchor="end"
                                >
                                    {tick}
                                </SvgText>
                            </G>
                        );
                    })}

                    <Path d={pathD} fill="none" stroke="#49505B" strokeWidth={3} />

                    {points.map((point, index) => (
                        <G key={point.book.id}>
                            <Circle cx={point.x} cy={point.y} r={7} fill="#49505B" />
                            <SvgText
                                x={point.x}
                                y={chartHeight - 12}
                                fontSize={11}
                                fill={COLORS.primary}
                                textAnchor="middle"
                            >
                                {point.book.title}
                            </SvgText>
                            <SvgText
                                x={point.x}
                                y={point.y - 14}
                                fontSize={18}
                                textAnchor="middle"
                            >
                                {index === 0 ? "🌱" : index === 1 ? "🪐" : index === 2 ? "📕" : "🧑"}
                            </SvgText>
                        </G>
                    ))}
                </Svg>

                <View style={StyleSheet.absoluteFill}>
                    <View
                        style={{
                            flex: 1,
                            paddingLeft,
                            paddingRight,
                            paddingTop,
                            paddingBottom,
                            flexDirection: "row",
                        }}
                    >
                        {points.map((point, index) => (
                            <Pressable
                                key={point.book.id}
                                onPress={() => onPressPoint(point.book)}
                                style={{
                                    position: "absolute",
                                    left:
                                        books.length === 1
                                            ? paddingLeft + plotW / 2 - 26
                                            : paddingLeft + (plotW * index) / (books.length - 1) - 26,
                                    top: point.y - 32,
                                    width: 52,
                                    height: 64,
                                }}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

export default function ReadingPreferenceScreen() {
    const router = useRouter();
    const [selectedStyle, setSelectedStyle] = useState<StyleKey>("emotion");
    const [selectedBook, setSelectedBook] = useState<TimelineBook | null>(DUMMY_TIMELINE[1]);
    const [detailOpen, setDetailOpen] = useState(false);

    const lowestStyle = useMemo(() => {
        return STYLE_META.slice().sort(
            (a, b) => DUMMY_PROFILE[a.key] - DUMMY_PROFILE[b.key]
        )[0];
    }, []);

    const handleOpenDetail = (book: TimelineBook) => {
        setSelectedBook(book);
        setDetailOpen(true);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerLeft}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        <Text style={styles.headerTitle}>자가진단</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>사고 스타일 프로필</Text>

                        <RadarChart data={DUMMY_PROFILE} />

                        <Text style={styles.profileSummary}>{DUMMY_SUMMARY}</Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>독서 타임라인</Text>

                        <View style={styles.segmentWrap}>
                            {STYLE_META.map((item) => {
                                const active = selectedStyle === item.key;

                                return (
                                    <Pressable
                                        key={item.key}
                                        onPress={() => setSelectedStyle(item.key)}
                                        style={[
                                            styles.segmentBtn,
                                            active && styles.segmentBtnActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentText,
                                                active && styles.segmentTextActive,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <TimelineChart
                            books={DUMMY_TIMELINE}
                            selectedStyle={selectedStyle}
                            onPressPoint={handleOpenDetail}
                        />
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>맞춤 독서 가이드</Text>

                        <View style={styles.guideRow}>
                            <View style={styles.guideCard}>
                                <Text style={styles.guideLabel}>당신의 스타일</Text>

                                <View style={styles.guideInnerRow}>
                                    <Image
                                        source={{ uri: GUIDE_BOOKS.taste.cover }}
                                        style={styles.guideCover}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.guideBookTitle}>
                                            {GUIDE_BOOKS.taste.title}
                                        </Text>
                                        <Text style={styles.guideDescription}>
                                            {GUIDE_BOOKS.taste.description}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.guideCard}>
                                <Text style={styles.guideLabel}>
                                    추천 도서 · {lowestStyle.label} 보완
                                </Text>

                                <View style={styles.guideInnerRow}>
                                    <Image
                                        source={{ uri: GUIDE_BOOKS.growth.cover }}
                                        style={styles.guideCover}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.guideBookTitle}>
                                            {GUIDE_BOOKS.growth.title}
                                        </Text>
                                        <Text style={styles.guideDescription}>
                                            {GUIDE_BOOKS.growth.description}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <Modal
                    visible={detailOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDetailOpen(false)}
                >
                    <Pressable style={styles.modalBackdrop} onPress={() => setDetailOpen(false)}>
                        <Pressable style={styles.modalCard} onPress={() => {}}>
                            <Text style={styles.modalBookTitle}>{selectedBook?.title}</Text>

                            {selectedBook && (
                                <>
                                    <View style={styles.modalBulletWrap}>
                                        <Text style={styles.modalBullet}>
                                            {STYLE_META.find((item) => item.key === selectedStyle)?.label}{" "}
                                            {selectedBook.changes[selectedStyle] >= 0 ? "+" : ""}
                                            {selectedBook.changes[selectedStyle]}
                                        </Text>
                                        <Text style={styles.modalBullet}>
                                            → {selectedBook.insight}
                                        </Text>
                                    </View>
                                </>
                            )}

                            <Pressable
                                onPress={() => setDetailOpen(false)}
                                style={styles.modalCloseBtn}
                            >
                                <Text style={styles.modalCloseText}>확인</Text>
                            </Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        gap: 14,
    },
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECE4DD",
        padding: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: 12,
    },
    radarWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    profileSummary: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 24,
        fontWeight: "800",
        color: COLORS.primary,
    },
    segmentWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },
    segmentBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5DCD3",
        backgroundColor: COLORS.white,
    },
    segmentBtnActive: {
        backgroundColor: "#B19277",
        borderColor: "#B19277",
    },
    segmentText: {
        color: COLORS.primary,
        fontWeight: "800",
    },
    segmentTextActive: {
        color: COLORS.white,
    },
    chartWrap: {
        position: "relative",
        alignSelf: "center",
    },
    guideRow: {
        gap: 12,
    },
    guideCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#ECE4DD",
        backgroundColor: "#FFFDFC",
        padding: 12,
    },
    guideLabel: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 10,
    },
    guideInnerRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    guideCover: {
        width: 70,
        height: 98,
        borderRadius: 10,
        backgroundColor: COLORS.secondary,
    },
    guideBookTitle: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: "900",
        marginBottom: 6,
    },
    guideDescription: {
        color: COLORS.primary,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "700",
        flexShrink: 1,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 18,
    },
    modalBookTitle: {
        color: COLORS.primary,
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 14,
    },
    modalBulletWrap: {
        gap: 10,
    },
    modalBullet: {
        color: COLORS.primary,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "800",
    },
    modalCloseBtn: {
        marginTop: 18,
        alignSelf: "center",
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
        backgroundColor: "#B19277",
    },
    modalCloseText: {
        color: COLORS.white,
        fontWeight: "900",
    },
});