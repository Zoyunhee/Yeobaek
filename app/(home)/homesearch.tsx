import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeSearchScreen() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const [recent, setRecent] = useState<string[]>([
        "최근 검색어",
        "최근 검색어",
        "최근 검색어",
    ]);

    const canSubmit = useMemo(() => q.trim().length > 0, [q]);

    const onSubmit = () => {
        if (!canSubmit) return;
        router.push({
            pathname: "/(home)/homesearchresult",
            params: { q: q.trim() },
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
                <Pressable onPress={() => setRecent([])}>
                    <Text style={styles.clear}>지우기</Text>
                </Pressable>
            </View>

            <FlatList
                data={recent}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item, index }) => (
                    <View style={styles.row}>
                        <Pressable
                            style={styles.rowLeft}
                            onPress={() =>
                                router.push({
                                    pathname: "/(home)/homesearchresult",
                                    params: { q: item },
                                })
                            }
                        >
                            <Ionicons name="time-outline" size={16} color={COLORS.neutralDark} />
                            <Text style={styles.rowText}>{item}</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setRecent((prev) => prev.filter((_, i) => i !== index))}
                        >
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
    sectionTitle: { fontSize: 12, fontWeight: "900", color: COLORS.primaryDark },
    clear: { fontSize: 12, fontWeight: "800", color: COLORS.neutralDark },

    sep: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 18 },
    row: {
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
