import React from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

type Props = {
    value: string;
    placeholder?: string;
    onChangeText: (t: string) => void;
    onSubmit?: () => void;
    onPress?: () => void;
    editable?: boolean;
};

export default function SearchBar({
                                      value,
                                      placeholder = "책 제목, 저자 검색",
                                      onChangeText,
                                      onSubmit,
                                      onPress,
                                      editable = true,
                                  }: Props) {
    const content = (
        <View style={styles.container}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={onSubmit}
                editable={editable}
            />
        </View>
    );

    if (onPress && !editable) return <Pressable onPress={onPress}>{content}</Pressable>;
    return content;
}

const styles = StyleSheet.create({
    container: {
        height: 44,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        paddingVertical: 0,
    },
});
