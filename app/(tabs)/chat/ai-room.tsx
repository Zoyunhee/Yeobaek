import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import { type AiMessage } from "@/services/api";

const keyExtractor = (item: AiMessage) => `${item.id}`;
const COMPLETED_META_KEY = "mock_completed_ai_chats";

type CompletedChatMeta = {
    roomId: number;
    bookTitle: string;
    topicLabel: string;
    topicDescription?: string;
    completedAt: string;
};

const buildAiReply = (
    topicId: string,
    userText: string,
    turn: number
): string => {
    const commonEndings = [
        "조금 더 구체적으로 떠올려볼 수 있을까요?",
        "반대로 보면 다른 해석도 가능할까요?",
        "그 생각의 근거가 된 장면이 있었나요?",
    ];

    if (turn >= 4) {
        return "좋아요. 오늘 대화는 여기까지 해볼게요. 이번 대화는 자가진단에 반영될 예정이에요.";
    }

    if (topicId === "analysis") {
        return [
            `흥미로운 해석이네요. "${userText.slice(0, 12)}"라고 느낀 이유를 책의 흐름과 연결해서 설명해볼 수 있을까요?`,
            "그렇다면 이 책의 핵심 메시지는 감정보다 구조에서 더 잘 드러난다고 볼 수 있을까요?",
            "좋아요. 그런데 반대로 보면 이 책이 의도적으로 모호함을 남긴 것일 수도 있지 않을까요?",
        ][Math.min(turn - 1, 2)];
    }

    if (topicId === "emotion") {
        return [
            "그 감정이 생긴 장면을 다시 떠올려보면, 인물 때문이었나요 아니면 너 자신의 경험 때문이었나요?",
            "흥미로워요. 그런데 그 감정이 꼭 긍정적인 공감만은 아니었을 수도 있지 않을까요?",
            commonEndings[0],
        ][Math.min(turn - 1, 2)];
    }

    if (topicId === "empathy") {
        return [
            "공감한 이유가 인물의 선택 때문인지, 상황 자체 때문인지 나눠서 생각해볼 수 있을까요?",
            "반대로 가장 거리감이 느껴졌던 인물이나 장면은 없었나요?",
            commonEndings[2],
        ][Math.min(turn - 1, 2)];
    }

    if (topicId === "critic") {
        return [
            "좋아요. 그 부분이 아쉽게 느껴진 이유를 기준으로 삼으면, 이 책의 한계는 무엇이라고 생각하나요?",
            "그런데 반대로 저자의 선택을 옹호해본다면 어떤 논리도 가능할까요?",
            commonEndings[1],
        ][Math.min(turn - 1, 2)];
    }

    return [
        "좋아요. 그 생각을 조금 더 확장해서 새로운 관점으로 연결해볼 수 있을까요?",
        "만약 이 책의 다음 장면을 새로 쓴다면 어떤 방향으로 이어가고 싶나요?",
        commonEndings[0],
    ][Math.min(turn - 1, 2)];
};

export default function AiRoomScreen() {
    const router = useRouter();
    const {
        roomId: roomIdParam,
        bookTitle,
        topicId = "analysis",
        topicLabel = "분석",
        topicDescription = "",
        topicQuestion = "이 책을 읽고 가장 먼저 떠오른 생각은 무엇인가요?",
        readOnly,
    } = useLocalSearchParams<{
        roomId: string;
        bookTitle?: string;
        reviewId?: string;
        reviewContent?: string;
        topicId?: string;
        topicLabel?: string;
        topicDescription?: string;
        topicQuestion?: string;
        readOnly?: string;
    }>();

    const roomId = parseInt(String(roomIdParam), 10);
    const isReadOnly = String(readOnly) === "true";

    const flatListRef = useRef<FlatList<AiMessage>>(null);

    const STORAGE_KEY = useMemo(() => `mock_ai_room_${roomId}`, [roomId]);
    const COMPLETED_KEY = useMemo(() => `mock_ai_room_completed_${roomId}`, [roomId]);

    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);

    useEffect(() => {
        if (!roomId || Number.isNaN(roomId)) {
            setIsLoadingHistory(false);
            return;
        }

        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);

                if (saved) {
                    const parsed: AiMessage[] = JSON.parse(saved);
                    setMessages(parsed);
                } else {
                    const firstAiMessage: AiMessage = {
                        id: Date.now(),
                        roomId,
                        sender: "AI",
                        text: String(topicQuestion),
                        createdAt: new Date().toISOString(),
                    };
                    setMessages([firstAiMessage]);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([firstAiMessage]));
                }
            } catch (e) {
                console.error("대화 불러오기 실패:", e);
                Alert.alert("오류", "대화를 불러오지 못했습니다.");
            } finally {
                setIsLoadingHistory(false);
            }
        })();
    }, [roomId, STORAGE_KEY, topicQuestion]);

    useEffect(() => {
        if (isLoadingHistory) return;

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch((e) =>
            console.warn("대화 저장 실패:", e)
        );
    }, [messages, isLoadingHistory, STORAGE_KEY]);

    const onSend = useCallback(
        async (text: string) => {
            if (!text.trim() || isSending || isFinishing || isReadOnly) return;

            setIsSending(true);

            const userMessage: AiMessage = {
                id: Date.now(),
                roomId,
                sender: "ME",
                text,
                createdAt: new Date().toISOString(),
            };

            const nextMessages = [...messages, userMessage];
            setMessages(nextMessages);

            setTimeout(() => {
                const userTurnCount = nextMessages.filter((m) => m.sender === "ME").length;

                const aiMessage: AiMessage = {
                    id: Date.now() + 1,
                    roomId,
                    sender: "AI",
                    text: buildAiReply(String(topicId), text, userTurnCount),
                    createdAt: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, aiMessage]);
                setIsSending(false);

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 80);
            }, 900);
        },
        [isSending, isFinishing, messages, roomId, topicId, isReadOnly]
    );

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleFinish = useCallback(async () => {
        if (isFinishing || isReadOnly) return;

        try {
            setIsFinishing(true);
            await AsyncStorage.setItem(COMPLETED_KEY, "true");

            const raw = await AsyncStorage.getItem(COMPLETED_META_KEY);
            const parsed: CompletedChatMeta[] = raw ? JSON.parse(raw) : [];

            const nextItem: CompletedChatMeta = {
                roomId,
                bookTitle: String(bookTitle ?? "AI 채팅"),
                topicLabel: String(topicLabel ?? "분석"),
                topicDescription: String(topicDescription ?? ""),
                completedAt: new Date().toISOString(),
            };

            const deduped = parsed.filter((item) => item.roomId !== roomId);
            deduped.unshift(nextItem);

            await AsyncStorage.setItem(COMPLETED_META_KEY, JSON.stringify(deduped));

            router.replace("/(profile)/library");
        } catch (e) {
            console.error("완료 처리 실패:", e);
            Alert.alert("오류", "완료 처리에 실패했습니다.");
        } finally {
            setIsFinishing(false);
        }
    }, [COMPLETED_KEY, isFinishing, isReadOnly, roomId, bookTitle, topicLabel, topicDescription, router]);

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
                        <Pressable onPress={handleBack} hitSlop={10}>
                            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                        </Pressable>

                        <Text
                            style={{ color: COLORS.primary, fontWeight: "900", maxWidth: "62%" }}
                            numberOfLines={1}
                        >
                            {bookTitle ?? "AI 채팅"}
                        </Text>

                        {isReadOnly ? (
                            <View style={{ minWidth: 32 }} />
                        ) : (
                            <Pressable
                                onPress={handleFinish}
                                disabled={isFinishing}
                                hitSlop={10}
                                style={{
                                    minWidth: 32,
                                    alignItems: "flex-end",
                                }}
                            >
                                <Text
                                    style={{
                                        color: COLORS.primary,
                                        fontWeight: "900",
                                        opacity: isFinishing ? 0.45 : 1,
                                    }}
                                >
                                    완료
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <View
                    style={{
                        marginHorizontal: 16,
                        marginBottom: 10,
                        borderRadius: 14,
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        gap: 4,
                    }}
                >
                    <Text
                        style={{
                            color: COLORS.muted,
                            fontSize: 12,
                            fontWeight: "800",
                        }}
                    >
                        선택 주제
                    </Text>

                    <Text
                        style={{
                            color: COLORS.primary,
                            fontSize: 15,
                            fontWeight: "900",
                        }}
                    >
                        {topicLabel}
                    </Text>

                    {!!topicDescription && (
                        <Text
                            style={{
                                color: COLORS.muted,
                                fontSize: 12,
                                lineHeight: 18,
                                fontWeight: "700",
                            }}
                        >
                            {topicDescription}
                        </Text>
                    )}
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
                                variant="ai"
                            />
                        )}
                    />
                )}

                {(isSending || isFinishing) && (
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
                            {isSending ? "AI가 응답 중..." : "완료 처리 중..."}
                        </Text>
                    </View>
                )}

                {!isReadOnly && (
                    <ChatInput onSend={onSend} disabled={isSending || isFinishing} />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}