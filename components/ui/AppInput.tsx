import React, { forwardRef } from "react";
import { TextInput, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { COLORS } from "@/constants/colors";

type Props = TextInputProps & {
    containerStyle?: ViewStyle;
};

const AppInput = forwardRef<TextInput, Props>(({ style, ...rest }, ref) => {
    return (
        <TextInput
            ref={ref}
            {...rest}
            placeholderTextColor={COLORS.muted}
            style={[styles.input, style]}
        />
    );
});

AppInput.displayName = "AppInput";
export default AppInput;

const styles = StyleSheet.create({
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        paddingHorizontal: 14,
        fontSize: 16,
        backgroundColor: COLORS.white,
    },
});