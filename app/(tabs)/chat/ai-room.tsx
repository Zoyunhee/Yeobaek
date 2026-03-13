import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import {
    type AiMessage,
    discardAiRoom,
    finishAiSession,
    getAiMessages,
    saveAiSession,
    sendAiMessage,
    startAiSession,
} from "@/services/api";

const keyExtractor = (item: AiMessage) => `${item.id}`;

export default function AiRoomScreen() {
    const router = useRouter();
    const { roomId: roomIdParam, bookTitle } = useLocalSearchParams<{
        roomId: string;
        bookTitle?: string;
    }>();

    const roomId = parseInt(String(roomIdParam), 10);

    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const flatListRef = useRef<FlatList<AiMessage>>(null);

    useEffect(() => {
        if (!roomId || Number.isNaN(roomId)) return;

        (async () => {
            try {
                await startAiSession(roomId).catch((e) =>
                    console.warn("세션 시작 실패 (무시):", e)
                );

                const res = await getAiMessages(roomId);

                const normalized: AiMessage[] = (res.data ?? []).map((m) => ({
                    id: m.messageId,
                    roomId,
                    sender: m.role === "USER" ? "ME" : "AI",
                    text: m.content,
                    createdAt: m.createdAt,
                }));

                setMessages(normalized);
            } catch (e) {
                console.error("메시지 로드 실패:", e);
                Alert.alert("오류", "이전 대화를 불러오지 못했습니다.");
            } finally {
                setIsLoadingHistory(false);
            }
        })();
    }, [roomId]);

    const onSend = useCallback(
        async (text: string) => {
            if (isSending || isExiting || !text.trim()) return;

            setIsSending(true);

            const tempUserMsg: AiMessage = {
                id: Date.now(),
                roomId,
                sender: "ME",
                text,
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, tempUserMsg]);

            try {
                const res = await sendAiMessage(roomId, text);

                const aiMessage: AiMessage = {
                    id: res.data.messageId,
                    sender: "AI",
                    text: res.data.content,
                    createdAt: res.data.createdAt,
                    roomId,
                };

                setMessages((prev) => [
                    ...prev.filter((m) => m.id !== tempUserMsg.id),
                    tempUserMsg,
                    aiMessage,
                ]);
            } catch (e: any) {
                setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
                Alert.alert("전송 실패", e?.message ?? "메시지 전송에 실패했습니다.");
            } finally {
                setIsSending(false);
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        },
        [isSending, isExiting, roomId]
    );

    const goChatIndex = useCallback(() => {
        router.replace("/(tabs)/chat");
    }, [router]);

    const handleSaveAndExit = useCallback(async () => {
        if (isExiting) return;

        try {
            setIsExiting(true);
            await saveAiSession(roomId);
            goChatIndex();
        } catch (e: any) {
            console.error("세션 저장 실패:", e);
            Alert.alert("오류", e?.message ?? "채팅 저장 후 나가기에 실패했습니다.");
        } finally {
            setIsExiting(false);
        }
    }, [isExiting, roomId, goChatIndex]);

    const handleFinishAndExit = useCallback(async () => {
        if (isExiting) return;

        try {
            setIsExiting(true);
            await finishAiSession(roomId);
            goChatIndex();
        } catch (e: any) {
            console.error("완독 처리 실패:", e);
            Alert.alert("오류", e?.message ?? "완독 처리에 실패했습니다.");
        } finally {
            setIsExiting(false);
        }
    }, [isExiting, roomId, goChatIndex]);

    const handleDiscardAndExit = useCallback(async () => {
        if (isExiting) return;

        try {
            setIsExiting(true);
            await discardAiRoom(roomId);
            goChatIndex();
        } catch (e: any) {
            console.error("채팅방 삭제 실패:", e);
            Alert.alert("오류", e?.message ?? "채팅방 삭제에 실패했습니다.");
        } finally {
            setIsExiting(false);
        }
    }, [isExiting, roomId, goChatIndex]);

    const openExitDialog = useCallback(() => {
        if (isExiting) return;

        Alert.alert(
            "채팅방 나가기",
            "",
            [
                {
                    text: "채팅 저장 후 나중에 이어하기",
                    onPress: handleSaveAndExit,
                },
                {
                    text: "채팅 완료하기 (완독 처리)",
                    onPress: handleFinishAndExit,
                },
                {
                    text: "저장하지 않고 나가기",
                    style: "destructive",
                    onPress: handleDiscardAndExit,
                },
                {
                    text: "취소",
                    style: "cancel",
                },
            ],
            { cancelable: true }
        );
    }, [isExiting, handleSaveAndExit, handleFinishAndExit, handleDiscardAndExit]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Pressable onPress={openExitDialog} hitSlop={10} disabled={isExiting}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </Pressable>

                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                            {bookTitle ?? "AI 채팅"}
                        </Text>

                        <View style={{ width: 22 }} />
                    </View>
                </View>

                {isLoadingHistory ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: false })
                        }
                        renderItem={({ item }) => (
                            <MessageBubble
                                isMe={item.sender === "ME"}
                                text={item.text}
                                senderName={item.sender === "AI" ? "AI" : undefined}
                            />
                        )}
                    />
                )}

                {(isSending || isExiting) && (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingBottom: 4,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                            {isSending ? "AI가 응답 중..." : "처리 중..."}
                        </Text>
                    </View>
                )}

                <ChatInput onSend={onSend} disabled={isSending || isExiting} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}