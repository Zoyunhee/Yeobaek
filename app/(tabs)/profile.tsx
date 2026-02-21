import React from "react";
import {Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

export default function ProfileScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.primary, fontWeight: "900" }}>Profile</Text>
        </SafeAreaView>
    );
}
