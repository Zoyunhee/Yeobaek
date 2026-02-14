import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";

export default function ResultDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string }>();
    const [q, setQ] = useState(params.q ?? "");
    const [liked, setLiked] = useState(false);

    const book = useMemo(
        () => ({
            title: "어린 왕자",
            author: "생텍쥐페리",
            desc: "임시 설명",
            coverUrl: "https://picsum.photos/200/300?random=21",
            long: "긴 설명\n".repeat(25),
        }),
        []
    );

    return (
        <SafeAreaView style={styles.screen}>
            {/* 상단 바 */}
            <View style={styles.top}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </Pressable>

                <View style={{ flex: 1 }}>
                    <SearchBar value={q} onChangeText={setQ} onSubmit={() => {}} />
                </View>
            </View>

            {/* 본문 */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    {/* 책 정보 */}
                    <View style={styles.row}>
                        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
                        <View style={styles.meta}>
                            <Text style={styles.title}>{book.title}</Text>
                            <Text style={styles.author}>{book.author}</Text>
                            <Text style={styles.desc}>{book.desc}</Text>
                        </View>
                    </View>

                    {/* 버튼 (홈이랑 동일한 스타일) */}
                    <View style={styles.btnRow}>
                        <Pressable style={styles.smallBtn}
                        onPress={() => setLiked((prev) => !prev)}
                        >
                            <Ionicons
                                name={liked ?  "heart" : "heart-outline"}
                                size={16}
                                color={COLORS.white}
                            />
                            <Text style={styles.smallBtnText}>찜하기</Text>
                        </Pressable>

                        <Pressable style={styles.smallBtn}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.white} />
                            <Text style={styles.smallBtnText}>AI 채팅 가기</Text>
                        </Pressable>
                    </View>

                    {/* 긴 설명 */}
                    <View style={styles.longWrap}>
                        <Text style={styles.longText}>{book.long}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },

    top: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    backBtn: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
    },

    content: {
        paddingHorizontal: 18,
        paddingBottom: 24,
    },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
    },

    row: {
        flexDirection: "row",
        gap: 12,
    },
    cover: {
        width: 54,
        height: 74,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    meta: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: "900",
        color: COLORS.primary,
    },
    author: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.muted,
    },
    desc: {
        fontSize: 12,
        color: COLORS.primary,
    },

    btnRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    smallBtn: {
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
    },
    smallBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "800",
    },

    longWrap: {
        marginTop: 14,
    },
    longText: {
        fontSize: 12.5,
        lineHeight: 18.5,
        color: COLORS.primary,
    },
});
