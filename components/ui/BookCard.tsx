import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { COLORS } from "@/constants/colors";
import BookActionButtons from "./BookActionButtons";

export type Book = {
    id: string;
    title: string;
    author: string;
    desc: string;
    coverUrl: string;
};

type Props = {
    book: Book;
    onPress?: () => void;
    showButtons?: boolean;
    variant?: "card" | "flat";
};

export default function BookCard({ book, onPress, showButtons, variant = "card" }: Props) {
    const containerStyle = useMemo(
        () => [styles.base, variant === "card" ? styles.card : styles.flat],
        [variant]
    );

    return (
        <Pressable onPress={onPress} style={containerStyle}>
            <View style={styles.row}>
                <Image source={{ uri: book.coverUrl }} style={styles.cover} />
                <View style={styles.meta}>
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>{book.author}</Text>
                    <Text style={styles.desc}>{book.desc}</Text>
                </View>
            </View>

            {showButtons && <BookActionButtons />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: { borderRadius: 10, padding: 12 },
    card: { backgroundColor: COLORS.white },
    flat: { backgroundColor: "transparent", padding: 0 },

    row: { flexDirection: "row", gap: 12 },
    cover: { width: 54, height: 74, borderRadius: 10 },
    meta: { flex: 1, gap: 4 },

    title: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
    author: { fontSize: 12, fontWeight: "700", color: COLORS.muted },
    desc: { fontSize: 12, color: COLORS.primary },
});