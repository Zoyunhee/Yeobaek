// app/(tabs)/chat/index.tsx
// 변경 사항:
//   - AI 채팅방 목록: 로컬 store 대신 getAiRooms() API 호출
//   - 화면 포커스될 때마다 목록 새로고침 (useFocusEffect)
//   - 그룹 채팅방은 기존 store 유지 (그룹 API는 별도)

import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import ChatListItem from "@/components/ui/ChatListItem";
import { useChatStore } from "@/src/chat/store";
import type { GroupRoom } from "@/src/chat/types";
import { type AiRoomSummary, getAiRooms } from "@/services/api";

type ChatMode = "AI" | "GROUP";

const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`;
};

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
};

export default function ChatMainScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<ChatMode>("AI");

    // ── AI 채팅방 목록 (서버) ──
    const [aiRooms, setAiRooms] = useState<AiRoomSummary[]>([]);
    const [isLoadingAi, setIsLoadingAi] = useState(false);

    // ── 그룹 채팅방 (기존 store 유지) ──
    const { groupRooms } = useChatStore();
    const visibleGroupRooms = groupRooms.filter((r) => r.status !== "ENDED");

    // 화면 포커스될 때마다 AI 목록 새로고침
    useFocusEffect(
        useCallback(() => {
            if (mode !== "AI") return;

            let cancelled = false;

            (async () => {
                setIsLoadingAi(true);
                try {
                    const res = await getAiRooms();
                    if (!cancelled) {
                        setAiRooms(res.data ?? []);
                    }
                } catch (e) {
                    console.error("AI 채팅방 목록 로드 실패:", e);
                    if (!cancelled) {
                        setAiRooms([]);
                    }
                } finally {
                    if (!cancelled) {
                        setIsLoadingAi(false);
                    }
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [mode])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                {/* 헤더 */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                    }}
                >
                    <Text
                        style={{ color: COLORS.primary, fontSize: 22, fontWeight: "900" }}
                    >
                        여백 餘白
                    </Text>

                    {mode === "AI" ? (
                        <Pressable onPress={() => router.push("/(tabs)/chat/ai-create")}>
                            <Ionicons name="add" size={22} color={COLORS.primary} />
                        </Pressable>
                    ) : (
                        <View style={{ flexDirection: "row", gap: 14 }}>
                            <Pressable
                                onPress={() => router.push("/(tabs)/chat/group-search")}
                            >
                                <Ionicons name="search" size={20} color={COLORS.primary} />
                            </Pressable>
                            <Pressable
                                onPress={() => router.push("/(tabs)/chat/group-create")}
                            >
                                <Ionicons name="add" size={22} color={COLORS.primary} />
                            </Pressable>
                        </View>
                    )}
                </View>

                <SegmentedToggle
                    leftLabel="AI 채팅"
                    rightLabel="그룹 채팅"
                    value={mode}
                    leftValue="AI"
                    rightValue="GROUP"
                    onChange={(v) => setMode(v as ChatMode)}
                />
            </View>

            {mode === "AI" && isLoadingAi ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 10,
                        paddingBottom: 18,
                    }}
                    data={mode === "AI" ? aiRooms : (visibleGroupRooms as any[])}
                    keyExtractor={(item) =>
                        mode === "AI"
                            ? String((item as AiRoomSummary).roomId)
                            : String((item as GroupRoom).id)
                    }
                    ListEmptyComponent={
                        <View
                            style={{
                                alignItems: "center",
                                marginTop: 60,
                            }}
                        >
                            <Text style={{ color: COLORS.muted }}>
                                {mode === "AI"
                                    ? "AI 채팅방이 없습니다. + 버튼으로 시작해보세요!"
                                    : "참여 중인 그룹 채팅이 없습니다."}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        if (mode === "AI") {
                            const r = item as AiRoomSummary;

                            return (
                                <ChatListItem
                                    title={r.title}
                                    subtitle={
                                        r.status === "IN_PROGRESS"
                                            ? "대화를 이어가보세요"
                                            : "완료된 대화"
                                    }
                                    coverUrl={r.coverUrl}
                                    rightTopText={formatTime(r.lastMessageAt)}
                                    rightBottomText={
                                        r.status === "IN_PROGRESS" ? "진행중" : "완료"
                                    }
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(tabs)/chat/ai-room",
                                            params: {
                                                roomId: String(r.roomId),
                                                bookTitle: r.title,
                                            },
                                        } as any)
                                    }
                                />
                            );
                        }

                        const r = item as GroupRoom;

                        return (
                            <ChatListItem
                                title={r.bookTitle}
                                subtitle={r.topic}
                                coverUrl={r.coverUrl}
                                metaDirection="row"
                                meta={[
                                    {
                                        icon: "👥",
                                        text: `${r.joinedPeople} / ${r.maxPeople} 명`,
                                    },
                                    {
                                        icon: "🕒",
                                        text: formatDateTime(r.startAt),
                                    },
                                ]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/chat/group-detail",
                                        params: { roomId: r.id },
                                    } as any)
                                }
                            />
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}