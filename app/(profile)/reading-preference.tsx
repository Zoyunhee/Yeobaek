import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Modal,
    Image,
    useWindowDimensions,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, {
    Circle,
    G,
    Line,
    Path,
    Polygon,
    Text as SvgText,
} from "react-native-svg";
import { COLORS } from "@/constants/colors";
import {
    getDiagnosisRadar,
    getDiagnosisTrend,
    getDiagnosisRecommendations,
    type StyleKey,
    type DiagnosisTimelineItem,
    type DiagnosisGuide,
} from "@/services/api";

const STYLE_META: { key: StyleKey; label: string }[] = [
    { key: "emotion", label: "감정" },
    { key: "analysis", label: "분석" },
    { key: "critic", label: "비평" },
    { key: "empathy", label: "공감" },
    { key: "creative", label: "창의" },
];

function normalizeRadarValue(value: number) {
    if (!Number.isFinite(value)) return 0;
    if (value <= 1) return value * 100;
    return value;
}

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

    const svgWidth = Math.min(width - 56, 300);
    const svgHeight = 230;

    const cx = svgWidth / 2;
    const cy = 108;
    const radius = 78;

    const levels = [20, 40, 60, 80, 100];
    const angles = [-90, -18, 54, 126, 198];

    const points = STYLE_META.map((item, index) =>
        radarPoint(cx, cy, radius, angles[index], data[item.key] ?? 0)
    );

    const pointString = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
        <View style={styles.radarWrap}>
            <Svg width={svgWidth} height={svgHeight}>
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

                    let labelX = outer.x;
                    let labelY = outer.y;

                    if (item.key === "emotion") labelY -= 14;
                    if (item.key === "analysis") {
                        labelX += 10;
                        labelY -= 2;
                    }
                    if (item.key === "critic") {
                        labelX -= 10;
                        labelY += 6;
                    }
                    if (item.key === "empathy") {
                        labelX += 18;
                        labelY += 6;
                    }
                    if (item.key === "creative") {
                        labelY += 14;
                    }

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
                                x={labelX}
                                y={labelY}
                                fontSize={13}
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
                    <Circle key={index} cx={p.x} cy={p.y} r={5} fill="#B67946" />
                ))}
            </Svg>
        </View>
    );
}

function splitLabelLines(text: string, maxChars = 9) {
    if (!text) return [""];

    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxChars) {
            current = next;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }

    if (current) lines.push(current);
    if (lines.length <= 2) return lines;

    return [lines[0], `${lines[1].slice(0, Math.max(0, maxChars - 1))}…`];
}

function TimelineChart({
                           books,
                           selectedStyle,
                           onPressPoint,
                       }: {
    books: DiagnosisTimelineItem[];
    selectedStyle: StyleKey;
    onPressPoint: (book: DiagnosisTimelineItem) => void;
}) {
    const { width } = useWindowDimensions();

    const chartWidth =
        books.length <= 3
            ? width - 64
            : Math.max(width - 64, books.length * 130);

    const chartHeight = 220;

    const paddingLeft = 34;
    const paddingRight = 34;
    const paddingTop = 14;
    const paddingBottom = 54;

    const minY = 0;
    const maxY = 100;

    const plotW = chartWidth - paddingLeft - paddingRight;
    const plotH = chartHeight - paddingTop - paddingBottom;

    const getY = (value: number) =>
        paddingTop + plotH * (1 - (value - minY) / (maxY - minY));

    const points = books.map((book, index) => {
        const x =
            books.length === 1
                ? paddingLeft + plotW / 2
                : paddingLeft + (plotW * index) / (books.length - 1);

        const y = getY(book.scores[selectedStyle] ?? 0);
        return { x, y, book };
    });

    const pathD = points
        .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    const yTicks = [0, 25, 50, 75, 100];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={books.length > 3}
            bounces={books.length > 3}
            contentContainerStyle={{ paddingRight: 4 }}
        >
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
                                    x={paddingLeft - 10}
                                    y={y + 4}
                                    fontSize={10}
                                    fill={COLORS.primary}
                                    textAnchor="end"
                                >
                                    {tick}
                                </SvgText>
                            </G>
                        );
                    })}

                    {points.length > 1 && (
                        <Path d={pathD} fill="none" stroke="#49505B" strokeWidth={3} />
                    )}

                    {points.map((point) => {
                        const labelLines = splitLabelLines(point.book.title, 8);

                        return (
                            <G key={point.book.id}>
                                <Circle cx={point.x} cy={point.y} r={7} fill="#49505B" />

                                <SvgText
                                    x={point.x}
                                    y={point.y - 12}
                                    fontSize={16}
                                    textAnchor="middle"
                                >
                                    📘
                                </SvgText>

                                {labelLines.map((line, idx) => (
                                    <SvgText
                                        key={`${point.book.id}-${idx}`}
                                        x={point.x}
                                        y={chartHeight - 18 + idx * 12}
                                        fontSize={10}
                                        fill={COLORS.primary}
                                        textAnchor="middle"
                                    >
                                        {line}
                                    </SvgText>
                                ))}
                            </G>
                        );
                    })}
                </Svg>

                <View style={StyleSheet.absoluteFill}>
                    {points.map((point) => (
                        <Pressable
                            key={point.book.id}
                            onPress={() => onPressPoint(point.book)}
                            style={{
                                position: "absolute",
                                left: point.x - 24,
                                top: point.y - 28,
                                width: 48,
                                height: 60,
                            }}
                        />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

function buildChangeText(
    label: string,
    score: number,
    change: number | null
) {
    if (change === null) return `${label} ${score}점 · 첫 기록`;
    if (change > 0) return `${label} ${score}점 · 이전보다 +${change}`;
    if (change < 0) return `${label} ${score}점 · 이전보다 ${change}`;
    return `${label} ${score}점 · 변화 없음`;
}

export default function ReadingPreferenceScreen() {
    const router = useRouter();

    const [selectedStyle, setSelectedStyle] = useState<StyleKey>("emotion");
    const [selectedBook, setSelectedBook] = useState<DiagnosisTimelineItem | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [profile, setProfile] = useState<Record<StyleKey, number>>({
        emotion: 0,
        analysis: 0,
        critic: 0,
        empathy: 0,
        creative: 0,
    });

    const [summary, setSummary] = useState("자가진단 결과를 불러오는 중입니다.");
    const [timeline, setTimeline] = useState<DiagnosisTimelineItem[]>([]);
    const [guide, setGuide] = useState<DiagnosisGuide>({
        taste: null,
        growth: null,
    });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setLoading(true);

            const rawUser = await AsyncStorage.getItem("auth_user_id");
            if (!rawUser) throw new Error("로그인 정보가 없습니다.");

            const userId = Number(rawUser);
            if (!userId) throw new Error("사용자 정보가 올바르지 않습니다.");

            const [radarResult, trendResult, guideResult] = await Promise.allSettled([
                getDiagnosisRadar(userId),
                getDiagnosisTrend(userId),
                getDiagnosisRecommendations(userId),
            ]);

            if (radarResult.status !== "fulfilled") throw radarResult.reason;
            if (trendResult.status !== "fulfilled") throw trendResult.reason;

            const radarRes = radarResult.value;
            const trendRes = trendResult.value;

            setProfile(radarRes.data.profile);
            setSummary(radarRes.data.summary);
            setTimeline(trendRes.data ?? []);
            setSelectedBook((trendRes.data ?? [])[0] ?? null);

            if (guideResult.status === "fulfilled") {
                setGuide(guideResult.value.data);
            } else {
                setGuide({ taste: null, growth: null });
            }
        } catch (e) {
            Alert.alert(
                "불러오기 실패",
                e instanceof Error ? e.message : "자가진단 데이터를 불러오지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const lowestStyle = useMemo(() => {
        return STYLE_META.slice().sort((a, b) => profile[a.key] - profile[b.key])[0];
    }, [profile]);

    const selectedStyleLabel =
        STYLE_META.find((item) => item.key === selectedStyle)?.label ?? "점수";

    const selectedScore = selectedBook?.scores[selectedStyle] ?? 0;
    const selectedChange = selectedBook?.changes[selectedStyle] ?? null;
    const selectedInsight = selectedBook?.insights?.[selectedStyle] ?? "";

    const handleOpenDetail = (book: DiagnosisTimelineItem) => {
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

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>사고 스타일 프로필</Text>
                            <RadarChart data={profile} />
                            <Text style={styles.profileSummary}>{summary}</Text>
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

                            {timeline.length === 0 ? (
                                <Text style={styles.emptyText}>표시할 독서 이력이 없습니다.</Text>
                            ) : (
                                <TimelineChart
                                    books={timeline}
                                    selectedStyle={selectedStyle}
                                    onPressPoint={handleOpenDetail}
                                />
                            )}
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>맞춤 독서 가이드</Text>

                            <View style={styles.guideRow}>
                                <View style={styles.guideCard}>
                                    <Text style={styles.guideLabel}>당신의 스타일</Text>

                                    {guide.taste ? (
                                        <View style={styles.guideInnerRow}>
                                            <Image
                                                source={{ uri: guide.taste.cover }}
                                                style={styles.guideCover}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.guideBookTitle}>
                                                    {guide.taste.title}
                                                </Text>
                                                <Text style={styles.guideDescription}>
                                                    {guide.taste.description}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={styles.emptyText}>추천 결과가 없습니다.</Text>
                                    )}
                                </View>

                                <View style={styles.guideCard}>
                                    <Text style={styles.guideLabel}>
                                        추천 도서 · {lowestStyle.label} 보완
                                    </Text>

                                    {guide.growth ? (
                                        <View style={styles.guideInnerRow}>
                                            <Image
                                                source={{ uri: guide.growth.cover }}
                                                style={styles.guideCover}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.guideBookTitle}>
                                                    {guide.growth.title}
                                                </Text>
                                                <Text style={styles.guideDescription}>
                                                    {guide.growth.description}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={styles.emptyText}>추천 결과가 없습니다.</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )}

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
                                <View style={styles.modalBulletWrap}>
                                    <Text style={styles.modalBullet}>
                                        {buildChangeText(selectedStyleLabel, selectedScore, selectedChange)}
                                    </Text>
                                    <Text style={styles.modalBullet}>
                                        → {selectedInsight || "이 책이 사고 변화에 영향을 주었습니다."}
                                    </Text>
                                </View>
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
    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        gap: 10,
    },

    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECE4DD",
        padding: 14,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: 8,
    },

    radarWrap: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 0,
        marginBottom: 0,
    },

    profileSummary: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "800",
        color: COLORS.primary,
    },

    segmentWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
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
        alignSelf: "flex-start",
    },
    emptyText: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: "700",
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