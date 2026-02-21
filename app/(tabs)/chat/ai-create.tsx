// app/(tabs)/chat/ai-create.tsx
import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";
import SearchBar from "@/components/ui/SearchBar";
import AppButton from "@/components/ui/AppButton";
import { useChatStore } from "@/src/chat/store";

type Book = { title: string; author: string; coverUrl?: string };

const mockBooks: Book[] = [
    { title: "1퍼센트 부자들의 법칙", author: "사토 후미아키", coverUrl: "https://image.yes24.com/goods/123456/XL" },
    { title: "대화의 기술", author: "김철수" },
    { title: "어쩌면 당신이 원했던 변화", author: "홍길동" },
];

const moodItems = [
    { score: 5, emoji: "😄", label: "매우 좋음" },
    { score: 4, emoji: "😊", label: "약간 좋음" },
    { score: 3, emoji: "🙂", label: "그저 그럼" },
    { score: 2, emoji: "😕", label: "기분 안 좋음" },
    { score: 1, emoji: "😢", label: "슬픔" },
    { score: 0, emoji: "😡", label: "화남" },
] as const;

export default function AiCreateScreen() {
    const router = useRouter();
    const { createAiRoom } = useChatStore();

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Book | null>(mockBooks[0]);
    const [mood, setMood] = useState<number>(4);

    const results = useMemo(() => {
        const q = query.trim();
        if (!q) return mockBooks;
        return mockBooks.filter((b) => b.title.includes(q) || b.author.includes(q));
    }, [query]);

    const create = () => {
        if (!selected) return Alert.alert("도서를 선택해주세요");

        const room = createAiRoom({
            bookTitle: selected.title,
            author: selected.author,
            coverUrl: selected.coverUrl,
            mood,
        });

        router.replace({ pathname: "/(tabs)/chat/ai-room", params: { roomId: room.id } } as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
                {/* 헤더 */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Pressable onPress={() => router.back()} hitSlop={10}>
                        <Ionicons name="close" size={22} color={COLORS.primary} />
                    </Pressable>
                    <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "900" }}>AI 채팅 만들기</Text>
                    <View style={{ width: 22 }} />
                </View>

                {/* 책 표지(선택 전 공백) */}
                <View
                    style={{
                        width: 140,
                        height: 200,
                        alignSelf: "center",
                        borderRadius: 12,
                        backgroundColor: COLORS.white,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        overflow: "hidden",
                    }}
                >
                    {selected?.coverUrl ? <Image source={{ uri: selected.coverUrl }} style={{ width: "100%", height: "100%" }} /> : null}
                </View>

                {/* 책 검색/선택 */}
                <View style={{ backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, gap: 10 }}>
                    <SearchBar value={query} onChangeText={setQuery} placeholder="도서 검색 (채팅방 이름)" />

                    <View style={{ gap: 8 }}>
                        {results.map((b) => {
                            const active = selected?.title === b.title && selected?.author === b.author;
                            return (
                                <Pressable
                                    key={`${b.title}-${b.author}`}
                                    onPress={() => setSelected(b)}
                                    style={{
                                        paddingVertical: 10,
                                        paddingHorizontal: 10,
                                        borderRadius: 10,
                                        backgroundColor: active ? COLORS.mintLight : COLORS.bg,
                                        borderWidth: 1,
                                        borderColor: active ? COLORS.mint : COLORS.border,
                                    }}
                                >
                                    <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{b.title}</Text>
                                    <Text style={{ color: COLORS.muted, marginTop: 2 }}>{b.author}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* 기분 선택 */}
                <View style={{ backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, gap: 12 }}>
                    <Text style={{ color: COLORS.primary, fontWeight: "900" }}> 책을 어떤 기분으로 읽고 있나요?</Text>

                    {moodItems.map((m) => {
                        const active = mood === m.score;
                        return (
                            <Pressable
                                key={m.score}
                                onPress={() => setMood(m.score)}
                                style={{
                                    borderRadius: 999,
                                    paddingVertical: 14,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: COLORS.border,
                                    backgroundColor: active ? COLORS.primary : COLORS.secondary,
                                }}
                            >
                                <Text style={{ fontWeight: "900", color: active ? COLORS.white : COLORS.primary }}>
                                    {m.emoji} {m.score} {m.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <AppButton title="AI 채팅 생성" onPress={create} />
            </ScrollView>
        </SafeAreaView>
    );
}