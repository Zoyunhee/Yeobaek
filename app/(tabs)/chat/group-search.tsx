import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import ChatListItem from "@/components/ui/ChatListItem";
import { useChatStore } from "@/src/chat/store";

export default function GroupSearchScreen() {
    const router = useRouter();
    const { groupRooms } = useChatStore();
    const [q, setQ] = useState("");

    const results = useMemo(() => {
        const base = groupRooms.filter((r) => r.status !== "ENDED");
        const query = q.trim();
        if (!query) return base;
        return base.filter((r) => r.bookTitle.includes(query) || r.topic.includes(query) || r.author.includes(query));
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
                            onPress={() => router.push({ pathname: "/(tabs)/chat/group-detail", params: { roomId: r.id } } as any)}
                        />
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}
