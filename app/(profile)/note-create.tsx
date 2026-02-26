import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import SearchBar from "@/components/ui/SearchBar";

type Book = { id: string; title: string; author: string; createdAt?: string };
type Note = { id: string; bookTitle: string; quote: string; createdAt: string };

const LIKED_BOOKS_KEY = "liked_books_v1";
const NOTES_KEY = "reading_notes_v1";

const BOOK_COVER = require("../../assets/images/book-cover.png");

function nowShort() {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
}

export default function NoteCreateScreen() {
    const router = useRouter();

    const [books, setBooks] = useState<Book[]>([]);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Book | null>(null);
    const [quote, setQuote] = useState("");

    const loadBooks = useCallback(async () => {
        const raw = await AsyncStorage.getItem(LIKED_BOOKS_KEY);
        setBooks(raw ? (JSON.parse(raw) as Book[]) : []);
    }, []);

    useEffect(() => {
        loadBooks();
    }, [loadBooks]);

    // 검색 결과(찜 목록에서 필터링). 나중에 API로 교체하면 setResults만 하면 됨.
    const results = useMemo(() => {
        const q = query.trim();
        if (!q) return [];
        return books.filter((b) => b.title.includes(q) || b.author.includes(q));
    }, [books, query]);

    const canSave = useMemo(() => {
        return !!selected && quote.trim().length > 0;
    }, [selected, quote]);

    const onSelectBook = (b: Book) => {
        setSelected(b);
        setQuery(""); // 결과 리스트 숨김
    };

    const onSave = async () => {
        if (!canSave) return;

        Alert.alert("저장", "독서장을 저장하시겠습니까?", [
            { text: "취소하기", style: "cancel" },
            {
                text: "저장하기",
                onPress: async () => {
                    const raw = await AsyncStorage.getItem(NOTES_KEY);
                    const prev = raw ? (JSON.parse(raw) as Note[]) : [];

                    const next: Note = {
                        id: `note_${Date.now()}`,
                        bookTitle: selected!.title,
                        quote: quote.trim(),
                        createdAt: nowShort(),
                    };

                    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([next, ...prev]));
                    router.back();
                },
            },
        ]);
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "독서장 작성",
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: COLORS.bg },
                    headerTitleStyle: { color: COLORS.primary, fontWeight: "900" },
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
                            <IconSymbol name="chevron.left" size={18} color={COLORS.primary} />
                        </Pressable>
                    ),
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: COLORS.bg }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* 검색바 */}
                    <SearchBar
                        value={query}
                        onChangeText={setQuery}
                        placeholder="책 제목, 저자 검색"
                        onSubmit={() => {}}
                    />

                    {/* 검색 결과 (선택 전) */}
                    {!selected && results.length > 0 && (
                        <View style={styles.resultBox}>
                            {results.slice(0, 8).map((b, idx) => (
                                <Pressable
                                    key={b.id}
                                    onPress={() => onSelectBook(b)}
                                    style={[styles.resultRow, idx === results.slice(0, 8).length - 1 && { borderBottomWidth: 0 }]}
                                >
                                    <Image source={BOOK_COVER} style={styles.thumb} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.rTitle}>{b.title}</Text>
                                        <Text style={styles.rSub}>{b.author}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* ✅ 선택된 책 프리뷰(표지칸) */}
                    {selected && (
                        <View style={styles.bookBlock}>
                            <Image source={BOOK_COVER} style={styles.bigCover} />
                            <Text style={styles.bookTitle}>{selected.title}</Text>
                            <Text style={styles.bookAuthor}>{selected.author}</Text>

                            <Pressable onPress={() => setSelected(null)} style={styles.changeBtn}>
                                <Text style={styles.changeText}>다른 책 불러오기</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* 텍스트 입력 */}
                    <View style={styles.inputCard}>
                        <TextInput
                            value={quote}
                            onChangeText={setQuote}
                            placeholder="책 속 기억에 남는 한 구절을 작성해주세요"
                            placeholderTextColor={COLORS.neutralLightDarkest}
                            multiline
                            style={styles.textArea}
                        />
                    </View>

                    {/* 하단 버튼 공간 확보 */}
                    <View style={{ height: 90 }} />
                </ScrollView>

                {/* ✅ 저장 버튼(고정) */}
                <View style={styles.bottomBar}>
                    <Pressable
                        onPress={onSave}
                        disabled={!canSave}
                        style={({ pressed }) => [
                            styles.saveBtn,
                            !canSave && { opacity: 0.5 },
                            pressed && canSave && { opacity: 0.9 },
                        ]}
                    >
                        <Text style={styles.saveText}>저장</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    headerBtn: { paddingHorizontal: 6 },

    container: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    resultBox: {
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        overflow: "hidden",
    },
    resultRow: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    thumb: {
        width: 38,
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },
    rTitle: { fontSize: 13, fontWeight: "900", color: COLORS.primary },
    rSub: { marginTop: 4, fontSize: 12, fontWeight: "800", color: COLORS.neutralDark },

    bookBlock: {
        marginTop: 18,
        alignItems: "center",
        gap: 6,
    },
    bigCover: {
        width: 120,
        height: 160,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },
    bookTitle: { marginTop: 10, fontSize: 14, fontWeight: "900", color: COLORS.primary },
    bookAuthor: { fontSize: 12, fontWeight: "800", color: COLORS.neutralDark },
    changeBtn: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    changeText: { fontSize: 12, fontWeight: "900", color: COLORS.primary },

    inputCard: {
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        padding: 12,
    },
    textArea: {
        minHeight: 180,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.primary,
        textAlignVertical: "top",
    },

    bottomBar: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.bg,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Platform.OS === "ios" ? 18 : 12,
    },
    saveBtn: {
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    saveText: {
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.bg,
    },
});