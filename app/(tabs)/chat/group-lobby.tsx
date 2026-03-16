import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/constants/colors";
import AppButton from "@/components/ui/AppButton";
import {
    getDiscussionParticipants,
    getDiscussionRoom,
    joinDiscussionRoom,
    toggleDiscussionReady,
    type DiscussionParticipant,
    type DiscussionRoom,
} from "@/services/api";

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

type StoredUser = {
    id: number;
    userId: string;
    name: string;
    nickname: string;
    email: string;
    role: string;
    surveyCompleted: boolean;
};

async function getCurrentUser(): Promise<StoredUser | null> {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
}

export default function GroupLobbyScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();

    const [room, setRoom] = useState<DiscussionRoom | null>(null);
    const [participants, setParticipants] = useState<DiscussionParticipant[]>([]);
    const [ready, setReady] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
    const [joining, setJoining] = useState(false);
    const [readyLoading, setReadyLoading] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                const user = await getCurrentUser();
                if (!user || !mounted) return;

                setCurrentUser(user);
                await joinDiscussionRoom(Number(roomId), user.id);
                await loadRoomAndParticipants(user.id);
            } catch (error: any) {
                if (String(error?.message ?? error).includes("이미 참여 중")) {
                    return;
                }
            }
        }

        init();

        const interval = setInterval(async () => {
            const user = await getCurrentUser();
            if (!user) return;
            await loadRoomAndParticipants(user.id);
        }, 3000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [roomId]);

    async function loadRoomAndParticipants(userId: number) {
        try {
            const [roomRes, participantsRes] = await Promise.all([
                getDiscussionRoom(Number(roomId)),
                getDiscussionParticipants(Number(roomId)),
            ]);

            if (roomRes.success) {
                setRoom(roomRes.data);

                if (roomRes.data.status === "IN_PROGRESS") {
                    setJoining(true);
                    setTimeout(() => {
                        router.replace({
                            pathname: "/(tabs)/chat/group-room",
                            params: { roomId: String(roomRes.data.id) },
                        } as any);
                    }, 700);
                    return;
                }
            }

            if (participantsRes.success) {
                const list = participantsRes.data ?? [];
                setParticipants(list);
                const me = list.find((p) => p.userId === userId);
                setReady(!!me?.isReady);
            }
        } catch (error) {
            console.error("그룹 로비 데이터 조회 실패:", error);
        }
    }

    const diffMs = room ? new Date(room.discussionStartTime).getTime() - now : 0;
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;

    const joinedPeople = room?.currentParticipants ?? 0;
    const maxPeople = room?.maxParticipants ?? 0;
    const canEnter = room?.status === "IN_PROGRESS";

    const enterRoom = () => {
        if (!room) return;
        setJoining(true);
        setTimeout(() => {
            router.replace({
                pathname: "/(tabs)/chat/group-room",
                params: { roomId: String(room.id) },
            } as any);
        }, 500);
    };

    const toggleReadyStatus = async () => {
        if (!currentUser || readyLoading || joining) return;

        try {
            setReadyLoading(true);

            const res = await toggleDiscussionReady(Number(roomId), currentUser.id);

            if (res.success && res.data) {
                setReady(!!res.data.isReady);

                if (res.data.roomStatus === "IN_PROGRESS" || res.data.starting) {
                    setJoining(true);
                    setTimeout(() => {
                        router.replace({
                            pathname: "/(tabs)/chat/group-room",
                            params: { roomId: String(roomId) },
                        } as any);
                    }, 700);
                    return;
                }
            }

            await loadRoomAndParticipants(currentUser.id);
        } catch (error) {
            console.error("READY 토글 실패:", error);
        } finally {
            setReadyLoading(false);
        }
    };

    if (!room) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <View style={{ padding: 16, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Pressable onPress={() => router.back()} disabled={joining}>
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
                        참여 인원 {joinedPeople} / {maxPeople}
                    </Text>

                    {joining ? (
                        <View style={{ marginTop: 8, alignItems: "center", gap: 8 }}>
                            <ActivityIndicator />
                            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>입장하는 중...</Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ marginTop: 18, gap: 8 }}>
                    {participants.map((p) => (
                        <Text key={`${p.userId}-${p.nickname}`} style={{ color: COLORS.primaryDark }}>
                            {p.nickname} {p.role === "HOST" ? "(방장)" : ""} {p.isReady ? "READY" : ""}
                        </Text>
                    ))}
                </View>

                <View style={{ marginTop: "auto", gap: 10 }}>
                    <AppButton
                        title={readyLoading ? "처리 중..." : ready ? "READY 해제" : "READY"}
                        onPress={toggleReadyStatus}
                        variant={ready ? "secondary" : "primary"}
                        disabled={readyLoading || joining}
                    />
                    <AppButton
                        title={joining ? "입장하는 중..." : "입장하기"}
                        onPress={enterRoom}
                        disabled={!canEnter || joining}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}