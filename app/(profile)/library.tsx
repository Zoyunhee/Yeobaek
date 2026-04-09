import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    Image,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { IconSymbolName } from "@/components/ui/icon-symbol";
import {
    getWishlist,
    getReadCompletions,
    getBookReviews,
} from "@/services/api";

type TabKey = "liked" | "completed" | "reviews";

const BOOK_COVER = require("../../assets/images/book-cover.png");

type LikedBook = {
    id: number;
    bookTitle: string;
    author?: string;
    coverImage?: string;
};

type CompletedItem = {
    id: number;
    bookTitle: string;
    bookAuthor?: string;
    bookCover?: string;
    completionType: "AI_CHAT" | "GROUP_CHAT";
    completedAt?: string;
};

type ReviewItem = {
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

export default function LibraryScreen() {
    const router = useRouter();
    const [tab, setTab] = useState<TabKey>("liked");
    const [loading, setLoading] = useState(true);

    const [liked, setLiked] = useState<LikedBook[]>([]);
    const [completed, setCompleted] = useState<CompletedItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);

            const rawUser = await AsyncStorage.getItem("user");
            if (!rawUser) throw new Error("로그인 정보가 없습니다.");

            const user = JSON.parse(rawUser);
            const userId = Number(user.id);

            const [wishlistRes, completionRes, reviewRes] = await Promise.all([
                getWishlist(userId),
                getReadCompletions(userId),
                getBookReviews(userId),
            ]);

            setLiked(wishlistRes.data ?? []);
            setCompleted(completionRes.data ?? []);
            setReviews(reviewRes.data ?? []);
        } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const data = useMemo(() => {
        if (tab === "liked") return liked;
        if (tab === "completed") return completed;
        return reviews;
    }, [tab, liked, completed, reviews]);

    return (
        <>
            <Stack.Screen
                options={{
                    title: "나의 서재",
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 6 }}>
                            <IconSymbol name="chevron.left" size={18} color={COLORS.primary} />
                        </Pressable>
                    ),
                }}
            />

            <View style={styles.screen}>
                <View style={styles.topTabs}>
                    <TabButton
                        active={tab === "liked"}
                        iconName={tab === "liked" ? "heart.fill" : "heart"}
                        label="찜"
                        onPress={() => setTab("liked")}
                    />
                    <TabButton
                        active={tab === "completed"}
                        iconName={tab === "completed" ? "bubble.left.fill" : "bubble.left"}
                        label="완료 채팅"
                        onPress={() => setTab("completed")}
                    />
                    <TabButton
                        active={tab === "reviews"}
                        iconName={tab === "reviews" ? "book.fill" : "book"}
                        label="독후감"
                        onPress={() => setTab("reviews")}
                    />
                </View>

                <View style={styles.divider} />

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator />
                    </View>
                ) : (
                    <FlatList
                        data={data as any[]}
                        keyExtractor={(item: any) => String(item.id)}
                        renderItem={({ item }: any) => {
                            if (tab === "liked") return <LikedRow item={item as LikedBook} />;
                            if (tab === "completed") return <CompletedRow item={item as CompletedItem} />;
                            return (
                                <ReviewRow
                                    item={item as ReviewItem}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(profile)/review-detail",
                                            params: { reviewId: String(item.id) },
                                        })
                                    }
                                />
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={styles.sep} />}
                        contentContainerStyle={{ paddingBottom: tab === "reviews" ? 110 : 30 }}
                        ListEmptyComponent={
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>데이터가 없습니다.</Text>
                            </View>
                        }
                    />
                )}

                {tab === "reviews" && (
                    <Pressable
                        onPress={() => router.push("/(profile)/note-create")}
                        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
                    >
                        <Text style={styles.fabPlus}>+</Text>
                    </Pressable>
                )}
            </View>
        </>
    );
}

function TabButton({
                       active,
                       iconName,
                       label,
                       onPress,
                   }: {
    active: boolean;
    iconName: IconSymbolName;
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
            <IconSymbol name={iconName} size={18} color={COLORS.primary} />
            <Text style={styles.tabLabel}>{label}</Text>
        </Pressable>
    );
}

function LikedRow({ item }: { item: LikedBook }) {
    return (
        <View style={styles.row}>
            <Image
                source={item.coverImage ? { uri: item.coverImage } : BOOK_COVER}
                style={styles.thumb}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.bookTitle}</Text>
                <Text style={styles.sub}>{item.author ?? "저자 정보 없음"}</Text>
            </View>
        </View>
    );
}

function CompletedRow({ item }: { item: CompletedItem }) {
    return (
        <View style={styles.row}>
            <Image
                source={item.bookCover ? { uri: item.bookCover } : BOOK_COVER}
                style={styles.thumb}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.bookTitle}</Text>
                <Text style={styles.sub}>{item.bookAuthor ?? "저자 정보 없음"}</Text>
                <Text style={styles.metaText}>
                    {item.completionType === "AI_CHAT" ? "AI 채팅 완독" : "그룹 채팅 완독"}
                </Text>
            </View>
        </View>
    );
}

function ReviewRow({
                       item,
                       onPress,
                   }: {
    item: ReviewItem;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
            <Image
                source={item.coverImage ? { uri: item.coverImage } : BOOK_COVER}
                style={styles.thumb}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.bookTitle}</Text>
                <Text style={styles.sub}>{item.author ?? "저자 정보 없음"}</Text>
                <Text style={styles.preview} numberOfLines={2}>
                    {item.content ?? ""}
                </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={COLORS.neutralDark} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },

    topTabs: { flexDirection: "row", backgroundColor: COLORS.bg },

    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },

    tabBtnActive: { backgroundColor: "#fff" },

    tabLabel: { fontSize: 12, fontWeight: "900", color: COLORS.primary },

    divider: { height: 1, backgroundColor: COLORS.border },

    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    row: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.bg,
        alignItems: "center",
    },

    thumb: {
        width: 46,
        height: 62,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },

    title: { fontSize: 14, fontWeight: "900", color: COLORS.primary },

    sub: { marginTop: 6, fontSize: 12, fontWeight: "800", color: COLORS.neutralDark },

    preview: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "700",
        color: COLORS.primary,
    },

    metaText: { marginTop: 8, fontSize: 11, fontWeight: "800", color: COLORS.primary },

    sep: { height: 1, backgroundColor: COLORS.border, marginLeft: 16 },

    emptyWrap: {
        padding: 24,
        alignItems: "center",
    },

    emptyText: {
        color: COLORS.neutralDark,
        fontWeight: "800",
    },

    fab: {
        position: "absolute",
        right: 22,
        bottom: Platform.OS === "ios" ? 26 : 22,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    fabPlus: {
        fontSize: 28,
        fontWeight: "900",
        color: COLORS.bg,
        marginTop: -2,
    },
});