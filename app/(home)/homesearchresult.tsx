import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import BookCard, { Book } from "@/components/ui/BookCard";
import { SafeAreaView } from "react-native-safe-area-context";

const dummy: Book[] = [
    {
        id: "1",
        title: "어린 왕자",
        author: "생텍쥐페리",
        desc: "임시 설명",
        coverUrl: "https://picsum.photos/200/300?random=21",
    },
];

export default function HomeSearchResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string }>();
    const [q, setQ] = useState(params.q ?? "");

    const results = useMemo(() => dummy, []);

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={["top"]} style={styles.safe}>
                <View style={styles.top}>
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <SearchBar value={q} onChangeText={setQ} onSubmit={() => {}} />
                    </View>
                </View>
            </SafeAreaView>

            <FlatList
                data={results}
                keyExtractor={(b) => b.id}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    <BookCard
                        book={item}
                        showButtons
                        onPress={() =>
                            router.push({
                                pathname: "/(home)/resultdetails",
                                params: { id: item.id, q },
                            })
                        }
                    />
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
    list: { paddingHorizontal: 18, paddingBottom: 18 },
});
