import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/constants/colors";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import ChatListItem from "@/components/ui/ChatListItem";
import {
    getDiscussionRooms,
    getAiRooms,
    type DiscussionRoom,
    type AiRoomSummary,
} from "@/services/api";

type ChatMode = "AI" | "GROUP";

type AiRoomView = {
    id: string;
    bookTitle: string;
    coverUrl?: string;
    lastAt?: string;
    lastMessage?: string;
    status: "IN_PROGRESS" | "FINISHED";
};

type GroupRoomView = {
    id: string;
    bookTitle: string;
    topic: string;
    coverUrl?: string;
    joinedPeople: number;
    maxPeople: number;
    startAt: string;
    status: "WAITING" | "IN_PROGRESS" | "FINISHED";
};

type CompletedChatMeta = {
    roomId: number;
    bookTitle: string;
    topicLabel: string;
    topicDescription?: string;
    completedAt: string;
};

const COMPLETED_META_KEY = "mock_completed_ai_chats";

const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`;
};

const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
};

function mapAiRoom(r: AiRoomSummary): AiRoomView {
    return {
        id: String(r.roomId),
        bookTitle: r.title,
        coverUrl: r.coverUrl,
        lastAt: r.lastMessageAt,
        lastMessage: "",
        status: r.status,
    };
}

function mapGroupRoom(r: DiscussionRoom): GroupRoomView {
    return {
        id: String(r.id),
        bookTitle: r.bookTitle,
        topic: r.description ?? "",
        coverUrl: r.bookCover,
        joinedPeople: r.currentParticipants,
        maxPeople: r.maxParticipants,
        startAt: r.discussionStartTime,
        status: r.status,
    };
}

export default function ChatMainScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<ChatMode>("AI");

    const [aiRooms, setAiRooms] = useState<AiRoomView[]>([]);
    const [groupRooms, setGroupRooms] = useState<GroupRoomView[]>([]);

    useEffect(() => {
        let mounted = true;

        async function loadAiRooms() {
            try {
                const [res, completedMetaRaw] = await Promise.all([
                    getAiRooms("IN_PROGRESS"),
                    AsyncStorage.getItem(COMPLETED_META_KEY),
                ]);

                if (!mounted || !res.success) return;

                const completedMeta: CompletedChatMeta[] = completedMetaRaw
                    ? JSON.parse(completedMetaRaw)
                    : [];

                const completedRoomIds = new Set(
                    completedMeta.map((item) => String(item.roomId))
                );

                const mapped = (res.data ?? [])
                    .map(mapAiRoom)
                    .filter((room) => !completedRoomIds.has(room.id));

                setAiRooms(mapped);
            } catch (error) {
                console.error("AI 채팅 목록 조회 실패:", error);
            }
        }

        async function loadGroupRooms() {
            try {
                const res = await getDiscussionRooms();
                if (!mounted || !res.success) return;
                setGroupRooms((res.data ?? []).map(mapGroupRoom));
            } catch (error) {
                console.error("그룹 채팅 목록 조회 실패:", error);
            }
        }

        if (mode === "AI") {
            loadAiRooms();
        } else {
            loadGroupRooms();
        }

        return () => {
            mounted = false;
        };
    }, [mode]);

    const visibleGroupRooms = useMemo(
        () => groupRooms.filter((r) => r.status !== "FINISHED"),
        [groupRooms]
    );

    const data: (AiRoomView | GroupRoomView)[] =
        mode === "AI" ? aiRooms : visibleGroupRooms;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                    }}
                >
                    <Text
                        style={{
                            color: COLORS.primary,
                            fontSize: 22,
                            fontWeight: "900",
                        }}
                    >
                        여백 餘白
                    </Text>

                    {mode === "AI" ? (
                        <Pressable
                            onPress={() => router.push("/(tabs)/chat/ai-create")}
                        >
                            <Ionicons name="add" size={22} color={COLORS.primary} />
                        </Pressable>
                    ) : (
                        <View style={{ flexDirection: "row", gap: 14 }}>
                            <Pressable
                                onPress={() =>
                                    router.push("/(tabs)/chat/group-search")
                                }
                            >
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={COLORS.primary}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() =>
                                    router.push("/(tabs)/chat/group-create")
                                }
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
                    onChange={setMode}
                />
            </View>

            <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 10,
                    paddingBottom: 18,
                }}
                data={data}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => {
                    if (mode === "AI") {
                        const r = item as AiRoomView;
                        return (
                            <ChatListItem
                                title={r.bookTitle}
                                subtitle={
                                    r.lastMessage?.trim()
                                        ? r.lastMessage
                                        : "대화를 이어가보세요"
                                }
                                coverUrl={r.coverUrl}
                                rightTopText={formatTime(r.lastAt)}
                                rightBottomText={
                                    r.status === "IN_PROGRESS" ? "진행중" : ""
                                }
                                onPress={() =>
                                    router.push({
                                        pathname: "/(tabs)/chat/ai-room",
                                        params: {
                                            roomId: r.id,
                                            bookTitle: r.bookTitle,
                                        },
                                    } as any)
                                }
                            />
                        );
                    }

                    const r = item as GroupRoomView;
                    return (
                        <ChatListItem
                            title={r.bookTitle}
                            subtitle={r.topic}
                            coverUrl={r.coverUrl}
                            metaDirection="row"
                            meta={[
                                { icon: "👥", text: `${r.joinedPeople} / ${r.maxPeople} 명` },
                                { icon: "🕒", text: formatDateTime(r.startAt) },
                            ]}
                            badge={r.status === "IN_PROGRESS" ? "진행중" : "모집중"}
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/group-detail",
                                    params: { roomId: r.id },
                                } as any)
                            }
                        />
                    );
                }}
                ListEmptyComponent={
                    <View style={{ paddingTop: 40, alignItems: "center" }}>
                        <Text style={{ color: "#888" }}>
                            {mode === "AI"
                                ? "진행 중인 AI 채팅이 없습니다."
                                : "참여 가능한 그룹 채팅이 없습니다."}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}