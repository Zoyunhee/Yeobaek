import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import AppButton from "@/components/ui/AppButton";
import {
    type BookSearchItem,
    createAiRoom,
    getBookGenre,
    saveBook,
    saveEmotionLog,
    searchBooks,
} from "@/services/api";

const emotionItems = [
    { id: 1, emoji: "🤩", label: "신남" },
    { id: 2, emoji: "😊", label: "행복" },
    { id: 3, emoji: "🙂", label: "평온" },
    { id: 4, emoji: "😟", label: "불안" },
    { id: 5, emoji: "😢", label: "슬픔" },
    { id: 6, emoji: "😠", label: "화남" },
] as const;

export default function AiCreateScreen() {
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<BookSearchItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selected, setSelected] = useState<BookSearchItem | null>(null);
    const [selectedEmotionId, setSelectedEmotionId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await searchBooks(query.trim());
                setSearchResults(res.items ?? []);
            } catch (e) {
                console.error("도서 검색 실패:", e);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const displayList = query.trim() ? searchResults : [];

    const create = useCallback(async () => {
        if (!selected) {
            Alert.alert("도서를 선택해주세요");
            return;
        }

        if (selectedEmotionId == null) {
            Alert.alert("감정을 선택해주세요");
            return;
        }

        if (!selected.isbn) {
            Alert.alert("오류", "ISBN이 없는 도서는 선택할 수 없습니다.");
            return;
        }

        setIsCreating(true);

        try {
            // 1) 장르 보강
            let genre = selected.genre ?? "기타";

            try {
                const genreRes = await getBookGenre(selected.isbn);
                genre = genreRes.data?.genre ?? genre;
            } catch (e) {
                console.warn("장르 조회 실패 - 기타로 진행:", e);
            }

            // 2) 책 DB 저장
            await saveBook({
                isbn: selected.isbn,
                title: selected.title,
                authors: selected.authors ?? [],
                publisher: selected.publisher,
                thumbnail: selected.thumbnail,
                genre,
            });

            // 3) 채팅방 생성
            const roomRes = await createAiRoom({
                isbn: selected.isbn,
                title: selected.title,
                coverUrl: selected.thumbnail,
                authorText: selected.authors?.join(", "),
                publisher: selected.publisher,
                genre,
                emotionId: selectedEmotionId,
            });

            const roomId = roomRes.roomId;

            // 4) 감정 로그 저장
            await saveEmotionLog({
                roomId,
                emotionId: selectedEmotionId,
            });

            // 5) 채팅방으로 이동
            router.replace({
                pathname: "/(tabs)/chat/ai-room",
                params: {
                    roomId: String(roomId),
                    bookTitle: selected.title,
                },
            } as never);
        } catch (e: any) {
            Alert.alert("채팅방 생성 실패", e?.message ?? "다시 시도해주세요.");
        } finally {
            setIsCreating(false);
        }
    }, [selected, selectedEmotionId, router]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <ScrollView
                contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }}
                keyboardShouldPersistTaps="handled"
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Pressable onPress={() => router.back()} hitSlop={10}>
                        <Ionicons name="close" size={22} color={COLORS.primary} />
                    </Pressable>

                    <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "900" }}>
                        AI 채팅 만들기
                    </Text>

                    <View style={{ width: 22 }} />
                </View>

                <View
                    style={{
                        width: 140,
                        height: 200,
                        alignSelf: "center",
                        borderRadius: 12,
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        overflow: "hidden",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {selected?.thumbnail ? (
                        <Image
                            source={{ uri: selected.thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                        />
                    ) : (
                        <Ionicons name="book-outline" size={48} color={COLORS.border} />
                    )}
                </View>

                <View
                    style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        padding: 12,
                        gap: 10,
                    }}
                >
                    <SearchBar
                        value={query}
                        onChangeText={setQuery}
                        placeholder="도서 검색 (제목 또는 저자)"
                    />

                    {isSearching && (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    )}

                    {!query.trim() && selected && (
                        <View
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 10,
                                borderRadius: 10,
                                backgroundColor: COLORS.mintLight,
                                borderWidth: 1,
                                borderColor: COLORS.mint,
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                                ✓ {selected.title}
                            </Text>
                            <Text style={{ color: COLORS.muted, marginTop: 2 }}>
                                {selected.authors?.join(", ")}
                            </Text>
                        </View>
                    )}

                    {query.trim() && !isSearching && (
                        <View style={{ gap: 8 }}>
                            {displayList.length === 0 ? (
                                <Text
                                    style={{
                                        color: COLORS.muted,
                                        textAlign: "center",
                                        paddingVertical: 10,
                                    }}
                                >
                                    검색 결과가 없습니다
                                </Text>
                            ) : (
                                displayList.map((b, index) => {
                                    const active =
                                        selected?.isbn === b.isbn && selected?.title === b.title;

                                    return (
                                        <Pressable
                                            key={`${b.isbn || "noisbn"}-${b.title || "notitle"}-${index}`}
                                            onPress={() => {
                                                setSelected(b);
                                                setQuery("");
                                            }}
                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 10,
                                                borderRadius: 10,
                                                backgroundColor: active ? COLORS.mintLight : COLORS.bg,
                                                borderWidth: 1,
                                                borderColor: active ? COLORS.mint : COLORS.border,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            {b.thumbnail ? (
                                                <Image
                                                    source={{ uri: b.thumbnail }}
                                                    style={{
                                                        width: 40,
                                                        height: 56,
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: 40,
                                                        height: 56,
                                                        borderRadius: 4,
                                                        backgroundColor: COLORS.border,
                                                    }}
                                                />
                                            )}

                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        color: COLORS.primary,
                                                        fontWeight: "900",
                                                    }}
                                                    numberOfLines={2}
                                                >
                                                    {b.title}
                                                </Text>

                                                <Text
                                                    style={{ color: COLORS.muted, marginTop: 2 }}
                                                    numberOfLines={1}
                                                >
                                                    {b.authors?.join(", ")} · {b.publisher}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>

                <View
                    style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        padding: 12,
                        gap: 12,
                    }}
                >
                    <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                        책을 어떤 감정으로 읽고 있나요?
                    </Text>

                    {emotionItems.map((item) => {
                        const active = selectedEmotionId === item.id;

                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => setSelectedEmotionId(item.id)}
                                style={{
                                    borderRadius: 999,
                                    paddingVertical: 14,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    backgroundColor: active ? COLORS.primary : COLORS.secondary,
                                }}
                            >
                                <Text
                                    style={{
                                        fontWeight: "900",
                                        color: active ? COLORS.white : COLORS.primary,
                                    }}
                                >
                                    {item.emoji} {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <AppButton
                    title={isCreating ? "생성 중..." : "AI 채팅 생성"}
                    onPress={create}
                    disabled={isCreating || !selected || selectedEmotionId == null}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
