import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import AppButton from "@/components/ui/AppButton";
import {
    type BookSearchItem,
    type BookReviewItem,
    type TopicItem,
    searchBooks,
    getBookReviews,
    createAiRoom, prepareTopics,
} from "@/services/api";

export default function AiCreateScreen() {
    const router = useRouter();
    const { prefillBookTitle, prefillReviewId } = useLocalSearchParams<{
        prefillBookTitle?: string;
        prefillReviewId?: string;
    }>();

    const [query, setQuery] = useState(prefillBookTitle ?? "");
    const [searchResults, setSearchResults] = useState<BookSearchItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedBook, setSelectedBook] = useState<BookSearchItem | null>(null);

    const [reviews, setReviews] = useState<BookReviewItem[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [selectedReviewId, setSelectedReviewId] = useState<number | null>(
        prefillReviewId ? Number(prefillReviewId) : null
    );

    const [topicModalVisible, setTopicModalVisible] = useState(false);
    const [topics, setTopics] = useState<TopicItem[]>([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(false);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const res = await searchBooks(query.trim());
                const items = res.items ?? [];
                setSearchResults(items);

                if (prefillBookTitle && !selectedBook) {
                    const matched = items.find((item) => item.title === prefillBookTitle);
                    if (matched) {
                        setSelectedBook(matched);
                        setQuery("");
                    }
                }
            } catch (e) {
                console.error("도서 검색 실패:", e);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, prefillBookTitle, selectedBook]);

    useEffect(() => {
        let mounted = true;

        async function loadReviews() {
            const baseTitle = selectedBook?.title ?? prefillBookTitle;
            if (!baseTitle) {
                setReviews([]);
                return;
            }

            try {
                setIsLoadingReviews(true);

                const rawUser = await AsyncStorage.getItem("user");
                if (!rawUser) throw new Error("로그인 정보가 없습니다.");

                const user = JSON.parse(rawUser);
                const userId = Number(user.id);

                if (!userId) throw new Error("사용자 정보가 올바르지 않습니다.");

                const res = await getBookReviews(userId);
                if (!mounted || !res.success) return;

                const filtered = (res.data ?? []).filter((review) => {
                    if (selectedBook?.isbn) {
                        return review.bookIsbn === selectedBook.isbn;
                    }
                    return review.bookTitle === baseTitle;
                });

                setReviews(filtered);

                if (prefillReviewId) {
                    const targetId = Number(prefillReviewId);
                    const found = filtered.find((item) => item.id === targetId);
                    if (found) {
                        setSelectedReviewId(found.id);
                        return;
                    }
                }

                if (!selectedReviewId && filtered.length > 0) {
                    setSelectedReviewId(filtered[0].id);
                }
            } catch (e) {
                console.error("독후감 목록 조회 실패:", e);
                if (mounted) setReviews([]);
            } finally {
                if (mounted) setIsLoadingReviews(false);
            }
        }

        loadReviews();

        return () => {
            mounted = false;
        };
    }, [selectedBook, prefillBookTitle, prefillReviewId]);

    const selectedReview =
        reviews.find((review) => review.id === selectedReviewId) ?? null;

    const openTopicModal = useCallback(async () => {
        if (!selectedReview) {
            Alert.alert("안내", "독후감을 선택해주세요.");
            return;
        }

        try {
            setIsLoadingTopics(true);

            const res = await prepareTopics(selectedReview.id);
            const topicList = res.data ?? [];

            if (!topicList.length) {
                Alert.alert("안내", "생성된 발제문이 없습니다. 먼저 독후감 분석/발제문 생성을 진행해주세요.");
                return;
            }

            setTopics(topicList);
            setTopicModalVisible(true);
        } catch (e) {
            console.error("발제문 조회 실패:", e);
            Alert.alert("오류", e instanceof Error ? e.message : "발제문 조회 실패");
        } finally {
            setIsLoadingTopics(false);
        }
    }, [selectedReview]);

    const handleSelectTopic = useCallback(
        async (topic: TopicItem) => {
            if (!selectedReview) return;

            try {
                setIsCreatingRoom(true);

                const rawUser = await AsyncStorage.getItem("user");
                if (!rawUser) throw new Error("로그인 정보가 없습니다.");

                const user = JSON.parse(rawUser);
                const userId = Number(user.id);

                if (!userId) {
                    throw new Error("사용자 정보가 올바르지 않습니다.");
                }

                const numericTopicId = Number(topic.id);
                if (!numericTopicId) {
                    throw new Error("발제문 ID가 올바르지 않습니다.");
                }

                const created = await createAiRoom({
                    userId,
                    reviewId: selectedReview.id,
                    topicId: numericTopicId,
                });

                const roomId = Number(created.roomId ?? 0);

                if (!roomId) {
                    throw new Error("채팅방 ID를 받지 못했습니다.");
                }

                setTopicModalVisible(false);

                router.replace({
                    pathname: "/(tabs)/chat/ai-room",
                    params: {
                        roomId: String(roomId),
                        bookTitle: selectedReview.bookTitle,
                        reviewId: String(selectedReview.id),
                        topicId: String(topic.id),
                        topicLabel: topic.title,
                        topicDescription: topic.description,
                        topicQuestion:
                            topic.firstQuestion ||
                            `${topic.title} 관점에서 이 책을 읽고 가장 먼저 떠오른 생각은 무엇인가요?`,
                    },
                } as never);
            } catch (e) {
                console.error("AI 채팅방 생성 실패:", e);
                Alert.alert("오류", e instanceof Error ? e.message : "채팅방 생성 실패");
            } finally {
                setIsCreatingRoom(false);
            }
        },
        [router, selectedReview]
    );

    const displayList = query.trim() ? searchResults : [];

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
                    {selectedBook?.thumbnail ? (
                        <Image
                            source={{ uri: selectedBook.thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                        />
                    ) : selectedReview?.coverImage ? (
                        <Image
                            source={{ uri: selectedReview.coverImage }}
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

                    {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}

                    {!query.trim() && (selectedBook || prefillBookTitle) && (
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
                                ✓ {selectedBook?.title ?? prefillBookTitle}
                            </Text>
                            {!!selectedBook?.authors?.length && (
                                <Text style={{ color: COLORS.muted, marginTop: 2 }}>
                                    {selectedBook.authors.join(", ")}
                                </Text>
                            )}
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
                                displayList.map((book, index) => {
                                    const active =
                                        selectedBook?.isbn === book.isbn &&
                                        selectedBook?.title === book.title;

                                    return (
                                        <Pressable
                                            key={`${book.isbn || "noisbn"}-${book.title || "notitle"}-${index}`}
                                            onPress={() => {
                                                setSelectedBook(book);
                                                setSelectedReviewId(null);
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
                                            {book.thumbnail ? (
                                                <Image
                                                    source={{ uri: book.thumbnail }}
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
                                                    {book.title}
                                                </Text>

                                                <Text
                                                    style={{ color: COLORS.muted, marginTop: 2 }}
                                                    numberOfLines={1}
                                                >
                                                    {book.authors?.join(", ")} · {book.publisher}
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
                    <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 15 }}>
                        저장된 독후감 불러오기
                    </Text>

                    {!selectedBook && !prefillBookTitle ? (
                        <View
                            style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                backgroundColor: COLORS.bg,
                                paddingVertical: 16,
                                paddingHorizontal: 14,
                            }}
                        >
                            <Text style={{ color: COLORS.muted, textAlign: "center" }}>
                                먼저 도서를 선택해주세요
                            </Text>
                        </View>
                    ) : isLoadingReviews ? (
                        <View
                            style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                backgroundColor: COLORS.bg,
                                paddingVertical: 16,
                                paddingHorizontal: 14,
                                alignItems: "center",
                            }}
                        >
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : reviews.length === 0 ? (
                        <View
                            style={{
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                backgroundColor: COLORS.bg,
                                paddingVertical: 16,
                                paddingHorizontal: 14,
                            }}
                        >
                            <Text style={{ color: COLORS.muted, textAlign: "center" }}>
                                이 책에 연결된 독후감이 없어요
                            </Text>
                        </View>
                    ) : (
                        reviews.map((review) => {
                            const active = selectedReviewId === review.id;

                            return (
                                <Pressable
                                    key={review.id}
                                    onPress={() => setSelectedReviewId(review.id)}
                                    style={{
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: active ? COLORS.mint : COLORS.border,
                                        backgroundColor: active ? COLORS.mintLight : COLORS.secondary,
                                        padding: 12,
                                        gap: 6,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: COLORS.primary,
                                                fontWeight: "900",
                                            }}
                                        >
                                            나의 독후감
                                        </Text>
                                        <Text
                                            style={{
                                                color: COLORS.muted,
                                                fontSize: 12,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {review.createdAt
                                                ? new Date(review.createdAt).toLocaleDateString()
                                                : ""}
                                        </Text>
                                    </View>

                                    <Text
                                        style={{
                                            color: COLORS.primary,
                                            fontSize: 13,
                                            lineHeight: 20,
                                        }}
                                        numberOfLines={4}
                                    >
                                        {review.content}
                                    </Text>
                                </Pressable>
                            );
                        })
                    )}
                </View>

                <AppButton
                    title={
                        isLoadingTopics
                            ? "발제문 불러오는 중..."
                            : isCreatingRoom
                                ? "채팅방 만드는 중..."
                                : "발제문 선택하고 AI 채팅 시작"
                    }
                    onPress={openTopicModal}
                    disabled={!selectedReview || isLoadingTopics || isCreatingRoom}
                />
            </ScrollView>

            <Modal
                visible={topicModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTopicModalVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.35)",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 16,
                            padding: 16,
                            gap: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.primary,
                                fontSize: 16,
                                fontWeight: "900",
                                textAlign: "center",
                            }}
                        >
                            AI가 추천한 발제문
                        </Text>

                        {topics.map((topic, index) => (
                            <Pressable
                                key={`${topic.id}-${index}`}
                                onPress={() => handleSelectTopic(topic)}
                                style={{
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    backgroundColor: COLORS.secondary,
                                    padding: 14,
                                    gap: 6,
                                }}
                            >
                                <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                                    {topic.title}
                                </Text>

                                <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                                    {topic.description}
                                </Text>
                            </Pressable>
                        ))}

                        <Pressable
                            onPress={() => setTopicModalVisible(false)}
                            style={{ alignItems: "center", paddingTop: 6 }}
                        >
                            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>닫기</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}