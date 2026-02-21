import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import AppButton from "@/components/ui/AppButton";
import { useChatStore } from "@/src/chat/store";

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

export default function GroupLobbyScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const { groupRooms, setGroupJoinedPeople, updateGroupRoomStatus } = useChatStore();

    const room = useMemo(() => groupRooms.find((r) => r.id === roomId), [groupRooms, roomId]);
    const [ready, setReady] = useState(false);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    if (!room) return null;

    const diffMs = new Date(room.startAt).getTime() - now;
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;

    const canEnter = (ready && room.joinedPeople >= room.maxPeople) || (ready && diffMs <= 0);

    const enterRoom = () => {
        // 시작 조건 충족 시: 진행중으로 바꾸고 그룹 채팅방으로
        updateGroupRoomStatus(room.id, "IN_PROGRESS");
        router.replace({ pathname: "/(tabs)/chat/group-room", params: { roomId: room.id } });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ padding: 16, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                    </Pressable>
                    <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "900" }}>대기방</Text>
                    <View style={{ width: 22 }} />
                </View>

                <View style={{ alignItems: "center", marginTop: 24, gap: 10 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 18 }}>{room.bookTitle}</Text>

                    <Text style={{ color: COLORS.stepGreen, fontWeight: "900" }}>채팅방 오픈까지 남은 시간</Text>
                    <Text style={{ color: COLORS.stepGreen, fontWeight: "900", fontSize: 48 }}>
                        {pad2(mm)}:{pad2(ss)}
                    </Text>

                    <Text style={{ color: COLORS.primaryDark }}>
                        참여 인원 {room.joinedPeople} / {room.maxPeople}
                    </Text>
                </View>

                {/* ✅ 더미로 인원 늘리기 버튼(나중에 백엔드 이벤트로 대체) */}
                <View style={{ marginTop: 18, gap: 10 }}>
                    <AppButton
                        title="(더미) 참가자 +1"
                        variant="secondary"
                        onPress={() => setGroupJoinedPeople(room.id, Math.min(room.maxPeople, room.joinedPeople + 1))}
                    />
                </View>

                <View style={{ marginTop: "auto", gap: 10 }}>
                    <AppButton
                        title={ready ? "READY 해제" : "READY"}
                        onPress={() => setReady((p) => !p)}
                        variant={ready ? "secondary" : "primary"}
                    />
                    <AppButton title="입장하기" onPress={enterRoom} disabled={!canEnter} />
                </View>
            </View>
        </SafeAreaView>
    );
}
