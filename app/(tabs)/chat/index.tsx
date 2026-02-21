// app/(tabs)/chat/index.tsx
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import ChatListItem from "@/components/ui/ChatListItem";
import { useChatStore } from "@/src/chat/store";
import type { AiRoom, GroupRoom } from "@/src/chat/types";

type ChatMode = "AI" | "GROUP";

const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
};

export default function ChatMainScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<ChatMode>("AI");
    const { aiRooms, groupRooms } = useChatStore();

    const visibleGroupRooms = useMemo(
        () => groupRooms.filter((r) => r.status !== "ENDED"),
        [groupRooms]
    );

    const data: (AiRoom | GroupRoom)[] = mode === "AI" ? aiRooms : visibleGroupRooms;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: "900" }}>여백 餘白</Text>

                    {mode === "AI" ? (
                        <Pressable onPress={() => router.push("/(tabs)/chat/ai-create")}>
                            <Ionicons name="add" size={22} color={COLORS.primary} />
                        </Pressable>
                    ) : (
                        <View style={{ flexDirection: "row", gap: 14 }}>
                            <Pressable onPress={() => router.push("/(tabs)/chat/group-search")}>
                                <Ionicons name="search" size={20} color={COLORS.primary} />
                            </Pressable>
                            <Pressable onPress={() => router.push("/(tabs)/chat/group-create")}>
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
                    onChange={setMode}
                />
            </View>

            <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18 }}
                data={data}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => {
                    if (mode === "AI") {
                        const r = item as AiRoom;
                        /*return (
                            <ChatListItem
                                title={r.bookTitle}
                                subtitle={r.lastMessage?.trim() ? r.lastMessage : "대화를 시작해보세요"}
                                coverUrl={r.coverUrl}
                                rightTopText={formatTime(r.lastAt)}
                                // ✅ 진행중을 마지막대화 밑으로
                                meta={r.status === "IN_PROGRESS" ? [{ text: "진행중" }] : []}
                                onPress={() =>
                                    router.push({ pathname: "/(tabs)/chat/ai-room", params: { roomId: r.id } } as any)
                                }
                            />
                        );*/
                        // AI 모드일 때
                        return (
                            <ChatListItem
                                title={r.bookTitle}
                                subtitle={r.lastMessage?.trim() ? r.lastMessage : "대화를 시작해보세요"}
                                coverUrl={r.coverUrl}
                                rightTopText={formatTime(r.lastAt)}
                                rightBottomText={r.status === "IN_PROGRESS" ? "진행중" : ""}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/chat/ai-room",
                                        params: { roomId: r.id },
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
                            // ✅ 인원/시간 한 줄로 나란히
                            metaDirection="row"
                            meta={[
                                { icon: "👥", text: `${r.joinedPeople} / ${r.maxPeople} 명` },
                                { icon: "🕒", text: formatDateTime(r.startAt) },
                            ]}
                            onPress={() =>
                                router.push({ pathname: "/(tabs)/chat/group-detail", params: { roomId: r.id } } as any)
                            }
                        />
                    );
                }}
            />
        </SafeAreaView>
    );
}
