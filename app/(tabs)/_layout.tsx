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
                    borderTopWidth: 0,
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
                    title: "Profile",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
                }}
            />

            {/* 혹시 (tabs) 폴더 안에 다른 화면이 있어도 탭에 안 나오게 숨김 */}
            <Tabs.Screen name="library" options={{ href: null }} />
            <Tabs.Screen name="note-create" options={{ href: null }} />
            <Tabs.Screen name="reading-preference" options={{ href: null }} />
            <Tabs.Screen name="homesearch" options={{ href: null }} />
            <Tabs.Screen name="homesearchresult" options={{ href: null }} />
            <Tabs.Screen name="resultdetails" options={{ href: null }} />
        </Tabs>
    );
}