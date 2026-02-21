// app/(tabs)/chat/group-room.tsx
import React, { useMemo } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import { useChatStore } from "@/src/chat/store";

export default function GroupRoomScreen() {
    const router = useRouter();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const { groupRooms, messages, addMessage, updateGroupRoomStatus } = useChatStore();

    const room = useMemo(() => groupRooms.find((r) => r.id === roomId), [groupRooms, roomId]);
    const roomMessages = useMemo(() => messages.filter((m) => m.roomId === roomId), [messages, roomId]);
    if (!room) return null;

    const onSend = (text: string) => addMessage({ roomId: room.id, sender: "ME", text });

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
                    onPress: () => {
                        updateGroupRoomStatus(room.id, "ENDED");
                        router.back();
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {/* 상단 바: ••• 제거, 뒤로가기가 나가기 */}
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Pressable onPress={openExitDialog} hitSlop={10}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </Pressable>

                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{room.bookTitle}</Text>

                        <View style={{ width: 22 }} />
                    </View>

                    {/* 주제 고정 */}
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
                            “{room.topic}”
                        </Text>
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
                            senderName={item.sender === "USER" ? item.senderName : undefined}
                        />
                    )}
                />

                <ChatInput onSend={onSend} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}