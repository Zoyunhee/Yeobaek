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
    Modal,
    StyleSheet,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import MessageBubble from "@/components/ui/MessageBubble";
import ChatInput from "@/components/ui/ChatInput";
import {
    type AiMessage,
    getAiMessages,
    sendAiMessage,
    completeDiagnosis,
    getDiagnosisLatest,
} from "@/services/api";

const keyExtractor = (item: AiMessage) => `${item.id}`;

type DiagnosisCardData = {
    topType: string;
    middleType: string;
    growthType: string;
    summaryComment: string;
    conversationSummary: string[];
    hashtags: string[];
    scores: {
        emotion: number;
        analysis: number;
        criticism: number;
        empathy: number;
        creativity: number;
    };
};

function mapThinkingTypeToKorean(type?: string) {
    switch (type) {
        case "EMOTION":
            return "감정형";
        case "ANALYSIS":
            return "분석형";
        case "CRITICISM":
            return "비평형";
        case "EMPATHY":
            return "공감형";
        case "CREATIVITY":
            return "창의형";
        default:
            return "분석 중";
    }
}


function buildConversationSummary(messages: AiMessage[]) {
    const userTexts = messages
        .filter((m) => m.sender === "ME")
        .map((m) => m.text.trim())
        .filter(Boolean);

    const aiTexts = messages
        .filter((m) => m.sender === "AI")
        .map((m) => m.text.trim())
        .filter(Boolean);

    const firstUser = userTexts[0] ?? "";
    const lastUser = userTexts[userTexts.length - 1] ?? "";
    const lastAi = aiTexts[aiTexts.length - 1] ?? "";

    const lines: string[] = [];

    if (firstUser) {
        lines.push(`처음에는 "${firstUser.slice(0, 28)}${firstUser.length > 28 ? "…" : ""}" 라는 생각에서 시작했어요.`);
    }

    if (lastUser && lastUser !== firstUser) {
        lines.push(`대화 끝에서는 "${lastUser.slice(0, 28)}${lastUser.length > 28 ? "…" : ""}" 쪽으로 관점이 정리됐어요.`);
    }

    if (!lines.length && lastAi) {
        lines.push("이번 대화에서 책에 대한 생각을 한 단계 더 구체적으로 말해보았어요.");
    }

    return lines.slice(0, 2);
}

const emptyScores = {
    emotion: 0,
    analysis: 0,
    criticism: 0,
    empathy: 0,
    creativity: 0,
};

export default function AiRoomScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList<AiMessage>>(null);
    const hasOpenedSummaryRef = useRef(false);

    const {
        roomId: roomIdParam,
        bookTitle,
        topicLabel = "분석",
        topicDescription = "",
        readOnly,
    } = useLocalSearchParams<{
        roomId: string;
        bookTitle?: string;
        topicId?: string;
        topicLabel?: string;
        topicDescription?: string;
        topicQuestion?: string;
        readOnly?: string;
    }>();

    const parsedRoomId = Number(roomIdParam);
    const roomId = Number.isFinite(parsedRoomId) && parsedRoomId > 0 ? parsedRoomId : NaN;
    const isReadOnly = String(readOnly) === "true";

    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);

    const [summaryVisible, setSummaryVisible] = useState(false);
    const [diagnosisCard, setDiagnosisCard] = useState<DiagnosisCardData | null>(null);

    const summaryLines = useMemo(() => {
        if (diagnosisCard?.conversationSummary?.length) {
            return diagnosisCard.conversationSummary;
        }

        return buildConversationSummary(messages);
    }, [diagnosisCard?.conversationSummary, messages]);

    const loadMessages = useCallback(async () => {
        if (!roomId || Number.isNaN(roomId)) {
            setIsLoadingHistory(false);

            if (isReadOnly) {
                Alert.alert("오류", "유효한 채팅방 정보가 없습니다.");
                router.back();
            }

            return;
        }

        try {
            setIsLoadingHistory(true);
            const res = await getAiMessages(roomId);
            const loaded = res.data ?? [];
            setMessages(loaded);
        } catch (e) {
            console.error("대화 불러오기 실패:", e);
            Alert.alert("오류", e instanceof Error ? e.message : "대화를 불러오지 못했습니다.");
        } finally {
            setIsLoadingHistory(false);
        }
    }, [roomId, isReadOnly, router]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const openSummaryAfterComplete = useCallback(async () => {
        const rawUser = await AsyncStorage.getItem("auth_user_id");
        const userId = Number(rawUser);

        if (!userId) {
            setDiagnosisCard({
                topType: "분석 중",
                middleType: "분석 중",
                growthType: "분석 중",
                summaryComment: "자가진단 결과를 불러오지 못했습니다.",
                conversationSummary: [],
                hashtags: [],
                scores: emptyScores,
            });
            setSummaryVisible(true);
            return;
        }

        try {
            const latest = await getDiagnosisLatest(userId);
            const data = latest.data;

            setDiagnosisCard({
                topType: mapThinkingTypeToKorean(data.topType),
                middleType: mapThinkingTypeToKorean(data.middleType),
                growthType: mapThinkingTypeToKorean(data.growthType),
                summaryComment:
                    data.summaryComment || "대화가 종료되고 자가진단이 생성되었습니다.",
                conversationSummary: data.conversationSummary ?? [],
                hashtags: data.hashtags ?? [],
                scores: {
                    emotion: data.emotionScore ?? 0,
                    analysis: data.analysisScore ?? 0,
                    criticism: data.criticismScore ?? 0,
                    empathy: data.empathyScore ?? 0,
                    creativity: data.creativityScore ?? 0,
                },
            });
        } catch (e) {
            console.error("최신 자가진단 불러오기 실패:", e);

            setDiagnosisCard({
                topType: "분석 중",
                middleType: "분석 중",
                growthType: "분석 중",
                summaryComment: "대화가 종료되고 자가진단이 생성되었습니다.",
                conversationSummary: [],
                hashtags: [],
                scores: emptyScores,
            });
        } finally {
            setSummaryVisible(true);
        }
    }, []);

    const finishConversation = useCallback(async () => {
        if (isFinishing || isReadOnly) return;
        if (!roomId || Number.isNaN(roomId)) return;

        try {
            setIsFinishing(true);
            await completeDiagnosis(roomId);
            await openSummaryAfterComplete();
        } catch (e) {
            console.error("완료 처리 실패:", e);
            Alert.alert("오류", e instanceof Error ? e.message : "완료 처리에 실패했습니다.");
        } finally {
            setIsFinishing(false);
        }
    }, [isFinishing, isReadOnly, roomId, openSummaryAfterComplete]);

    const onSend = useCallback(
        async (text: string) => {
            if (!text.trim() || isSending || isFinishing || isReadOnly) return;
            if (!roomId || Number.isNaN(roomId)) return;

            const optimisticMessage: AiMessage = {
                id: -Date.now(),
                roomId,
                sender: "ME",
                text: text.trim(),
                createdAt: new Date().toISOString(),
            };

            try {
                setIsSending(true);

                setMessages((prev) => [...prev, optimisticMessage]);

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 50);

                const res = await sendAiMessage(roomId, text.trim());

                const returnedMessages = res.data?.messages ?? [];

                setMessages((prev) => [
                    ...prev.filter((m) => m.id !== optimisticMessage.id),
                    ...returnedMessages,
                ]);

                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 80);

                if (res.data?.finished && !hasOpenedSummaryRef.current) {
                    hasOpenedSummaryRef.current = true;
                    await finishConversation();
                }
            } catch (e) {
                console.error("메시지 전송 실패:", e);

                setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));

                Alert.alert("오류", e instanceof Error ? e.message : "메시지 전송 실패");
            } finally {
                setIsSending(false);
            }
        },
        [roomId, isSending, isFinishing, isReadOnly, finishConversation]
    );

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleFinish = useCallback(() => {
        if (isFinishing || isReadOnly) return;

        Alert.alert(
            "대화를 완료하시겠습니까?",
            "완료하면 대화가 저장되고 자가진단 카드가 생성됩니다.",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "완료",
                    onPress: () => {
                        finishConversation();
                    },
                },
            ]
        );
    }, [isFinishing, isReadOnly, finishConversation]);

    const handleSummaryConfirm = useCallback(() => {
        setSummaryVisible(false);
        router.replace("/(profile)/reading-preference");
    }, [router]);

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
                            {isSending ? "AI가 응답 중..." : "대화 정리 중..."}
                        </Text>
                    </View>
                )}

                {!isReadOnly && (
                    <ChatInput onSend={onSend} disabled={isSending || isFinishing} />
                )}
            </KeyboardAvoidingView>

            <Modal
                visible={summaryVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSummaryVisible(false)}
            >
                <View style={modalStyles.backdrop}>
                    <View style={modalStyles.card}>
                        <Text style={modalStyles.title}>대화가 완료되었어요</Text>

                        <View style={modalStyles.badgeRow}>
                            <View style={modalStyles.mainBadge}>
                                <Text style={modalStyles.mainBadgeText}>
                                    {diagnosisCard?.topType ?? "분석 중"}
                                </Text>
                            </View>
                            <View style={modalStyles.subBadge}>
                                <Text style={modalStyles.subBadgeText}>
                                    {diagnosisCard?.growthType ?? "분석 중"}
                                </Text>
                            </View>
                        </View>

                        <Text style={modalStyles.summaryText}>
                            {diagnosisCard?.summaryComment ?? "대화 요약을 준비 중입니다."}
                        </Text>

                        {!!diagnosisCard?.hashtags?.length && (
                            <View style={modalStyles.hashtagRow}>
                                {diagnosisCard.hashtags.map((tag) => (
                                    <View key={tag} style={modalStyles.hashtagChip}>
                                        <Text style={modalStyles.hashtagText}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={modalStyles.summaryBox}>
                            <Text style={modalStyles.summaryBoxTitle}>대화 요약</Text>
                            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                                {summaryLines.map((line, index) => (
                                    <Text key={`${line}-${index}`} style={modalStyles.summaryLine}>
                                        • {line}
                                    </Text>
                                ))}
                            </ScrollView>
                        </View>

                        <Pressable
                            onPress={handleSummaryConfirm}
                            style={({ pressed }) => [modalStyles.confirmButton, pressed && { opacity: 0.9 }]}
                        >
                            <Text style={modalStyles.confirmButtonText}>확인</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.28)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    card: {
        width: "100%",
        borderRadius: 22,
        backgroundColor: COLORS.white,
        paddingHorizontal: 18,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 14,
    },
    mainBadge: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "#B19277",
    },
    mainBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "900",
    },
    subBadge: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: COLORS.secondary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    subBadgeText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "800",
    },
    summaryText: {
        marginTop: 14,
        color: COLORS.primary,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "800",
    },
    hashtagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
    },
    hashtagChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#FFFDFC",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    hashtagText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: "800",
    },
    summaryBox: {
        marginTop: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: "#FFFDFC",
        padding: 12,
    },
    summaryBoxTitle: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: "900",
        marginBottom: 8,
    },
    summaryLine: {
        color: COLORS.primary,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "700",
        marginBottom: 4,
    },
    confirmButton: {
        marginTop: 18,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmButtonText: {
        color: COLORS.bg,
        fontSize: 15,
        fontWeight: "900",
    },
});