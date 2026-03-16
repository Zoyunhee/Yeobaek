import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHomeSearchKeywords, SearchKeywordItem } from "@/services/api";

export default function HomeSearchScreen() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const [recent, setRecent] = useState<SearchKeywordItem[]>([]);

    const canSubmit = useMemo(() => q.trim().length > 0, [q]);

    const loadRecentKeywords = async () => {
        try {
            const res = await getHomeSearchKeywords(10);
            setRecent(res.data?.recentKeywords ?? []);
        } catch (error) {
            console.error("최근 검색어 조회 실패", error);
            setRecent([]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRecentKeywords();
        }, [])
    );

    const onSubmit = () => {
        if (!canSubmit) return;

        router.push({
            pathname: "/(home)/homesearchresult",
            params: { q: q.trim() },
        });
    };

    const onPressRecentKeyword = (keyword: string) => {
        router.push({
            pathname: "/(home)/homesearchresult",
            params: { q: keyword },
        });
    };

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={["top"]} style={styles.safe}>
                <View style={styles.top}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <SearchBar value={q} onChangeText={setQ} onSubmit={onSubmit} />
                    </View>
                </View>
            </SafeAreaView>

            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>최근 검색어</Text>
                <Pressable onPress={() => {}}>
                    <Text style={styles.clear}>지우기</Text>
                </Pressable>
            </View>

            <FlatList
                data={recent}
                keyExtractor={(item, index) => `${item.keyword}-${index}`}
                contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>최근 검색어가 없습니다.</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <Pressable
                            style={styles.rowLeft}
                            onPress={() => onPressRecentKeyword(item.keyword)}
                        >
                            <Ionicons
                                name="time-outline"
                                size={16}
                                color={COLORS.neutralDark}
                            />
                            <Text style={styles.rowText}>{item.keyword}</Text>
                        </Pressable>

                        <Pressable onPress={() => {}}>
                            <Ionicons name="close" size={18} color={COLORS.neutralDark} />
                        </Pressable>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    safe: { backgroundColor: COLORS.bg },

    top: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    backBtn: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
    },

    sectionHead: {
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "900",
        color: COLORS.primaryDark,
    },
    clear: {
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

    sep: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 18,
    },
    row: {
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    rowText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },
    emptyText: {
        paddingTop: 12,
        fontSize: 13,
        color: COLORS.neutralDark,
    },
});