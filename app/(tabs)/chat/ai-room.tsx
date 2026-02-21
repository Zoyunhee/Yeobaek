// app/(tabs)/chat/ai-room.tsx
import React, { useMemo } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import TopicCard from "@/components/ui/TopicCard";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import { useChatStore } from "@/src/chat/store";

export default function AiRoomScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const { aiRooms, messages, addMessage, updateAiRoomStatus } = useChatStore();

    const room = useMemo(() => aiRooms.find((r) => r.id === roomId), [aiRooms, roomId]);
    const roomMessages = useMemo(() => messages.filter((m) => m.roomId === roomId), [messages, roomId]);

    const onSend = (text: string) => {
        addMessage({ roomId: roomId!, sender: "ME", text });
        setTimeout(() => {
            addMessage({ roomId: roomId!, sender: "AI", text: "그 의견 흥미롭네요! 더 설명해줄 수 있나요?" });
        }, 350);
    };

    const openExitDialog = () => {
        Alert.alert(
            "채팅방 나가기 버튼을 누르셨습니다",
            "",
            [
                {
                    text: "채팅 저장 후 나중에 이어하기",
                    onPress: () => router.back(),
                },
                {
                    text: "채팅 완료하기(완료 후 저장, 채팅 불가)",
                    onPress: () => {
                        updateAiRoomStatus(roomId!, "ENDED");
                        router.back();
                    },
                },
                {
                    text: "저장하지 않고 나가기",
                    style: "destructive",
                    onPress: () => router.back(),
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {/* 헤더: ••• 제거, 뒤로(<)가 나가기 버튼 */}
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Pressable onPress={openExitDialog} hitSlop={10}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </Pressable>

                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{room?.bookTitle ?? "채팅"}</Text>

                        <View style={{ width: 22 }} />
                    </View>

                    <View style={{ marginTop: 10 }}>
                        <TopicCard title="이번 대화의 발제문" body="(임시) 발제문은 나중에 서버에서 내려받아 표시" />
                    </View>
                </View>

                <FlatList
                    data={roomMessages}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                    renderItem={({ item }) => (
                        <MessageBubble
                            isMe={item.sender === "ME"}
                            text={item.text}
                            senderName={item.sender === "AI" ? "AI" : undefined}
                        />
                    )}
                />

                <ChatInput onSend={onSend} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}