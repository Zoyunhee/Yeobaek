import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Pressable,
    FlatList,
    ActivityIndicator,
    Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import BookCard, { Book } from "@/components/ui/BookCard";
import { SafeAreaView } from "react-native-safe-area-context";

import { searchHomeBooks, HomeBookSearchItem } from "@/services/api";

function toBook(item: HomeBookSearchItem, index: number): Book {
    return {
        id: item.isbn ?? String(index),
        isbn: item.isbn,
        title: item.title,
        author: item.authors?.join(", ") ?? "",
        publisher: item.publisher ?? "",
        desc: item.description ?? "",
        coverUrl: item.thumbnailUrl ?? "",
    };
}

export default function HomeSearchResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string }>();
    const [q, setQ] = useState(params.q ?? "");

    const [results, setResults] = useState<HomeBookSearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const doSearch = async (query: string) => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            setError(null);

            const res = await searchHomeBooks(query.trim());
            setResults(res.data?.books ?? []);
        } catch (e: any) {
            setError(e?.message ?? "검색에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.q) {
            doSearch(params.q);
        }
    }, []);

    const onSubmit = () => doSearch(q);

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={["top"]} style={styles.safe}>
                <View style={styles.top}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <SearchBar value={q} onChangeText={setQ} onSubmit={onSubmit} />
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryBtn} onPress={onSubmit}>
                        <Text style={styles.retryText}>다시 시도</Text>
                    </Pressable>
                </View>
            ) : results.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(b, i) => b.isbn ?? String(i)}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    renderItem={({ item, index }) => (
                        <BookCard
                            book={toBook(item, index)}
                            showButtons
                            onPress={() =>
                                router.push({
                                    pathname: "/(home)/resultdetails",
                                    params: {
                                        q,
                                        isbn: item.isbn,
                                        title: item.title,
                                        author: item.authors?.join(", ") ?? "",
                                        desc: item.description ?? "",
                                        coverUrl: item.thumbnailUrl ?? "",
                                        publisher: item.publisher ?? "",
                                    },
                                })
                            }
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },
    safe: { backgroundColor: COLORS.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

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

    list: { paddingHorizontal: 18, paddingBottom: 18 },

    errorText: {
        fontSize: 14,
        color: COLORS.primary,
        marginBottom: 12,
    },
    retryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: "700",
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.muted,
        fontWeight: "600",
    },
});