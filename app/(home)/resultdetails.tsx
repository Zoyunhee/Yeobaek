import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import {
    addWishlist,
    removeWishlistByIsbn,
    checkWishlist,
} from "@/services/api";

export default function ResultDetailsScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        q?: string;
        isbn?: string;
        title?: string;
        author?: string;
        desc?: string;
        coverUrl?: string;
        publisher?: string;
        contents?: string;
    }>();

    const [q, setQ] = useState(params.q ?? "");
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);

    const book = {
        isbn: params.isbn ?? "",
        title: params.title ?? "",
        author: params.author ?? "",
        desc: params.desc ?? params.contents ?? "",
        coverUrl: params.coverUrl ?? "",
        publisher: params.publisher ?? "",
    };

    const displayAuthor = book.author?.trim() ? book.author.trim() : "";
    const showPublisherOnly = !displayAuthor && !!book.publisher?.trim();

    useEffect(() => {
        const loadWishState = async () => {
            try {
                if (!book.isbn) return;

                const rawUser = await AsyncStorage.getItem("user");
                if (!rawUser) return;

                const user = JSON.parse(rawUser);
                const userId = Number(user.id);
                if (!userId) return;

                const res = await checkWishlist(userId, book.isbn);
                setLiked(!!res.isWishlisted);
            } catch (e) {
                console.log("찜 여부 확인 실패", e);
            }
        };

        loadWishState();
    }, [book.isbn]);

    const onToggleWishlist = async () => {
        try {
            if (!book.isbn || !book.title) {
                Alert.alert("오류", "책 정보가 올바르지 않습니다.");
                return;
            }

            setLoading(true);

            const rawUser = await AsyncStorage.getItem("user");
            if (!rawUser) throw new Error("로그인 정보가 없습니다.");

            const user = JSON.parse(rawUser);
            const userId = Number(user.id);

            if (!userId) {
                throw new Error("사용자 정보가 올바르지 않습니다.");
            }

            if (liked) {
                await removeWishlistByIsbn(userId, book.isbn);
                setLiked(false);
                Alert.alert("완료", "찜이 취소되었습니다.");
            } else {
                await addWishlist({
                    userId,
                    bookIsbn: book.isbn,
                    bookTitle: book.title,
                    author: book.author ?? "",
                    coverImage: book.coverUrl ?? "",
                    publisher: book.publisher ?? "",
                });
                setLiked(true);
                Alert.alert("완료", "찜 목록에 추가되었습니다.");
            }
        } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "찜 처리 실패");
        } finally {
            setLoading(false);
        }
    };

    const goAiChat = () => {
        router.push({
            pathname: "/(tabs)/chat/ai-create",
            params: {
                isbn: book.isbn,
                title: book.title,
                coverUrl: book.coverUrl,
                author: book.author,
                publisher: book.publisher,
            },
        });
    };

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.top}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <SearchBar value={q} onChangeText={setQ} onSubmit={() => {}} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.row}>
                        {book.coverUrl ? (
                            <Image source={{ uri: book.coverUrl }} style={styles.cover} />
                        ) : (
                            <View style={[styles.cover, styles.coverFallback]}>
                                <Ionicons name="book-outline" size={24} color={COLORS.muted} />
                            </View>
                        )}

                        <View style={styles.meta}>
                            <Text style={styles.title}>{book.title}</Text>

                            {!!displayAuthor && (
                                <Text style={styles.author}>{displayAuthor}</Text>
                            )}

                            {showPublisherOnly && (
                                <Text style={styles.publisher}>{book.publisher}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.btnRow}>
                        <Pressable
                            style={[styles.smallBtn, loading && { opacity: 0.6 }]}
                            onPress={onToggleWishlist}
                            disabled={loading}
                        >
                            <Ionicons
                                name={liked ? "heart" : "heart-outline"}
                                size={16}
                                color={COLORS.white}
                            />
                            <Text style={styles.smallBtnText}>
                                {liked ? "찜 취소" : "찜하기"}
                            </Text>
                        </Pressable>

                        <Pressable style={styles.smallBtn} onPress={goAiChat}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.white} />
                            <Text style={styles.smallBtnText}>AI 채팅 가기</Text>
                        </Pressable>
                    </View>

                    {!!book.desc && (
                        <View style={styles.longWrap}>
                            <Text style={styles.longText}>{book.desc}</Text>
                        </View>
                    )}
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
    backBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },

    content: { paddingHorizontal: 18, paddingBottom: 24 },

    card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14 },

    row: { flexDirection: "row", gap: 12 },
    cover: {
        width: 54,
        height: 74,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    coverFallback: { alignItems: "center", justifyContent: "center" },

    meta: { flex: 1, gap: 4 },
    title: {
        fontSize: 15,
        fontWeight: "900",
        color: COLORS.primary,
        lineHeight: 22,
    },
    author: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.muted,
    },
    publisher: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.muted,
    },

    btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
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
    smallBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },

    longWrap: { marginTop: 14 },
    longText: {
        fontSize: 12.5,
        lineHeight: 18.5,
        color: COLORS.primary,
    },
});