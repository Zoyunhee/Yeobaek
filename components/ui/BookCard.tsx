import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import BookActionButtons from "./BookActionButtons";

export type Book = {
    id: string;
    isbn?: string;
    title: string;
    author: string;
    publisher?: string;
    desc: string;
    coverUrl: string;
};

type Props = {
    book: Book;
    onPress?: () => void;
    showButtons?: boolean;
    variant?: "card" | "flat";
};

export default function BookCard({
                                     book,
                                     onPress,
                                     showButtons,
                                     variant = "card",
                                 }: Props) {
    const containerStyle = useMemo(
        () => [styles.base, variant === "card" ? styles.card : styles.flat],
        [variant]
    );

    const displayAuthor = book.author?.trim()
        ? book.author.trim()
        : (book.publisher?.trim() ?? "");

    return (
        <Pressable onPress={onPress} style={containerStyle}>
            <View style={styles.row}>
                {book.coverUrl ? (
                    <Image source={{ uri: book.coverUrl }} style={styles.cover} />
                ) : (
                    <View style={[styles.cover, styles.coverFallback]}>
                        <Ionicons name="book-outline" size={22} color={COLORS.muted} />
                    </View>
                )}

                <View style={styles.meta}>
                    <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                        {book.title}
                    </Text>

                    {!!displayAuthor && (
                        <Text style={styles.author} numberOfLines={1} ellipsizeMode="tail">
                            {displayAuthor}
                        </Text>
                    )}

                    {!!book.desc && (
                        <Text style={styles.desc} numberOfLines={2} ellipsizeMode="tail">
                            {book.desc}
                        </Text>
                    )}
                </View>
            </View>

            {showButtons && <BookActionButtons book={book} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: { borderRadius: 10, padding: 12 },
    card: { backgroundColor: COLORS.white },
    flat: { backgroundColor: "transparent", padding: 0 },

    row: { flexDirection: "row", gap: 12 },
    cover: {
        width: 54,
        height: 74,
        borderRadius: 10,
        backgroundColor: COLORS.border,
    },
    coverFallback: {
        alignItems: "center",
        justifyContent: "center",
    },

    meta: { flex: 1, gap: 4 },

    title: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
        lineHeight: 21,
    },
    author: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.muted,
    },
    desc: {
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.primary,
        marginTop: 2,
    },
});