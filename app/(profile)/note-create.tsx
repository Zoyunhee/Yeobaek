import React, { useMemo, useState } from "react";
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
    ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import SearchBar from "@/components/ui/SearchBar";
import { createReadingNote, searchBooks } from "@/services/api";

type Book = {
    id: string;
    isbn: string;
    title: string;
    author: string;
    coverImage?: string;
    publisher?: string;
};

const BOOK_COVER = require("../../assets/images/book-cover.png");

export default function NoteCreateScreen() {
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Book | null>(null);
    const [quote, setQuote] = useState("");

    const canSave = useMemo(() => {
        return !!selected && quote.trim().length > 0;
    }, [selected, quote]);

    const onSearch = async () => {
        const q = query.trim();

        if (!q) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);

            const res = await searchBooks(q, 1, 10);

            const mapped: Book[] = (res.items ?? []).map((item, index) => ({
                id: `${item.isbn}-${index}`,
                isbn: item.isbn,
                title: item.title,
                author: item.authors?.join(", ") ?? "저자 미상",
                coverImage: item.thumbnail,
                publisher: item.publisher,
            }));

            setResults(mapped);
        } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "책 검색에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const onChangeQuery = (text: string) => {
        setQuery(text);

        if (!text.trim()) {
            setResults([]);
        }
    };

    const onSelectBook = (book: Book) => {
        setSelected(book);
        setQuery("");
        setResults([]);
    };

    const onResetSelectedBook = () => {
        setSelected(null);
    };

    const onSave = async () => {
        if (!selected || !quote.trim()) return;

        try {
            const rawUser = await AsyncStorage.getItem("user");
            if (!rawUser) throw new Error("로그인 정보가 없습니다.");

            const user = JSON.parse(rawUser);
            const userId = Number(user.id);

            if (!userId) {
                throw new Error("사용자 정보가 올바르지 않습니다.");
            }

            await createReadingNote({
                userId,
                bookIsbn: selected.isbn,
                bookTitle: selected.title,
                author: selected.author,
                coverImage: selected.coverImage,
                publisher: selected.publisher,
                memorableQuote: quote.trim(),
            });

            Alert.alert("완료", "독서장이 저장되었습니다.");
            router.back();
        } catch (e) {
            Alert.alert("오류", e instanceof Error ? e.message : "독서장 저장 실패");
        }
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
                        <Pressable
                            onPress={() => router.back()}
                            hitSlop={12}
                            style={styles.headerBtn}
                        >
                            <IconSymbol
                                name="chevron.left"
                                size={18}
                                color={COLORS.primary}
                            />
                        </Pressable>
                    ),
                }}
            />

            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <SearchBar
                        value={query}
                        onChangeText={onChangeQuery}
                        placeholder="책 제목, 저자 검색"
                        onSubmit={onSearch}
                    />

                    {!selected && loading && (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    )}

                    {!selected && !loading && results.length > 0 && (
                        <View style={styles.resultBox}>
                            {results.map((book, idx) => (
                                <Pressable
                                    key={book.id}
                                    onPress={() => onSelectBook(book)}
                                    style={[
                                        styles.resultRow,
                                        idx === results.length - 1 && {
                                            borderBottomWidth: 0,
                                        },
                                    ]}
                                >
                                    <Image
                                        source={
                                            book.coverImage
                                                ? { uri: book.coverImage }
                                                : BOOK_COVER
                                        }
                                        style={styles.thumb}
                                    />
                                    <View style={styles.resultMeta}>
                                        <Text style={styles.rTitle}>{book.title}</Text>
                                        <Text style={styles.rSub}>{book.author}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {!selected && !loading && query.trim() !== "" && results.length === 0 && (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                        </View>
                    )}

                    {selected && (
                        <View style={styles.bookBlock}>
                            <Image
                                source={
                                    selected.coverImage
                                        ? { uri: selected.coverImage }
                                        : BOOK_COVER
                                }
                                style={styles.bigCover}
                            />
                            <Text style={styles.bookTitle}>{selected.title}</Text>
                            <Text style={styles.bookAuthor}>{selected.author}</Text>

                            <Pressable
                                onPress={onResetSelectedBook}
                                style={styles.changeBtn}
                            >
                                <Text style={styles.changeText}>다른 책 불러오기</Text>
                            </Pressable>
                        </View>
                    )}

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

                    <View style={{ height: 90 }} />
                </ScrollView>

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
    screen: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    headerBtn: {
        paddingHorizontal: 6,
    },

    container: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    loadingBox: {
        marginTop: 14,
        alignItems: "center",
    },

    emptyBox: {
        marginTop: 14,
        paddingVertical: 18,
        alignItems: "center",
    },

    emptyText: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.neutralDark,
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

    resultMeta: {
        flex: 1,
    },

    thumb: {
        width: 38,
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },

    rTitle: {
        fontSize: 13,
        fontWeight: "900",
        color: COLORS.primary,
    },

    rSub: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

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

    bookTitle: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.primary,
    },

    bookAuthor: {
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

    changeBtn: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },

    changeText: {
        fontSize: 12,
        fontWeight: "900",
        color: COLORS.primary,
    },

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