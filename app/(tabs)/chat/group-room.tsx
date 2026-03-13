import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDiscussionMessages } from "@/services/api";
import {
    createDiscussionSocket,
    publishDiscussionChat,
} from "@/services/groupSocket";

export default function GroupRoom() {
    const { roomId } = useLocalSearchParams();

    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState("");

    const clientRef = useRef<any>(null);

    async function getCurrentUser() {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) return null;
        return JSON.parse(userStr);
    }

    useEffect(() => {
        async function init() {
            const history = await getDiscussionMessages(Number(roomId));
            if (history.success) setMessages(history.data);

            const client = createDiscussionSocket({
                roomId: Number(roomId),
                onMessage: (msg: any) => {
                    setMessages((prev) => [...prev, msg]);
                },
            });

            clientRef.current = client;
        }

        init();
    }, []);

    async function send() {
        const user = await getCurrentUser();
        if (!user || !text.trim()) return;

        publishDiscussionChat(clientRef.current, Number(roomId), {
            discussionRoomId: Number(roomId),
            type: "CHAT",
            content: text,
            sender: {
                id: user.id,
                userId: user.userId,
                nickname: user.nickname,
            },
        });

        setText("");
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item, i) => i.toString()}
                renderItem={({ item }) => (
                    <Text>
                        {item.sender?.nickname}: {item.content}
                    </Text>
                )}
            />

            <TextInput
                value={text}
                onChangeText={setText}
                style={styles.input}
                placeholder="메시지 입력"
            />

            <Pressable style={styles.button} onPress={send}>
                <Text style={styles.buttonText}>전송</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        marginTop: 10,
        borderRadius: 8,
    },
    button: {
        backgroundColor: "#222",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: "center",
    },
    buttonText: { color: "#fff" },
});