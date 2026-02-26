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
        >

            <Stack.Screen
                name="settings"
                options={{
                    headerShown: false,
                    presentation: "modal",
                }}
            />

            <Stack.Screen name="name-edit" options={{ headerShown: false }} />
            <Stack.Screen name="password-edit" options={{ headerShown: false }} />
            <Stack.Screen name="profile-photo-edit" options={{ headerShown: false }} />
        </Stack>
    );
}