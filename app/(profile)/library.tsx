import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    Image,
    Platform,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { IconSymbolName } from "@/components/ui/icon-symbol";

type TabKey = "liked" | "completed" | "notes";

type Book = {
    id: string;
    title: string;
    author: string;
};

type CompletedChat = {
    id: string;
    title: string;
    subtitle: string; // "주인공 감정에 대해 토론해요" 같은 1줄
    peopleText: string; // "2 / 4 명"
    timeText: string; // "26.02.01 19:00"
    lastMessage?: string; // 긴 텍스트
    isDone?: boolean; // 완료 표시(빨간 점 등)
};

type Note = {
    id: string;
    bookTitle: string;
    quote: string;
    createdAt: string;
};

const LIKED_BOOKS_KEY = "liked_books_v1";
const COMPLETED_CHATS_KEY = "completed_chats_v1";
const NOTES_KEY = "reading_notes_v1";

const BOOK_COVER = require("../../assets/images/book-cover.png");

async function seedIfEmpty() {
    const [b, c, n] = await Promise.all([
        AsyncStorage.getItem(LIKED_BOOKS_KEY),
        AsyncStorage.getItem(COMPLETED_CHATS_KEY),
        AsyncStorage.getItem(NOTES_KEY),
    ]);

    if (!b) {
        const books: Book[] = [
            { id: "b1", title: "1퍼센트 부자들의 법칙", author: "글쓴이" },
            { id: "b2", title: "1퍼센트 부자들의 법칙", author: "글쓴이" },
            { id: "b3", title: "1퍼센트 부자들의 법칙", author: "글쓴이" },
        ];
        await AsyncStorage.setItem(LIKED_BOOKS_KEY, JSON.stringify(books));
    }

    if (!c) {
        const chats: CompletedChat[] = [
            {
                id: "c1",
                title: "1퍼센트 부자들의 법칙",
                subtitle: "주인공 감정에 대해 토론해요",
                peopleText: "2 / 4 명",
                timeText: "26.02.01 19:00",
            },
            {
                id: "c2",
                title: "1퍼센트 부자들의 법칙",
                subtitle: "주인공 감정에 대해 토론해요",
                peopleText: "2 / 4 명",
                timeText: "26.02.01 19:00",
            },
            {
                id: "c3",
                title: "1퍼센트 부자들의 법칙",
                subtitle: "마지막 대화 ... @@@@ 마지막대화마지막대화마지막대화...",
                peopleText: "2 / 4 명",
                timeText: "26.02.01 19:00",
                isDone: true,
            },
            {
                id: "c4",
                title: "1퍼센트 부자들의 법칙",
                subtitle: "마지막 대화 ... @@@@ 마지막대화마지막대화마지막대화...",
                peopleText: "2 / 4 명",
                timeText: "26.02.01 19:00",
                isDone: true,
            },
        ];
        await AsyncStorage.setItem(COMPLETED_CHATS_KEY, JSON.stringify(chats));
    }

    if (!n) {
        const notes: Note[] = [
            { id: "n1", bookTitle: "1퍼센트 부자들의 법칙", quote: "기억에 남은 책 구절", createdAt: "26.02.01" },
            { id: "n2", bookTitle: "1퍼센트 부자들의 법칙", quote: "기억에 남은 책 구절", createdAt: "26.02.01" },
            { id: "n3", bookTitle: "1퍼센트 부자들의 법칙", quote: "기억에 남은 책 구절", createdAt: "26.02.01" },
        ];
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }
}

export default function LibraryScreen() {
    const router = useRouter();
    const [tab, setTab] = useState<TabKey>("liked");

    const [liked, setLiked] = useState<Book[]>([]);
    const [completed, setCompleted] = useState<CompletedChat[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);

    const load = useCallback(async () => {
        await seedIfEmpty();
        const [b, c, n] = await Promise.all([
            AsyncStorage.getItem(LIKED_BOOKS_KEY),
            AsyncStorage.getItem(COMPLETED_CHATS_KEY),
            AsyncStorage.getItem(NOTES_KEY),
        ]);

        setLiked(b ? (JSON.parse(b) as Book[]) : []);
        setCompleted(c ? (JSON.parse(c) as CompletedChat[]) : []);
        setNotes(n ? (JSON.parse(n) as Note[]) : []);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const data = useMemo(() => {
        if (tab === "liked") return liked;
        if (tab === "completed") return completed;
        return notes;
    }, [tab, liked, completed, notes]);

    return (
        <>
            <Stack.Screen
                options={{
                    title: "나의 서재",
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingHorizontal: 6 }}>
                            <IconSymbol name="chevron.left" size={18} color={COLORS.primary} />
                        </Pressable>
                    ),
                }}
            />

            <View style={styles.screen}>
                {/* 상단 탭 */}
                <View style={styles.topTabs}>
                    <TabButton
                        active={tab === "liked"}
                        iconName={tab === "liked" ? "heart.fill" : "heart"}
                        label="찜"
                        onPress={() => setTab("liked")}
                    />
                    <TabButton
                        active={tab === "completed"}
                        iconName={tab === "completed" ? "bubble.left.fill" : "bubble.left"}
                        label="완료 채팅"
                        onPress={() => setTab("completed")}
                    />
                    <TabButton
                        active={tab === "notes"}
                        iconName={tab === "notes" ? "book.fill" : "book"}
                        label="독서장"
                        onPress={() => setTab("notes")}
                    />
                </View>

                <View style={styles.divider} />

                {/* 리스트 */}
                <FlatList
                    data={data as any[]}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }: any) => {
                        if (tab === "liked") return <LikedRow item={item as Book} />;
                        if (tab === "completed") return <CompletedRow item={item as CompletedChat} />;
                        return <NoteRow item={item as Note} />;
                    }}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                    contentContainerStyle={{ paddingBottom: tab === "notes" ? 110 : 30 }}
                />

                {/* 독서장 + 버튼 (독서장 탭에서만) */}
                {tab === "notes" && (
                    <Pressable
                        onPress={() => router.push("/(profile)/note-create")}
                        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
                    >
                        <Text style={styles.fabPlus}>+</Text>
                    </Pressable>
                )}
            </View>
        </>
    );
}

function TabButton({
                       active,
                       iconName,
                       label,
                       onPress,
                   }: {
    active: boolean;
    iconName: IconSymbolName;
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
            <IconSymbol name={iconName} size={18} color={COLORS.primary} />
            <Text style={styles.tabLabel}>{label}</Text>
        </Pressable>
    );
}

function LikedRow({ item }: { item: Book }) {
    return (
        <View style={styles.row}>
            <Image source={BOOK_COVER} style={styles.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.author}</Text>
            </View>
        </View>
    );
}

function CompletedRow({ item }: { item: CompletedChat }) {
    return (
        <View style={styles.row}>
            <Image source={BOOK_COVER} style={styles.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{item.subtitle}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <IconSymbol name="person" size={14} color={COLORS.primary} />
                        <Text style={styles.metaText}>{item.peopleText}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <IconSymbol name="clock" size={14} color={COLORS.primary} />
                        <Text style={styles.metaText}>{item.timeText}</Text>
                    </View>
                </View>

                {item.isDone && (
                    <View style={styles.doneRow}>
                        <View style={styles.doneDot} />
                        <Text style={styles.doneText}>완료</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

function NoteRow({ item }: { item: Note }) {
    return (
        <View style={styles.row}>
            <Image source={BOOK_COVER} style={styles.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.bookTitle}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                    “{item.quote}”
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.bg },

    topTabs: {
        flexDirection: "row",
        backgroundColor: COLORS.bg,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    tabBtnActive: {
        backgroundColor: "#fff",
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: "900",
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },

    row: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.bg,
    },
    thumb: {
        width: 46,
        height: 62,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.secondary,
    },
    title: {
        fontSize: 14,
        fontWeight: "900",
        color: COLORS.primary,
    },
    sub: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.neutralDark,
    },

    metaRow: {
        marginTop: 8,
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 11,
        fontWeight: "800",
        color: COLORS.primary,
    },

    doneRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    doneDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E53935",
    },
    doneText: {
        fontSize: 11,
        fontWeight: "900",
        color: "#E53935",
    },

    sep: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 16,
    },

    fab: {
        position: "absolute",
        right: 22,
        bottom: Platform.OS === "ios" ? 26 : 22,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    fabPlus: {
        fontSize: 28,
        fontWeight: "900",
        color: COLORS.bg,
        marginTop: -2,
    },
});