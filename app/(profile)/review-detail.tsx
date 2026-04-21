import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getBookReviewDetail } from "@/services/api";

const BOOK_COVER = require("../../assets/images/book-cover.png");

type ReviewDetail = {
    id: number;
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    author?: string;
    coverImage?: string;
    publisher?: string;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
};

function formatDateText(value?: string) {
    if (!value) return "날짜 정보 없음";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

export default function ReviewDetailScreen() {
    const router = useRouter();
    const { reviewId } = useLocalSearchParams<{ reviewId: string }>();

    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState<ReviewDetail | null>(null);

    useEffect(() => {
        const loadDetail = async () => {
            try {
                if (!reviewId) throw new Error("독후감 ID가 없습니다.");

                setLoading(true);
                const res = await getBookReviewDetail(Number(reviewId));
                setReview(res.data ?? null);
            } catch (e) {
                Alert.alert("오류", e instanceof Error ? e.message : "독후감을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadDetail();
    }, [reviewId]);

    const createdDateText = useMemo(() => formatDateText(review?.createdAt), [review?.createdAt]);

    return (
        <>
            <Stack.Screen
                options={{
                    title: "독후감 보기",
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: COLORS.bg },
                    headerTitleStyle: { color: COLORS.primary, fontWeight: "900" },
                    headerLeft: () => (
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={12}
                            style={styles.headerBtn}
                        >
                            <IconSymbol name="chevron.left" size={18} color={COLORS.primary} />
                        </Pressable>
                    ),
                }}
            />

            <View style={styles.screen}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator color={COLORS.primary} />
                    </View>
                ) : !review ? (
                    <View style={styles.centerBox}>
                        <Text style={styles.emptyText}>독후감을 불러오지 못했습니다.</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.bookBlock}>
                            <Image
                                source={review.coverImage ? { uri: review.coverImage } : BOOK_COVER}
                                style={styles.cover}
                            />
                            <Text style={styles.title}>{review.bookTitle}</Text>
                            <Text style={styles.author}>{review.author ?? "저자 정보 없음"}</Text>
                            <Text style={styles.dateText}>작성일 {createdDateText}</Text>
                        </View>

                        <View style={styles.reviewCard}>
                            <Text style={styles.reviewTitle}>나의 독후감</Text>
                            <Text style={styles.reviewContent}>
                                {review.content?.trim() || "작성된 독후감이 없습니다."}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/ai-create",
                                    params: {
                                        prefillBookTitle: review.bookTitle,
                                        prefillReviewId: String(review.id),
                                    },
                                })
                            }
                            style={({ pressed }) => [
                                styles.ctaButton,
                                pressed && { opacity: 0.92 },
                            ]}
                        >
                            <Text style={styles.ctaText}>이 독후감으로 AI 채팅 시작하기</Text>
                        </Pressable>
                    </ScrollView>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    headerBtn: {
        paddingHorizontal: 6,
    },

    centerBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

    container: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 28,
        gap: 16,
    },

    bookBlock: {
        alignItems: "center",
        marginBottom: 4,
    },

    cover: {
        width: 120,
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },

    title: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
    },

    author: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

    dateText: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.neutralDark,
    },

    reviewCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        padding: 16,
    },

    reviewTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: 12,
    },

    reviewContent: {
        fontSize: 13,
        lineHeight: 24,
        fontWeight: "700",
        color: COLORS.primary,
    },

    ctaButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },

    ctaText: {
        color: COLORS.bg,
        fontSize: 15,
        fontWeight: "900",
    },
});