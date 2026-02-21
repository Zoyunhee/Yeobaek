import React from "react";
import { Stack } from "expo-router";
import { COLORS } from "@/constants/colors";

export default function ProfileStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: COLORS.bg },
                headerTitleStyle: { color: COLORS.primary, fontWeight: "900" },
                contentStyle: { backgroundColor: COLORS.bg },
            }}
        />
    );
}