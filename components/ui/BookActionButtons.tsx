import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import {
    addWishlist,
    removeWishlistByIsbn,
    checkWishlist,
} from "@/services/api";

type BookForAction = {
    isbn?: string;
    title: string;
    author?: string;
    publisher?: string;
    coverUrl?: string;
};

type Props = {
    book: BookForAction;
};

export default function BookActionButtons({ book }: Props) {
    const router = useRouter();
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

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

    const runHeartAnimation = () => {
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 1.15,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const toggleLike = async () => {
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
            }

            runHeartAnimation();
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
                isbn: book.isbn ?? "",
                title: book.title,
                coverUrl: book.coverUrl ?? "",
                author: book.author ?? "",
                publisher: book.publisher ?? "",
            },
        });
    };

    return (
        <View style={styles.row}>
            <Pressable
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={toggleLike}
                disabled={loading}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={16}
                        color={COLORS.white}
                    />
                </Animated.View>
                <Text style={styles.text}>{liked ? "찜 취소" : "찜하기"}</Text>
            </Pressable>

            <Pressable style={styles.btn} onPress={goAiChat}>
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color={COLORS.white}
                />
                <Text style={styles.text}>AI 채팅 가기</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    btn: {
        flex: 1,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    text: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "800",
    },
});