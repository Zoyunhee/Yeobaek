import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client } from "@stomp/stompjs";

import { COLORS } from "@/constants/colors";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import {
    finishDiscussionRoom,
    getDiscussionMessages,
    getDiscussionRoom,
    leaveDiscussionRoom,
    type DiscussionMessage,
    type DiscussionRoom,
} from "@/services/api";
import {
    createDiscussionSocket,
    disconnectDiscussionSocket,
    publishDiscussionChat,
    publishDiscussionEnter,
    publishDiscussionLeave,
} from "@/services/groupSocket";

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

export default function GroupRoomScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();

    const [room, setRoom] = useState<DiscussionRoom | null>(null);
    const [messages, setMessages] = useState<DiscussionMessage[]>([]);
    const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                const [roomRes, msgRes, user] = await Promise.all([
                    getDiscussionRoom(Number(roomId)),
                    getDiscussionMessages(Number(roomId)),
                    getCurrentUser(),
                ]);

                if (!mounted) return;

                setCurrentUser(user);

                if (roomRes.success) setRoom(roomRes.data);
                if (msgRes.success) setMessages(msgRes.data ?? []);

                const client = createDiscussionSocket({
                    roomId: Number(roomId),
                    onMessage: (msg: DiscussionMessage) => {
                        setMessages((prev) => [...prev, msg]);
                    },
                    onConnect: () => {
                        if (!user) return;
                        publishDiscussionEnter(client, Number(roomId), {
                            discussionRoomId: Number(roomId),
                            type: "ENTER",
                            content: `${user.nickname}님이 입장했습니다.`,
                            sender: {
                                id: user.id,
                                userId: user.userId,
                                nickname: user.nickname,
                            },
                        });
                    },
                    onError: (error) => {
                        console.error("그룹 채팅 웹소켓 오류:", error);
                    },
                });

                clientRef.current = client;
            } catch (error) {
                console.error("그룹 채팅방 초기화 실패:", error);
            }
        }

        init();

        return () => {
            mounted = false;
            disconnectDiscussionSocket(clientRef.current);
            clientRef.current = null;
        };
    }, [roomId]);

    const roomMessages = useMemo(
        () => messages.filter((m) => String(m.discussionRoomId) === String(roomId)),
        [messages, roomId]
    );

    if (!room) return null;

    const onSend = async (text: string) => {
        if (!currentUser || !clientRef.current || !text.trim()) return;

        publishDiscussionChat(clientRef.current, Number(roomId), {
            discussionRoomId: Number(roomId),
            type: "CHAT",
            content: text,
            sender: {
                id: currentUser.id,
                userId: currentUser.userId,
                nickname: currentUser.nickname,
            },
        });
    };

    const openExitDialog = () => {
        Alert.alert(
            "채팅방 나가기",
            "",
            [
                {
                    text: "이어하기",
                    style: "cancel",
                    onPress: () => {},
                },
                {
                    text: "종료 후 완료 채팅에 저장하기",
                    onPress: async () => {
                        try {
                            if (!currentUser) return;

                            if (clientRef.current) {
                                publishDiscussionLeave(clientRef.current, Number(roomId), {
                                    discussionRoomId: Number(roomId),
                                    type: "LEAVE",
                                    content: `${currentUser.nickname}님이 퇴장했습니다.`,
                                    sender: {
                                        id: currentUser.id,
                                        userId: currentUser.userId,
                                        nickname: currentUser.nickname,
                                    },
                                });
                            }

                            const isHost = room.host?.id === currentUser.id;

                            if (isHost) {
                                await finishDiscussionRoom(Number(roomId), currentUser.id);
                            } else {
                                await leaveDiscussionRoom(Number(roomId), currentUser.id);
                            }

                            router.back();
                        } catch (error) {
                            console.error("그룹 채팅방 종료/퇴장 실패:", error);
                            router.back();
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Pressable onPress={openExitDialog} hitSlop={10}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </Pressable>

                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{room.bookTitle}</Text>

                        <View style={{ width: 22 }} />
                    </View>

                    <View
                        style={{
                            marginTop: 10,
                            backgroundColor: COLORS.white,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 10,
                            borderRadius: 6,
                        }}
                    >
                        <Text style={{ color: COLORS.primaryDark, fontWeight: "800" }} numberOfLines={1}>
                            “{room.description ?? ""}”
                        </Text>
                    </View>
                </View>

                <FlatList
                    data={roomMessages}
                    keyExtractor={(it, idx) => `${it.createdAt ?? "msg"}-${idx}`}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                    renderItem={({ item }) => (
                        <MessageBubble
                            isMe={item.sender?.id === currentUser?.id}
                            text={item.content}
                            senderName={item.sender?.id !== currentUser?.id ? item.sender?.nickname : undefined}
                        />
                    )}
                />

                <ChatInput onSend={onSend} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}