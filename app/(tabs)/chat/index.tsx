import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getDiscussionRooms, DiscussionRoom } from "@/services/api";

export default function ChatIndexScreen() {
    const router = useRouter();

    const [rooms, setRooms] = useState<DiscussionRoom[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRooms = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getDiscussionRooms();

            if (res.success) {
                setRooms((res.data ?? []).filter((room) => room.status !== "FINISHED"));
            } else {
                setRooms([]);
            }
        } catch (error) {
            console.error("그룹채팅 목록 조회 실패:", error);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRooms();
        }, [loadRooms])
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>그룹 채팅</Text>

                <Pressable
                    style={styles.createButton}
                    onPress={() => router.push("/(tabs)/chat/group-create")}
                >
                    <Text style={styles.createButtonText}>방 만들기</Text>
                </Pressable>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={rooms}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>아직 생성된 그룹방이 없어요.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.card}
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/group-detail",
                                    params: { roomId: String(item.id) },
                                })
                            }
                        >
                            <Text style={styles.bookTitle}>{item.bookTitle}</Text>
                            <Text style={styles.author}>{item.bookAuthor}</Text>

                            <Text style={styles.desc}>
                                {item.description || "설명이 없습니다."}
                            </Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>
                                    인원 {item.currentParticipants}/{item.maxParticipants}
                                </Text>
                                <Text style={styles.metaText}>
                                    상태 {item.status}
                                </Text>
                            </View>

                            <Text style={styles.timeText}>
                                시작 시간: {new Date(item.discussionStartTime).toLocaleString()}
                            </Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    createButton: {
        backgroundColor: "#222",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    createButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    card: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        backgroundColor: "#fafafa",
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    author: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    desc: {
        fontSize: 14,
        color: "#333",
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    metaText: {
        fontSize: 13,
        color: "#555",
    },
    timeText: {
        fontSize: 12,
        color: "#888",
    },
    emptyBox: {
        paddingVertical: 60,
        alignItems: "center",
    },
    emptyText: {
        color: "#777",
        fontSize: 14,
    },
});