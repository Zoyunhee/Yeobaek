import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/constants/colors";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import SearchBar from "@/components/ui/SearchBar";
import { createDiscussionRoom, searchBooks } from "@/services/api";

type Book = {
    title: string;
    author: string;
    coverUrl?: string;
    isbn?: string;
    publisher?: string;
};

type StoredUser = {
    id: number;
    userId: string;
    name: string;
    nickname: string;
    email: string;
    role: string;
    surveyCompleted: boolean;
};

const fmtDateKo = (d: Date) =>
    d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

const fmtTimeKo = (d: Date) =>
    d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

const pillBox = {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.mint,
    backgroundColor: COLORS.mintLight,
    alignItems: "center" as const,
    justifyContent: "center" as const,
};

async function getCurrentUser(): Promise<StoredUser | null> {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
}

function toLocalDateTimeString(date: Date) {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const HH = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = "00";

    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
}

function PickerModal({
                         visible,
                         title,
                         mode,
                         value,
                         onClose,
                         onConfirm,
                     }: {
    visible: boolean;
    title: string;
    mode: "date" | "time";
    value: Date;
    onClose: () => void;
    onConfirm: (d: Date) => void;
}) {
    const [temp, setTemp] = useState<Date>(value);

    React.useEffect(() => {
        if (visible) setTemp(value);
    }, [visible, value]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                onPress={onClose}
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}
            >
                <Pressable
                    onPress={() => {}}
                    style={{
                        backgroundColor: COLORS.white,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        padding: 16,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <Text style={{ color: COLORS.primary, fontWeight: "900", fontSize: 16 }}>{title}</Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={20} color={COLORS.primary} />
                        </Pressable>
                    </View>

                    <View style={{ backgroundColor: COLORS.bg, borderRadius: 12, paddingVertical: 8 }}>
                        <DateTimePicker
                            value={temp}
                            mode={mode}
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(_, d) => d && setTemp(d)}
                        />
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                        <Pressable
                            onPress={onClose}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                alignItems: "center",
                                backgroundColor: COLORS.white,
                            }}
                        >
                            <Text style={{ color: COLORS.neutralDark, fontWeight: "900" }}>취소</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => onConfirm(temp)}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: "center",
                                backgroundColor: COLORS.primary,
                            }}
                        >
                            <Text style={{ color: COLORS.white, fontWeight: "900" }}>선택 완료</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export default function GroupCreateScreen() {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Book[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [selected, setSelected] = useState<Book | null>(null);
    const [author, setAuthor] = useState("");

    const [topic, setTopic] = useState("");

    const [mood1, setMood1] = useState("");
    const [mood2, setMood2] = useState("");
    const [mood3, setMood3] = useState("");
    const [mood4, setMood4] = useState("");

    const [durationMin, setDurationMin] = useState("120");
    const [maxPeople, setMaxPeople] = useState("4");

    const [startDate, setStartDate] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000));
    const [dateModal, setDateModal] = useState(false);
    const [timeModal, setTimeModal] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function runSearch() {
            const q = query.trim();

            if (!q) {
                setResults([]);
                return;
            }

            try {
                setSearchLoading(true);

                const res = await searchBooks(q, 1, 10);

                if (cancelled) return;

                setResults(
                    (res.items ?? []).map((item) => ({
                        title: item.title,
                        author: item.authors?.join(", ") ?? "",
                        coverUrl: item.thumbnail,
                        isbn: item.isbn,
                        publisher: item.publisher,
                    }))
                );
            } catch (error) {
                if (!cancelled) {
                    console.error("도서 검색 실패:", error);
                    setResults([]);
                }
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        }

        const timer = setTimeout(runSearch, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const pickBook = (b: Book) => {
        setSelected(b);
        setAuthor(b.author);
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    };

    const create = async () => {
        if (!selected) {
            return Alert.alert("도서를 선택해주세요");
        }

        const dur = Number(durationMin);
        const max = Number(maxPeople);

        if (!Number.isFinite(dur) || dur <= 0) {
            return Alert.alert("토론 예상 시간을 올바르게 입력해주세요");
        }

        if (!Number.isFinite(max) || max < 2 || max > 4) {
            return Alert.alert("참여 인원은 2명 이상 4명 이하여야 해요");
        }

        const anyMood = [mood1, mood2, mood3, mood4].some(
            (v) => v.trim().length > 0
        );

        if (!anyMood) {
            return Alert.alert("대화 분위기/규칙/스타일은 최소 1개 입력해 주세요");
        }

        const user = await getCurrentUser();

        if (!user) {
            return Alert.alert("로그인 정보가 없습니다");
        }

        try {
            const payload = {
                bookTitle: selected.title,
                bookAuthor: author,
                bookIsbn: selected.isbn,
                bookCover: selected.coverUrl,
                bookPublisher: selected.publisher,
                description: topic.trim() || "주인공의 감정에 대해 토론해요",
                maxParticipants: max,
                discussionStartTime: toLocalDateTimeString(startDate),
                estimatedDurationMinutes: dur,
                hostId: user.id,
                discussionRules: [mood1, mood2, mood3, mood4]
                    .map((v) => v.trim())
                    .filter(Boolean),
            };

            console.log("createDiscussionRoom payload =", payload);

            const res = await createDiscussionRoom(payload);

            if (!res.success) {
                return Alert.alert("채팅방 생성 실패");
            }

            router.replace({
                pathname: "/(tabs)/chat/group-detail",
                params: { roomId: String(res.data.id) },
            } as any);
        } catch (error: any) {
            console.log("createDiscussionRoom error =", error);
            Alert.alert("채팅방 생성 실패", error?.message ?? "오류가 발생했습니다");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Pressable onPress={() => router.back()} hitSlop={10}>
                            <Ionicons name="close" size={22} color={COLORS.primary} />
                        </Pressable>
                        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: "900" }}>그룹 채팅 만들기</Text>
                        <View style={{ width: 22 }} />
                    </View>

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
                        {selected?.coverUrl ? (
                            <Image source={{ uri: selected.coverUrl }} style={{ width: "100%", height: "100%" }} />
                        ) : null}
                    </View>

                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 12,
                            gap: 10,
                        }}
                    >
                        <SearchBar value={query} onChangeText={setQuery} placeholder="도서 검색 (채팅방 이름)" />

                        <View style={{ gap: 8 }}>
                            {results.map((b) => {
                                const active =
                                    selected?.title === b.title &&
                                    selected?.author === b.author &&
                                    selected?.isbn === b.isbn;

                                return (
                                    <Pressable
                                        key={`${b.title}-${b.author}-${b.isbn ?? ""}`}
                                        onPress={() => pickBook(b)}
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

                            {!searchLoading && query.trim().length > 0 && results.length === 0 && (
                                <Text style={{ color: COLORS.muted }}>검색 결과가 없습니다.</Text>
                            )}
                        </View>

                        <AppInput value={author} onChangeText={setAuthor} placeholder="저자" />
                    </View>

                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 12,
                            gap: 10,
                        }}
                    >
                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 방 한 줄 소개(토론 주제)</Text>
                        <AppInput value={topic} onChangeText={setTopic} placeholder="주인공의 감정에 대해 토론해요" />
                    </View>

                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 12,
                            gap: 10,
                        }}
                    >
                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 대화 분위기/규칙/스타일 (1개 필수)</Text>
                        <AppInput value={mood1} onChangeText={setMood1} placeholder='예: "스포일러 없음"' />
                        <AppInput value={mood2} onChangeText={setMood2} placeholder='예: "따뜻하게"' />
                        <AppInput value={mood3} onChangeText={setMood3} placeholder='예: "서로 존중 / 끼어들기 금지"' />
                        <AppInput value={mood4} onChangeText={setMood4} placeholder='예: "자유 토론 / 턴제"' />
                    </View>

                    <View
                        style={{
                            backgroundColor: COLORS.white,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                            padding: 12,
                            gap: 10,
                        }}
                    >
                        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 시작 시간</Text>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <Pressable style={pillBox} onPress={() => setDateModal(true)}>
                                <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{fmtDateKo(startDate)}</Text>
                            </Pressable>

                            <Pressable style={pillBox} onPress={() => setTimeModal(true)}>
                                <Text style={{ color: COLORS.primary, fontWeight: "900" }}>{fmtTimeKo(startDate)}</Text>
                            </Pressable>
                        </View>

                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                            선택됨: {startDate.toLocaleString()}
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.white,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 토론 예상 시간</Text>
                            <AppInput
                                value={durationMin}
                                onChangeText={setDurationMin}
                                placeholder="예: 120"
                                keyboardType="number-pad"
                                onFocus={scrollToBottom}
                            />
                        </View>

                        <View
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.white,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: COLORS.border,
                                padding: 12,
                                gap: 8,
                            }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>• 참여 인원</Text>
                            <AppInput
                                value={maxPeople}
                                onChangeText={setMaxPeople}
                                placeholder="예: 4"
                                keyboardType="number-pad"
                                onFocus={scrollToBottom}
                            />
                        </View>
                    </View>

                    <AppButton title="그룹 채팅방 생성하기" onPress={create} />
                </ScrollView>

                <PickerModal
                    visible={dateModal}
                    title="날짜 선택"
                    mode="date"
                    value={startDate}
                    onClose={() => setDateModal(false)}
                    onConfirm={(d) => {
                        const next = new Date(startDate);
                        next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                        setStartDate(next);
                        setDateModal(false);
                    }}
                />

                <PickerModal
                    visible={timeModal}
                    title="시간 선택"
                    mode="time"
                    value={startDate}
                    onClose={() => setTimeModal(false)}
                    onConfirm={(d) => {
                        const next = new Date(startDate);
                        next.setHours(d.getHours(), d.getMinutes(), 0, 0);
                        setStartDate(next);
                        setTimeModal(false);
                    }}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}