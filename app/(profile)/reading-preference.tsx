import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    ScrollView,
    useWindowDimensions,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Svg, { G, Line, Path, Circle, Text as SvgText, Rect } from "react-native-svg";

import { COLORS } from "@/constants/colors";
import {
    getActivityStats,
    getEmotionGenreStats,
    getThinkingStyleStats,
    getMyProfile,
    getAvailableGenres,
} from "@/services/api";

type LinePoint = { xLabel: string; hour: number; value: number };

type PieSlice = {
    key: string;
    emoji: string;
    label: string;
    value: number;
    color: string;
};

type ThinkingStyleApi = {
    critic: number;
    emotion: number;
    analysis: number;
    empathy: number;
    creative: number;
};

const DEFAULT_GENRES = [
    "소설",
    "에세이",
    "시",
    "자기계발",
    "인문",
    "경제경영",
    "과학",
    "역사",
    "사회",
    "예술",
    "IT",
    "아동",
    "청소년",
    "여행",
    "건강",
    "기타",
];

const EMOTION_ITEMS = [
    { id: 1, key: "EXCITED", emoji: "🤩", label: "신남", color: "#6C7BFF" },
    { id: 2, key: "HAPPY", emoji: "😊", label: "행복", color: "#6FCF97" },
    { id: 3, key: "CALM", emoji: "🙂", label: "평온", color: "#F2C94C" },
    { id: 4, key: "ANXIOUS", emoji: "😟", label: "불안", color: "#F2994A" },
    { id: 5, key: "SAD", emoji: "😢", label: "슬픔", color: "#56CCF2" },
    { id: 6, key: "ANGRY", emoji: "😠", label: "화남", color: "#EB5757" },
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const a = ((angleDeg - 90) * Math.PI) / 180.0;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function getNowYears() {
    const now = new Date();
    const y = now.getFullYear();
    return [y, y - 1, y - 2, y - 3, y - 4];
}

function DropdownButton({
                            label,
                            onPress,
                            disabled,
                            width = 120,
                        }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    width?: number;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.dropdownBtn,
                { width, opacity: disabled ? 0.5 : pressed ? 0.92 : 1 },
            ]}
        >
            <Text style={styles.dropdownText}>{label}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </Pressable>
    );
}

function OptionModal<T>({
                            visible,
                            title,
                            options,
                            labelFor,
                            onClose,
                            onSelect,
                        }: {
    visible: boolean;
    title: string;
    options: T[];
    labelFor: (v: T) => string;
    onClose: () => void;
    onSelect: (v: T) => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={() => {}}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(_, idx) => String(idx)}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                                style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.85 }]}
                            >
                                <Text style={styles.modalItemText}>{labelFor(item)}</Text>
                            </Pressable>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.modalSep} />}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function LineChart({ data }: { data: LinePoint[] }) {
    const { width: screenW } = useWindowDimensions();

    const W = Math.min(380, Math.max(300, screenW - 36));
    const H = 210;

    const paddingL = 40;
    const paddingR = 26;
    const paddingT = 16;
    const paddingB = 44;

    const minY = 0;

    const rawMax = Math.max(...data.map((d) => d.value), 0);

    const pickNiceMax = (value: number) => {
        if (value <= 1) return 2;
        if (value <= 3) return 4;
        if (value <= 5) return 6;
        if (value <= 8) return 8;
        if (value <= 10) return 10;
        if (value <= 15) return 15;
        if (value <= 20) return 20;
        if (value <= 30) return 30;
        return Math.ceil(value / 10) * 10;
    };

    const maxY = pickNiceMax(Math.ceil(rawMax * 1.2));

    const makeTicks = (max: number) => {
        if (max <= 4) return [0, 1, 2, 4];
        if (max <= 6) return [0, 2, 4, 6];
        if (max <= 8) return [0, 3, 5, 8];
        if (max <= 10) return [0, 3, 6, 10];
        if (max <= 15) return [0, 5, 10, 15];
        if (max <= 20) return [0, 7, 14, 20];
        if (max <= 30) return [0, 10, 20, 30];

        const step = Math.ceil(max / 3);
        return [0, step, step * 2, max];
    };

    const yTicks = makeTicks(maxY);

    const plotW = W - paddingL - paddingR;
    const plotH = H - paddingT - paddingB;

    const points = data.map((d) => {
        const x = paddingL + (plotW * d.hour) / 23;
        const clampedValue = Math.max(minY, Math.min(d.value, maxY));
        const y = paddingT + plotH * (1 - (clampedValue - minY) / (maxY - minY || 1));
        return { ...d, x, y };
    });

    const pathD = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const xTicks = [
        { label: "00시", hour: 0 },
        { label: "04시", hour: 4 },
        { label: "08시", hour: 8 },
        { label: "12시", hour: 12 },
        { label: "16시", hour: 16 },
        { label: "20시", hour: 20 },
        { label: "24시", hour: 23 },
    ];

    return (
        <View style={styles.chartWrap}>
            <Svg width={W} height={H}>
                <Rect x={0} y={0} width={W} height={H} rx={12} ry={12} fill={COLORS.white} />

                {yTicks.map((tick) => {
                    const y = paddingT + plotH * (1 - (tick - minY) / (maxY - minY || 1));
                    return (
                        <Line
                            key={`grid-${tick}`}
                            x1={paddingL}
                            x2={W - paddingR}
                            y1={y}
                            y2={y}
                            stroke="#E9E9E9"
                            strokeWidth={1}
                        />
                    );
                })}

                {yTicks.map((tick) => {
                    const y = paddingT + plotH * (1 - (tick - minY) / (maxY - minY || 1));
                    return (
                        <SvgText
                            key={`y-${tick}`}
                            x={paddingL - 10}
                            y={y + 4}
                            fontSize={11}
                            fill={COLORS.primary}
                            textAnchor="end"
                        >
                            {tick}
                        </SvgText>
                    );
                })}

                <Path d={pathD} fill="none" stroke="#6C7BFF" strokeWidth={2.5} />

                {points
                    .filter((p) => [0, 4, 8, 12, 16, 20, 23].includes(p.hour))
                    .map((p) => (
                        <Circle key={p.hour} cx={p.x} cy={p.y} r={3} fill="#6C7BFF" />
                ))}

                {xTicks.map((tick, i) => {
                    let x = paddingL + (plotW * tick.hour) / 23;
                    let anchor: "start" | "middle" | "end" = "middle";

                    if (i === 0) {
                        anchor = "start";
                        x = paddingL - 2;
                    } else if (i === xTicks.length - 1) {
                        anchor = "end";
                        x = W - paddingR + 2;
                    }

                    return (
                        <SvgText
                            key={`x-${tick.label}`}
                            x={x}
                            y={H - 16}
                            fontSize={11}
                            fill={COLORS.primary}
                            textAnchor={anchor}
                        >
                            {tick.label}
                        </SvgText>
                    );
                })}
            </Svg>
        </View>
    );
}

function PieChart({ slices }: { slices: PieSlice[] }) {
    const { width: screenW } = useWindowDimensions();

    const visibleSlices = slices.filter((s) => s.value > 0);
    const total = visibleSlices.reduce((acc, s) => acc + s.value, 0);

    if (total === 0) {
        return (
            <View style={styles.pieSection}>
                <View style={styles.emptyPie}>
                    <Text style={styles.emptyPieText}>아직 감정 데이터가 없어요</Text>
                </View>
            </View>
        );
    }

    const pieSize = Math.min(260, Math.max(210, screenW - 140));
    const r = pieSize * 0.38;
    const cx = pieSize * 0.45;
    const cy = pieSize * 0.5;

    let start = 0;

    const parts = visibleSlices.map((s) => {
        const angle = (s.value / total) * 360;
        const end = start + angle;
        const mid = angle >= 360 ? 180 : (start + end) / 2;
        const labelPos = polarToCartesian(cx, cy, r * 0.58, mid);

        const isFullCircle = angle >= 359.999;

        const d = isFullCircle
            ? undefined
            : describeArc(cx, cy, r, start, end);

        const out = {
            ...s,
            start,
            end,
            d,
            labelPos,
            angle,
            isFullCircle,
        };

        start = end;
        return out;
    });

    return (
        <View style={styles.pieWrapRow}>
            <Svg width={pieSize} height={pieSize}>
                {parts.map((p) => {
                    const percent = Math.round((p.value / total) * 100);

                    return (
                        <G key={p.key}>
                            {p.isFullCircle ? (
                                <Circle cx={cx} cy={cy} r={r} fill={p.color} />
                            ) : (
                                <Path d={p.d!} fill={p.color} />
                            )}

                            {p.angle >= 28 && (
                                <>
                                    <SvgText
                                        x={p.labelPos.x}
                                        y={p.labelPos.y}
                                        fontSize={16}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                    >
                                        {p.emoji}
                                    </SvgText>
                                    <SvgText
                                        x={p.labelPos.x}
                                        y={p.labelPos.y + 20}
                                        fontSize={12}
                                        fill={COLORS.white}
                                        fontWeight="700"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                    >
                                        {percent}%
                                    </SvgText>
                                </>
                            )}
                        </G>
                    );
                })}
            </Svg>

            <View style={styles.legend}>
                {visibleSlices.map((s) => (
                    <View key={s.key} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                        <Text style={styles.legendEmoji}>{s.emoji}</Text>
                        <Text style={styles.legendLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function getThinkingStyleLabel(data: ThinkingStyleApi | null, nickname: string) {
    if (!data) return "“ 아직 분석 데이터가 없습니다 ”";

    const entries = [
        { key: "critic", label: "비평형", value: data.critic },
        { key: "emotion", label: "감정형", value: data.emotion },
        { key: "analysis", label: "분석형", value: data.analysis },
        { key: "empathy", label: "공감형", value: data.empathy },
        { key: "creative", label: "창의형", value: data.creative },
    ];

    entries.sort((a, b) => b.value - a.value);
    return `“ ${nickname}님은 ${entries[0].label} 사고 스타일입니다 ”`;
}

function buildFixedPieData(apiSlices: Array<{ label: string; value: number }> = []): PieSlice[] {
    const valueMap = new Map<string, number>();

    for (const slice of apiSlices) {
        valueMap.set(String(slice.label), Number(slice.value) || 0);
    }

    return EMOTION_ITEMS.map((item) => ({
        key: item.key,
        emoji: item.emoji,
        label: item.label,
        value: valueMap.get(item.key) ?? 0,
        color: item.color,
    }));
}

export default function ReadingPreferenceScreen() {
    const router = useRouter();

    const [nickname, setNickname] = useState("사용자");

    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [genre, setGenre] = useState<string>("소설");

    const [yearOpen, setYearOpen] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);
    const [genreOpen, setGenreOpen] = useState(false);

    const [genreOptions, setGenreOptions] = useState<string[]>(DEFAULT_GENRES);

    const [thinkingStyle, setThinkingStyle] = useState<ThinkingStyleApi | null>(null);
    const [lineData, setLineData] = useState<LinePoint[]>([]);
    const [pieData, setPieData] = useState<PieSlice[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const userIdRaw = await AsyncStorage.getItem("auth_user_id");
                if (!userIdRaw) return;

                const profileRes = await getMyProfile(Number(userIdRaw));
                setNickname(profileRes.data.nickname || "사용자");
            } catch {}
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getAvailableGenres();
                const list = (res.data || []).filter(Boolean);

                if (list.length > 0) {
                    setGenreOptions(list);
                    setGenre((prev) => (list.includes(prev) ? prev : list[0]));
                } else {
                    setGenreOptions(DEFAULT_GENRES);
                    setGenre("소설");
                }
            } catch {
                setGenreOptions(DEFAULT_GENRES);
                setGenre("소설");
            }
        })();
    }, []);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                setLoading(true);

                const [thinkingRes, activityRes, emotionGenreRes] = await Promise.all([
                    getThinkingStyleStats(year, month),
                    getActivityStats(year, month),
                    getEmotionGenreStats({
                        mode: "GENRE_TO_EMOTION",
                        genre,
                        year,
                        month,
                    }),
                ]);

                setThinkingStyle(thinkingRes.data);

                const mappedLine: LinePoint[] = Array.from({ length: 24 }, (_, hour) => {
                    const found = (activityRes.data || []).find((item) => item.hour === hour);

                    return {
                        hour,
                        xLabel: `${String(hour).padStart(2, "0")}시`,
                        value: found ? Math.round(found.participationScore) : 0,
                    };
                });

                setLineData(mappedLine);
                setPieData(buildFixedPieData(emotionGenreRes.data.slices || []));
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "분석 데이터를 불러오지 못했습니다.";
                Alert.alert("불러오기 실패", message);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [year, month, genre]);

    const thinkingStyleText = useMemo(
        () => getThinkingStyleLabel(thinkingStyle, nickname),
        [thinkingStyle, nickname]
    );

    const yearLabel = year ? `${year} 년` : "전체";
    const monthLabel = month ? `${String(month).padStart(2, "0")} 월` : "전체";

    const yearOptions = useMemo<(number | null)[]>(() => [null, ...getNowYears()], []);
    const monthOptions = useMemo<(number | null)[]>(
        () => [null, ...Array.from({ length: 12 }, (_, i) => i + 1)],
        []
    );

    const fallbackLineData: LinePoint[] = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        xLabel: `${String(hour).padStart(2, "0")}시`,
        value: 0,
    }));

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerLeft}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        <Text style={styles.headerTitle}>나의 독서 성향 분석</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.hr} />

                    <View style={styles.row}>
                        <DropdownButton label={yearLabel} onPress={() => setYearOpen(true)} width={150} />
                        <DropdownButton label={monthLabel} onPress={() => setMonthOpen(true)} width={120} />
                    </View>

                    <Text style={styles.sectionBracket}>[ 사고 스타일 ]</Text>
                    <Text style={styles.thinkingStyle}>{loading ? "불러오는 중..." : thinkingStyleText}</Text>

                    <Text style={[styles.sectionBracket, { marginTop: 26 }]}>[ 채팅 시간대 - 채팅 참여도 ]</Text>
                    <LineChart data={lineData.length > 0 ? lineData : fallbackLineData} />

                    <Text style={[styles.sectionBracket, { marginTop: 28 }]}>[ 책 장르에 따른 감정 ]</Text>

                    <View style={{ marginTop: 14 }}>
                        <DropdownButton label={genre} onPress={() => setGenreOpen(true)} width={170} />
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <PieChart slices={pieData} />
                    </View>
                </ScrollView>

                <OptionModal<number | null>
                    visible={yearOpen}
                    title="연도 선택"
                    options={yearOptions}
                    labelFor={(v) => (v === null ? "전체" : `${v}년`)}
                    onClose={() => setYearOpen(false)}
                    onSelect={(v) => {
                        setYear(v);
                        if (v === null) setMonth(null);
                    }}
                />

                <OptionModal<number | null>
                    visible={monthOpen}
                    title="월 선택"
                    options={monthOptions}
                    labelFor={(v) => (v === null ? "전체" : `${String(v).padStart(2, "0")}월`)}
                    onClose={() => setMonthOpen(false)}
                    onSelect={(v) => setMonth(v)}
                />

                <OptionModal<string>
                    visible={genreOpen}
                    title="장르 선택"
                    options={genreOptions}
                    labelFor={(v) => v}
                    onClose={() => setGenreOpen(false)}
                    onSelect={(v) => setGenre(v)}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: {
        paddingHorizontal: 18,
        paddingBottom: 36,
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
    hr: {
        height: 1,
        backgroundColor: COLORS.primary,
        opacity: 0.18,
        marginBottom: 18,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dropdownBtn: {
        height: 46,
        borderRadius: 14,
        paddingHorizontal: 14,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
    },
    sectionBracket: {
        marginTop: 18,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "900",
        color: COLORS.primary,
    },
    thinkingStyle: {
        marginTop: 16,
        textAlign: "center",
        fontSize: 23,
        lineHeight: 34,
        fontWeight: "900",
        color: "#0E6A50",
    },
    chartWrap: {
        marginTop: 14,
        alignItems: "center",
    },
    pieSection: {
        alignItems: "center",
        justifyContent: "center",
    },
    pieWrapRow: {
        marginTop: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    legend: {
        gap: 14,
        justifyContent: "center",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendEmoji: {
        fontSize: 22,
        marginRight: 6,
    },
    legendLabel: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.primary,
    },
    emptyPie: {
        width: 210,
        height: 210,
        borderRadius: 105,
        backgroundColor: "#D9D9D9",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyPieText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.primary,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.18)",
        justifyContent: "center",
        paddingHorizontal: 22,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: "hidden",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 14,
    },
    modalItem: {
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    modalItemText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
    },
    modalSep: {
        height: 1,
        backgroundColor: "#E7E7E7",
    },
});