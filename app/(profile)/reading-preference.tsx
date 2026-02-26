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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Svg, { G, Line, Path, Circle, Text as SvgText, Rect } from "react-native-svg";

import { COLORS } from "@/constants/colors";

const PREF_GENRES_KEY = "pref_genres_v1";

type LinePoint = { xLabel: string; hour: number; value: number };
type PieSlice = { key: string; emoji: string; value: number; color: string };

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

/** 더미: (연/월 선택)에 따라 값만 살짝 바뀌게 */
function makeDummyLineData(year: number | null, month: number | null): LinePoint[] {
    const base = year ? (year % 7) : 2;
    const m = month ? month : 0;

    const raw = [
        21 + base + (m % 2),
        19 + base,
        20 + base + (m % 3),
        24 + base + (m % 2),
        30 + base + (m % 3),
        29 + base,
        23 + base + (m % 2),
    ];

    const hours = [0, 4, 8, 12, 16, 20, 24];
    return hours.map((h, i) => ({
        hour: h,
        xLabel: `${String(h).padStart(2, "0")}시`,
        value: raw[i],
    }));
}

function makeDummyPieData(genre: string): PieSlice[] {
    const seed = Array.from(genre).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const a = 60 + (seed % 40);
    const b = 30 + (seed % 25);
    const c = 8 + (seed % 12);

    return [
        { key: "HAPPY", emoji: "😁", value: a, color: "#6C7BFF" },
        { key: "SAD", emoji: "😭", value: b, color: "#6FCF97" },
        { key: "NEUTRAL", emoji: "😶", value: c, color: "#F2C94C" },
    ];
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

    // ✅ 화면 기준 반응형
    const W = Math.min(380, Math.max(300, screenW - 36)); // 너무 작으면 300까지 보장
    const H = 210;

    const paddingL = 40;
    const paddingR = 26; // ✅ 오른쪽 라벨 잘림 방지
    const paddingT = 16;
    const paddingB = 44;

    const maxY = Math.max(...data.map((d) => d.value), 1);
    const minY = 0;

    const plotW = W - paddingL - paddingR;
    const plotH = H - paddingT - paddingB;

    const xStep = plotW / (data.length - 1);

    const points = data.map((d, i) => {
        const x = paddingL + i * xStep;
        const y = paddingT + plotH * (1 - (d.value - minY) / (maxY - minY || 1));
        return { ...d, x, y };
    });

    const pathD = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const gridY = [0, 0.5, 1].map((t) => paddingT + plotH * t);

    return (
        <View style={styles.chartWrap}>
            <Svg width={W} height={H}>
                <Rect x={0} y={0} width={W} height={H} rx={12} ry={12} fill={COLORS.white} />

                {gridY.map((y, idx) => (
                    <Line
                        key={idx}
                        x1={paddingL}
                        x2={W - paddingR}
                        y1={y}
                        y2={y}
                        stroke="#E9E9E9"
                        strokeWidth={1}
                    />
                ))}

                {["00", "10", "20", "30"].map((t, i) => (
                    <SvgText
                        key={t}
                        x={paddingL - 10}
                        y={paddingT + plotH - (plotH * i) / 3 + 4}
                        fontSize={11}
                        fill={COLORS.primary}
                        textAnchor="end"
                    >
                        {t}
                    </SvgText>
                ))}

                <Path d={pathD} fill="none" stroke="#6C7BFF" strokeWidth={2.5} />

                {points.map((p) => (
                    <Circle key={p.hour} cx={p.x} cy={p.y} r={4} fill="#6C7BFF" />
                ))}

                {points.map((p, i) => {
                    const isLast = i === points.length - 1;
                    return (
                        <SvgText
                            key={i}
                            x={isLast ? W - paddingR : p.x}  // ✅ 마지막 라벨은 화면 끝 기준 고정
                            y={H - 16}                       // ✅ 기존(H-10)보다 아래로 내림
                            fontSize={11}
                            fill={COLORS.primary}
                            textAnchor={isLast ? "end" : "middle"}
                        >
                            {p.xLabel}
                        </SvgText>
                    );
                })}
            </Svg>
        </View>
    );
}

function PieChart({ slices }: { slices: PieSlice[] }) {
    const { width: screenW } = useWindowDimensions();

    // ✅ 반응형 파이 사이즈
    const pieSize = Math.min(260, Math.max(210, screenW - 140)); // legend 공간 고려
    const r = pieSize * 0.38;
    const cx = pieSize * 0.45;
    const cy = pieSize * 0.5;

    const total = Math.max(1, slices.reduce((acc, s) => acc + s.value, 0));
    let start = 0;

    const parts = slices.map((s) => {
        const angle = (s.value / total) * 360;
        const end = start + angle;

        const mid = (start + end) / 2;
        const labelPos = polarToCartesian(cx, cy, r * 0.58, mid);

        const d = describeArc(cx, cy, r, start, end);
        const out = { ...s, start, end, d, labelPos };
        start = end;
        return out;
    });

    return (
        <View style={styles.pieWrapRow}>
            <Svg width={pieSize} height={pieSize}>
                {parts.map((p) => (
                    <G key={p.key}>
                        <Path d={p.d} fill={p.color} />
                        <SvgText x={p.labelPos.x} y={p.labelPos.y} fontSize={16} textAnchor="middle" alignmentBaseline="middle">
                            {p.emoji}
                        </SvgText>
                        <SvgText
                            x={p.labelPos.x}
                            y={p.labelPos.y + 20}
                            fontSize={16}
                            fill={COLORS.white}
                            fontWeight="700"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {p.value}
                        </SvgText>
                    </G>
                ))}
            </Svg>

            <View style={styles.legend}>
                {slices.map((s) => (
                    <View key={s.key} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                        <Text style={styles.legendEmoji}>{s.emoji}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function ReadingPreferenceScreen() {
    const router = useRouter();

    // ✅ 전체기간 모드 지원
    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [genre, setGenre] = useState<string>("로맨스");

    const [yearOpen, setYearOpen] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);
    const [genreOpen, setGenreOpen] = useState(false);

    const [genreOptions, setGenreOptions] = useState<string[]>([
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
    ]);

    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem(PREF_GENRES_KEY);
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw) as string[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setGenreOptions(parsed);
                    setGenre((prev) => (parsed.includes(prev) ? prev : parsed[0]));
                }
            } catch {}
        })();
    }, []);

    // TODO: 백엔드로 교체 예정
    const thinkingStyleText = useMemo(() => `“ 여백님은 사색형 사고 스타일입니다 ”`, []);

    const lineData = useMemo(() => makeDummyLineData(year, month), [year, month]);
    const pieData = useMemo(() => makeDummyPieData(genre), [genre]);

    const yearLabel = year ? `${year} 년` : "전체";
    const monthLabel = month ? `${String(month).padStart(2, "0")} 월` : "전체";

    const yearOptions = useMemo<(number | null)[]>(() => [null, ...getNowYears()], []);
    const monthOptions = useMemo<(number | null)[]>(() => [null, ...Array.from({ length: 12 }, (_, i) => i + 1)], []);

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
                    <Text style={styles.thinkingStyle}>{thinkingStyleText}</Text>

                    <Text style={[styles.sectionBracket, { marginTop: 26 }]}>[ 채팅 시간대 - 채팅 참여도 ]</Text>
                    <LineChart data={lineData} />

                    <Text style={[styles.sectionBracket, { marginTop: 28 }]}>[ 책 장르에 따른 감정 ]</Text>

                    <View style={{ marginTop: 14 }}>
                        <DropdownButton label={genre} onPress={() => setGenreOpen(true)} width={170} />
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <PieChart slices={pieData} />
                    </View>
                </ScrollView>

                {/* Year */}
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

                {/* Month */}
                <OptionModal<number | null>
                    visible={monthOpen}
                    title="월 선택"
                    options={monthOptions}
                    labelFor={(v) => (v === null ? "전체" : `${String(v).padStart(2, "0")}월`)}
                    onClose={() => setMonthOpen(false)}
                    onSelect={(v) => setMonth(v)}
                />

                {/* Genre */}
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

    header: {
        height: 52,
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -0.3,
    },

    container: {
        paddingHorizontal: 18,
        paddingBottom: 40,
    },

    hr: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 18,
        opacity: 0.9,
    },

    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 18,
    },

    dropdownBtn: {
        height: 44,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: "900",
        color: COLORS.primary,
    },

    sectionBracket: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "900",
        color: COLORS.primary,
        marginTop: 4,
    },

    thinkingStyle: {
        textAlign: "center",
        fontSize: 26,
        fontWeight: "900",
        color: COLORS.stepGreen,
        marginTop: 14,
        lineHeight: 34,
    },

    chartWrap: {
        marginTop: 14,
        alignItems: "center",
    },

    pieWrapRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },

    legend: {
        width: 70,
        paddingTop: 8,
        gap: 18,
        alignItems: "flex-start",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendEmoji: {
        fontSize: 22,
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.25)",
        justifyContent: "center",
        padding: 22,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        maxHeight: "70%",
    },
    modalTitle: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: "900",
        color: COLORS.primary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalItem: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    modalItemText: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
    },
    modalSep: {
        height: 1,
        backgroundColor: COLORS.border,
        opacity: 0.7,
    },
});