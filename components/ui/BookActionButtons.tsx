import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

export default function BookActionButtons() {
    const [liked, setLiked] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const toggleLike = () => {
        setLiked((prev) => !prev);
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
    };

    return (
        <View style={styles.row}>
            <Pressable style={styles.btn} onPress={toggleLike}>
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={16}
                        color={COLORS.white}
                    />
                </Animated.View>
                <Text style={styles.text}>찜하기</Text>
            </Pressable>

            <Pressable style={styles.btn}>
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