import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import ChatListItem from "@/components/ui/ChatListItem";
import { getDiscussionRooms, type DiscussionRoom } from "@/services/api";

type GroupRoomView = {
    id: string;
    bookTitle: string;
    topic: string;
    author: string;
    coverUrl?: string;
    joinedPeople: number;
    maxPeople: number;
    startAt: string;
    status: "WAITING" | "IN_PROGRESS" | "FINISHED";
};

function mapRoom(r: DiscussionRoom): GroupRoomView {
    return {
        id: String(r.id),
        bookTitle: r.bookTitle,
        topic: r.description ?? "",
        author: r.bookAuthor,
        coverUrl: r.bookCover,
        joinedPeople: r.currentParticipants,
        maxPeople: r.maxParticipants,
        startAt: r.discussionStartTime,
        status: r.status,
    };
}

export default function GroupSearchScreen() {
    const router = useRouter();
    const [groupRooms, setGroupRooms] = useState<GroupRoomView[]>([]);
    const [q, setQ] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadRooms() {
            try {
                const res = await getDiscussionRooms();
                if (!mounted || !res.success) return;
                setGroupRooms((res.data ?? []).map(mapRoom));
            } catch (error) {
                console.error("그룹 검색 목록 조회 실패:", error);
            }
        }

        loadRooms();

        return () => {
            mounted = false;
        };
    }, []);

    const results = useMemo(() => {
        const base = groupRooms.filter((r) => r.status !== "FINISHED");
        const query = q.trim();
        if (!query) return base;

        return base.filter(
            (r) =>
                r.bookTitle.includes(query) ||
                r.topic.includes(query) ||
                r.author.includes(query)
        );
    }, [q, groupRooms]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <SearchBar value={q} onChangeText={setQ} placeholder="대화하고 싶은 방/책 찾기" />
                    </View>
                </View>

                <View style={{ marginTop: 14 }}>
                    {results.map((r) => (
                        <ChatListItem
                            key={r.id}
                            title={r.bookTitle}
                            subtitle={r.topic}
                            coverUrl={r.coverUrl}
                            metaLeft={`${r.joinedPeople} / ${r.maxPeople} 명`}
                            metaRight={new Date(r.startAt).toLocaleString()}
                            badge={r.status === "IN_PROGRESS" ? "진행중" : "모집중"}
                            onPress={() =>
                                router.push({
                                    pathname: "/(tabs)/chat/group-detail",
                                    params: { roomId: r.id },
                                } as any)
                            }
                        />
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}