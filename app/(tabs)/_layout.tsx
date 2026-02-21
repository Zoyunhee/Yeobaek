import { Tabs } from "expo-router";
import React from "react";
import { COLORS } from "@/constants/colors";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarShowLabel: true,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.primary,
                tabBarStyle: {
                    backgroundColor: COLORS.bg,
                    borderTopWidth: 0, // 라인 제거
                    height: 70,
                    paddingTop: 8,
                    paddingBottom: 10,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: "Chat",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="book" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Proflie",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
                }}
            />

        </Tabs>
    );
}
