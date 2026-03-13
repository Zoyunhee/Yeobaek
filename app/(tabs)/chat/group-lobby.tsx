import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    joinDiscussionRoom,
    leaveDiscussionRoom,
    toggleDiscussionReady,
    getDiscussionParticipants,
} from "@/services/api";

export default function GroupLobbyScreen() {
    const { roomId } = useLocalSearchParams();
    const router = useRouter();

    const [participants, setParticipants] = useState<any[]>([]);

    async function getCurrentUser() {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return null;
        return JSON.parse(userStr);
    }

    async function loadParticipants() {
        const res = await getDiscussionParticipants(Number(roomId));
        if (res.success) {
            setParticipants(res.data);
        }
    }

    useEffect(() => {
        async function init() {
            const user = await getCurrentUser();
            if (!user) return;

            await joinDiscussionRoom(Number(roomId), user.id);
            loadParticipants();
        }

        init();
    }, []);

    async function handleReady() {
        const user = await getCurrentUser();
        if (!user) return;

        await toggleDiscussionReady(Number(roomId), user.id);
        loadParticipants();
    }

    async function handleLeave() {
        const user = await getCurrentUser();
        if (!user) return;

        await leaveDiscussionRoom(Number(roomId), user.id);
        router.back();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>대기방</Text>

            <FlatList
                data={participants}
                keyExtractor={(item) => String(item.userId)}
                renderItem={({ item }) => (
                    <Text>
                        {item.nickname} {item.isReady ? "READY" : ""}
                    </Text>
                )}
            />

            <Pressable style={styles.button} onPress={handleReady}>
                <Text style={styles.buttonText}>READY</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={handleLeave}>
                <Text style={styles.buttonText}>나가기</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, marginBottom: 20 },
    button: {
        marginTop: 12,
        backgroundColor: "#222",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff" },
});