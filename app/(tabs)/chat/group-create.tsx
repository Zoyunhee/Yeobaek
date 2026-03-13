import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
    StyleSheet,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { createDiscussionRoom } from "@/services/api";

export default function GroupCreateScreen() {
    const router = useRouter();

    const [bookTitle, setBookTitle] = useState("");
    const [bookAuthor, setBookAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("4");
    const [discussionStartTime, setDiscussionStartTime] = useState("");

    const [rule1, setRule1] = useState("");
    const [rule2, setRule2] = useState("");
    const [rule3, setRule3] = useState("");
    const [rule4, setRule4] = useState("");

    const [loading, setLoading] = useState(false);

    async function getCurrentUser() {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return null;
        return JSON.parse(userStr);
    }

    async function handleCreate() {
        try {
            const user = await getCurrentUser();
            if (!user) {
                Alert.alert("오류", "로그인 정보가 없습니다.");
                return;
            }

            const rules = [rule1, rule2, rule3, rule4]
                .map((v) => v.trim())
                .filter(Boolean);

            const max = Math.max(2, Math.min(4, Number(maxParticipants) || 4));

            setLoading(true);

            const res = await createDiscussionRoom({
                bookTitle,
                bookAuthor,
                description,
                maxParticipants: max,
                discussionStartTime,
                hostId: user.id,
                discussionRules: rules,
            });

            if (res.success) {
                router.replace({
                    pathname: "/(tabs)/chat/group-detail",
                    params: { roomId: String(res.data.id) },
                });
            }
        } catch (e: any) {
            Alert.alert("오류", e.message || "방 생성 실패");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>그룹 채팅방 만들기</Text>

            <TextInput
                style={styles.input}
                placeholder="책 제목"
                value={bookTitle}
                onChangeText={setBookTitle}
            />

            <TextInput
                style={styles.input}
                placeholder="저자"
                value={bookAuthor}
                onChangeText={setBookAuthor}
            />

            <TextInput
                style={styles.input}
                placeholder="방 설명"
                value={description}
                onChangeText={setDescription}
            />

            <TextInput
                style={styles.input}
                placeholder="시작시간 (2025-03-13T20:00:00)"
                value={discussionStartTime}
                onChangeText={setDiscussionStartTime}
            />

            <TextInput style={styles.input} placeholder="규칙1" value={rule1} onChangeText={setRule1} />
            <TextInput style={styles.input} placeholder="규칙2" value={rule2} onChangeText={setRule2} />
            <TextInput style={styles.input} placeholder="규칙3" value={rule3} onChangeText={setRule3} />
            <TextInput style={styles.input} placeholder="규칙4" value={rule4} onChangeText={setRule4} />

            <Pressable style={styles.button} onPress={handleCreate}>
                <Text style={styles.buttonText}>
                    {loading ? "생성 중..." : "방 만들기"}
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    button: {
        backgroundColor: "#222",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "700" },
});