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

    const currentUser = {
        id: 1,
        userId: "test",
        nickname: "테스트",
    };

    async function handleCreate() {
        try {
            if (!bookTitle.trim()) {
                return Alert.alert("알림", "책 제목을 입력해 주세요.");
            }

            if (!bookAuthor.trim()) {
                return Alert.alert("알림", "저자를 입력해 주세요.");
            }

            if (!discussionStartTime.trim()) {
                return Alert.alert(
                    "알림",
                    "시작 시간을 입력해 주세요.\n예: 2025-03-13T20:00:00"
                );
            }

            const rules = [rule1, rule2, rule3, rule4]
                .map((v) => v.trim())
                .filter(Boolean);

            if (rules.length === 0) {
                return Alert.alert("알림", "규칙/분위기는 최소 1개 이상 입력해 주세요.");
            }

            const max = Math.max(2, Math.min(4, Number(maxParticipants) || 4));

            setLoading(true);

            const res = await createDiscussionRoom({
                bookTitle: bookTitle.trim(),
                bookAuthor: bookAuthor.trim(),
                description: description.trim(),
                maxParticipants: max,
                discussionStartTime,
                hostId: currentUser.id,
                discussionRules: rules,
            });

            if (res.success) {
                Alert.alert("완료", "방이 생성되었습니다.");
                router.replace({
                    pathname: "/(tabs)/chat/group-detail",
                    params: { roomId: String(res.data.id) },
                });
            }
        } catch (error: any) {
            console.error("방 생성 실패:", error);
            Alert.alert("오류", error?.message || "방 생성에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>그룹 채팅방 만들기</Text>

            <Text style={styles.label}>책 제목</Text>
            <TextInput
                style={styles.input}
                value={bookTitle}
                onChangeText={setBookTitle}
                placeholder="책 제목"
            />

            <Text style={styles.label}>저자</Text>
            <TextInput
                style={styles.input}
                value={bookAuthor}
                onChangeText={setBookAuthor}
                placeholder="저자명"
            />

            <Text style={styles.label}>방 설명</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="어떤 이야기를 나눌지 적어 주세요"
                multiline
            />

            <Text style={styles.label}>최대 인원 (2~4)</Text>
            <TextInput
                style={styles.input}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
                placeholder="4"
            />

            <Text style={styles.label}>시작 시간</Text>
            <TextInput
                style={styles.input}
                value={discussionStartTime}
                onChangeText={setDiscussionStartTime}
                placeholder="2025-03-13T20:00:00"
            />

            <Text style={styles.label}>규칙/분위기 1</Text>
            <TextInput
                style={styles.input}
                value={rule1}
                onChangeText={setRule1}
                placeholder="예: 존중하며 말하기"
            />

            <Text style={styles.label}>규칙/분위기 2</Text>
            <TextInput
                style={styles.input}
                value={rule2}
                onChangeText={setRule2}
                placeholder="예: 스포일러 주의"
            />

            <Text style={styles.label}>규칙/분위기 3</Text>
            <TextInput
                style={styles.input}
                value={rule3}
                onChangeText={setRule3}
                placeholder="선택"
            />

            <Text style={styles.label}>규칙/분위기 4</Text>
            <TextInput
                style={styles.input}
                value={rule4}
                onChangeText={setRule4}
                placeholder="선택"
            />

            <Pressable
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "생성 중..." : "방 만들기"}
                </Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fafafa",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    button: {
        marginTop: 24,
        backgroundColor: "#222",
        borderRadius: 12,
        alignItems: "center",
        paddingVertical: 14,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});