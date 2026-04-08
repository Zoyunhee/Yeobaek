import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { COLORS } from "@/constants/colors";
import AppButton from "@/components/ui/AppButton";
import { getDiscussionRoom, type DiscussionRoom } from "@/services/api";

type GroupRoomView = {
    id: string;
    bookTitle: string;
    topic: string;
    coverUrl?: string;
    joinedPeople: number;
    maxPeople: number;
    startAt: string;
    durationMin?: number;
    moods: string[];
};

function mapRoom(room: DiscussionRoom): GroupRoomView {
    return {
        id: String(room.id),
        bookTitle: room.bookTitle,
        topic: room.description ?? "",
        coverUrl: room.bookCover,
        joinedPeople: room.currentParticipants,
        maxPeople: room.maxParticipants,
        startAt: room.discussionStartTime,
        durationMin: room.estimatedDurationMinutes,
        moods: room.discussionRules ?? [],
    };
}

export default function GroupDetailScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const [room, setRoom] = useState<GroupRoomView | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadRoom() {
            try {
                const res = await getDiscussionRoom(Number(roomId));
                if (!mounted || !res.success) return;
                setRoom(mapRoom(res.data));
            } catch (error) {
                console.error("그룹 방 상세 조회 실패:", error);
            }
        }

        loadRoom();

        return () => {
            mounted = false;
        };
    }, [roomId]);

    const moods = useMemo(() => room?.moods ?? [], [room]);

    if (!room) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ padding: 16, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Pressable onPress={() => router.back()} hitSlop={10}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>

                    <Text style={{ color: COLORS.primary, fontWeight: "900" }}>입장 전 상세화면</Text>

                    <View style={{ width: 22 }} />
                </View>

                <View style={{ alignItems: "center", marginTop: 20, gap: 10 }}>
                    <View
                        style={{
                            width: 160,
                            height: 220,
                            borderRadius: 16,
                            backgroundColor: COLORS.secondary,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {room.coverUrl ? (
                            <Image source={{ uri: room.coverUrl }} style={{ width: "100%", height: "100%" }} />
                        ) : (
                            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>책</Text>
                        )}
                    </View>

                    <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 16 }}>{room.bookTitle}</Text>
                    <Text style={{ color: COLORS.stepGreen, fontWeight: "900" }}>“{room.topic}”</Text>
                </View>

                <View style={{ marginTop: 18, gap: 12 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 채팅방 정보</Text>
                    <Text style={{ color: COLORS.primaryDark }}>참여 인원: {room.joinedPeople} / {room.maxPeople} 명</Text>
                    <Text style={{ color: COLORS.primaryDark }}>시작 시간: {new Date(room.startAt).toLocaleString()}</Text>
                    <Text style={{ color: COLORS.primaryDark }}>
                        예상 시간: {room.durationMin ?? "-"}{room.durationMin ? " 분" : ""}
                    </Text>

                    <Text style={{ color: COLORS.primary, fontWeight: "900", marginTop: 8 }}>• 대화 분위기/규칙/스타일</Text>
                    {moods.length ? (
                        moods.map((t, i) => (
                            <Text key={`${t}-${i}`} style={{ color: COLORS.primaryDark }}>
                                {t}
                            </Text>
                        ))
                    ) : (
                        <Text style={{ color: COLORS.muted }}>입력된 항목이 없어요</Text>
                    )}
                </View>

                <View style={{ marginTop: "auto" }}>
                    <AppButton
                        title="참여하기"
                        onPress={() =>
                            router.replace({
                                pathname: "/(tabs)/chat/group-lobby",
                                params: { roomId: room.id },
                            } as any)
                        }
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}