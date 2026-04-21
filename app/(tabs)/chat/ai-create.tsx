import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import AppButton from "@/components/ui/AppButton";
import { type BookSearchItem, searchBooks } from "@/services/api";

type ReviewItem = {
    id: number;
    bookTitle: string;
    author?: string;
    createdAt: string;
    content: string;
};

type TopicItem = {
    id: string;
    label: string;
    description: string;
    firstQuestion: string;
};

const MOCK_REVIEWS: ReviewItem[] = [
    {
        id: 101,
        bookTitle: "어린왕자",
        author: "생텍쥐페리",
        createdAt: "2025.06.14",
        content:
            "겉으로 단순한 이야기처럼 보였지만 관계와 책임, 그리고 어른이 된다는 것에 대해 다시 생각하게 됐다. 나는 특히 여우와의 관계가 가장 오래 남았다.",
    },
    {
        id: 102,
        bookTitle: "코스모스",
        author: "칼 세이건",
        createdAt: "2025.06.21",
        content:
            "우주를 설명하는 방식이 단순한 과학 지식 전달이 아니라 인간의 시야를 넓혀주는 느낌이었다. 감탄도 컸지만 생각보다 논리적인 구조가 인상 깊었다.",
    },
    {
        id: 103,
        bookTitle: "사피엔스",
        author: "유발 하라리",
        createdAt: "2025.06.28",
        content:
            "인류의 역사를 하나의 흐름으로 연결해서 보는 시선이 흥미로웠다. 동의되는 부분도 많았지만 몇몇 주장에는 의문도 들었다.",
    },
    {
        id: 104,
        bookTitle: "데미안",
        author: "헤르만 헤세",
        createdAt: "2025.07.02",
        content:
            "성장 과정에서 흔들리는 자아를 따라가면서 내 경험도 많이 떠올랐다. 다만 상징이 많아서 해석이 쉽지는 않았고 여러 관점이 가능하다고 느꼈다.",
    },
];

function buildMockTopics(review: ReviewItem | null): TopicItem[] {
    const text = review?.content ?? "";

    if (text.includes("논리") || text.includes("구조") || text.includes("의문")) {
        return [
            {
                id: "analysis",
                label: "분석",
                description: "책의 주장과 구조를 중심으로 생각해보는 주제",
                firstQuestion:
                    "이 책이 전달하는 핵심 주장 중 가장 설득력 있었던 부분은 무엇이었나요?",
            },
            {
                id: "critic",
                label: "비평",
                description: "동의와 반박의 지점을 살펴보는 주제",
                firstQuestion:
                    "이 책에서 공감은 갔지만 완전히 동의되지는 않았던 부분이 있었나요?",
            },
            {
                id: "creative",
                label: "창의",
                description: "새로운 관점으로 확장해보는 주제",
                firstQuestion:
                    "이 책의 내용을 지금의 현실 문제와 연결한다면 어떤 장면이 가장 먼저 떠오르나요?",
            },
        ];
    }

    if (text.includes("관계") || text.includes("감정") || text.includes("경험")) {
        return [
            {
                id: "emotion",
                label: "감정",
                description: "읽는 동안 생긴 감정의 흐름을 살펴보는 주제",
                firstQuestion:
                    "이 책을 읽으며 가장 강하게 남은 감정은 무엇이었고, 왜 그렇게 느꼈나요?",
            },
            {
                id: "empathy",
                label: "공감",
                description: "인물과 상황에 대한 공감에 집중하는 주제",
                firstQuestion:
                    "가장 공감됐던 인물이나 장면은 무엇이었나요? 그리고 그 이유는 무엇인가요?",
            },
            {
                id: "critic",
                label: "비평",
                description: "공감과 거리감을 함께 살펴보는 주제",
                firstQuestion:
                    "공감은 갔지만 조금 다르게 보고 싶었던 장면이나 선택도 있었나요?",
            },
        ];
    }

    return [
        {
            id: "analysis",
            label: "분석",
            description: "내용의 구조와 논리를 살펴보는 주제",
            firstQuestion:
                "이 책을 한 문장으로 정리한다면 무엇이고, 그렇게 생각한 이유는 무엇인가요?",
        },
        {
            id: "empathy",
            label: "공감",
            description: "감정과 인물 이해를 중심으로 한 주제",
            firstQuestion:
                "읽는 동안 가장 오래 남은 장면은 무엇이었고, 그 장면이 왜 기억에 남았나요?",
        },
        {
            id: "creative",
            label: "창의",
            description: "책을 나만의 방식으로 확장하는 주제",
            firstQuestion:
                "이 책 뒤에 이어질 다음 장면을 상상한다면 어떤 이야기가 펼쳐질 것 같나요?",
        },
    ];
}

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
    const [selectedReviewId, setSelectedReviewId] = useState<number | null>(
        prefillReviewId ? Number(prefillReviewId) : null
    );

    const [topicModalVisible, setTopicModalVisible] = useState(false);
    const [topics, setTopics] = useState<TopicItem[]>([]);
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

    const displayList = query.trim() ? searchResults : [];

    const filteredReviews = useMemo(() => {
        const baseTitle = selectedBook?.title ?? prefillBookTitle;
        if (!baseTitle) return [];
        return MOCK_REVIEWS.filter((review) => review.bookTitle === baseTitle);
    }, [selectedBook, prefillBookTitle]);

    const selectedReview =
        filteredReviews.find((review) => review.id === selectedReviewId) ?? null;

    useEffect(() => {
        if (!prefillReviewId) return;
        const found = filteredReviews.find((item) => item.id === Number(prefillReviewId));
        if (found) {
            setSelectedReviewId(found.id);
        }
    }, [filteredReviews, prefillReviewId]);

    const openTopicModal = useCallback(() => {
        if (!selectedBook && !prefillBookTitle) {
            Alert.alert("도서를 선택해주세요");
            return;
        }

        if (!selectedReview) {
            Alert.alert("독후감을 선택해주세요");
            return;
        }

        setIsCreating(true);

        const nextTopics = buildMockTopics(selectedReview);
        setTopics(nextTopics);

        setTimeout(() => {
            setTopicModalVisible(true);
            setIsCreating(false);
        }, 250);
    }, [selectedBook, prefillBookTitle, selectedReview]);

    const handleSelectTopic = useCallback(
        (topic: TopicItem) => {
            setTopicModalVisible(false);

            const mockRoomId = Date.now();

            router.replace({
                pathname: "/(tabs)/chat/ai-room",
                params: {
                    roomId: String(mockRoomId),
                    bookTitle: selectedBook?.title ?? prefillBookTitle ?? "AI 채팅",
                    reviewId: String(selectedReview?.id ?? ""),
                    reviewContent: selectedReview?.content ?? "",
                    topicId: topic.id,
                    topicLabel: topic.label,
                    topicDescription: topic.description,
                    topicQuestion: topic.firstQuestion,
                },
            } as never);
        },
        [router, selectedBook, prefillBookTitle, selectedReview]
    );

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
                                                setQuery("");
                                            }}
                                            style={{
                                                paddingVertical: 10,
                                                paddingHorizontal: 10,
                                                borderRadius: 10,
                                                backgroundColor: active
                                                    ? COLORS.mintLight
                                                    : COLORS.bg,
                                                borderWidth: 1,
                                                borderColor: active
                                                    ? COLORS.mint
                                                    : COLORS.border,
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
                    ) : filteredReviews.length === 0 ? (
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
                            <Text
                                style={{
                                    color: COLORS.muted,
                                    textAlign: "center",
                                    marginTop: 4,
                                    fontSize: 12,
                                }}
                            >
                                현재는 더미 데이터 기반으로 연결되어 있습니다
                            </Text>
                        </View>
                    ) : (
                        filteredReviews.map((review) => {
                            const active = selectedReviewId === review.id;

                            return (
                                <Pressable
                                    key={review.id}
                                    onPress={() => setSelectedReviewId(review.id)}
                                    style={{
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: active ? COLORS.mint : COLORS.border,
                                        backgroundColor: active
                                            ? COLORS.mintLight
                                            : COLORS.secondary,
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
                                            {review.createdAt}
                                        </Text>
                                    </View>

                                    <Text
                                        style={{
                                            color: COLORS.primary,
                                            fontSize: 13,
                                            lineHeight: 20,
                                            fontWeight: "700",
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
                    title={isCreating ? "주제 분석 중..." : "AI 채팅 생성"}
                    onPress={openTopicModal}
                    disabled={isCreating || (!selectedBook && !prefillBookTitle) || !selectedReview}
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
                        backgroundColor: "rgba(0,0,0,0.28)",
                        justifyContent: "center",
                        paddingHorizontal: 22,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 22,
                            padding: 18,
                            gap: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.primary,
                                fontSize: 18,
                                fontWeight: "900",
                                textAlign: "center",
                            }}
                        >
                            독후감 기반 추천 주제
                        </Text>

                        <Text
                            style={{
                                color: COLORS.muted,
                                fontSize: 13,
                                lineHeight: 20,
                                textAlign: "center",
                            }}
                        >
                            아래 3가지 주제 중 하나를 선택하면
                            {"\n"}해당 주제가 채팅방 상단에 고정됩니다
                        </Text>

                        <View style={{ gap: 10, marginTop: 6 }}>
                            {topics.map((topic) => (
                                <Pressable
                                    key={topic.id}
                                    onPress={() => handleSelectTopic(topic)}
                                    style={{
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: COLORS.border,
                                        backgroundColor: COLORS.secondary,
                                        padding: 14,
                                        gap: 4,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: COLORS.primary,
                                            fontSize: 15,
                                            fontWeight: "900",
                                        }}
                                    >
                                        {topic.label}
                                    </Text>
                                    <Text
                                        style={{
                                            color: COLORS.muted,
                                            fontSize: 12,
                                            lineHeight: 18,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {topic.description}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Pressable
                            onPress={() => setTopicModalVisible(false)}
                            style={{
                                alignSelf: "center",
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                marginTop: 4,
                            }}
                        >
                            <Text style={{ color: COLORS.muted, fontWeight: "800" }}>닫기</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}