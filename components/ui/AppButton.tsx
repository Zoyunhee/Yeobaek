import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "@/constants/colors";

type Props = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
    style?: ViewStyle;
};

export default function AppButton({
                                      title,
                                      onPress,
                                      variant = "primary",
                                      disabled,
                                      style,
                                  }: Props) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.base,
                variant === "primary" ? styles.primary : styles.secondary,
                (pressed || disabled) && styles.pressed,
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    variant === "primary" ? styles.primaryText : styles.secondaryText,
                ]}
            >
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        height: 48,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.secondary,
    },
    pressed: {
        opacity: 0.85,
    },
    text: {
        fontSize: 15,
        fontWeight: "700",
    },
    primaryText: {
        color: COLORS.white,
    },
    secondaryText: {
        color: COLORS.primary,
    },
});