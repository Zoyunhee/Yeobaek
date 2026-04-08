import React, { createContext, useContext, useMemo, useState } from "react";
import { AiRoom, ChatMessage, GroupRoom, RoomStatus } from "./types";

type CreateAiRoomInput = {
    bookTitle: string;
    author: string;
    coverUrl?: string;
    mood: number;
};

type CreateGroupRoomInput = {
    bookTitle: string;
    author: string;
    coverUrl?: string;
    topic: string;
    mood1: string;
    mood2: string;
    mood3: string;
    mood4: string;
    startAtISO: string;
    durationMin: number;
    maxPeople: number;
};

type Store = {
    aiRooms: AiRoom[];
    groupRooms: GroupRoom[];
    messages: ChatMessage[];

    createAiRoom: (input: CreateAiRoomInput) => AiRoom;
    addMessage: (input: {
        roomId: string;
        sender: ChatMessage["sender"];
        text: string;
        senderName?: string;
    }) => void;

    updateAiRoomStatus: (roomId: string, status: RoomStatus) => void;

    createGroupRoom: (input: CreateGroupRoomInput) => GroupRoom;
    updateGroupRoomStatus: (roomId: string, status: RoomStatus) => void;
    setGroupJoinedPeople: (roomId: string, joinedPeople: number) => void;
};

const ChatContext = createContext<Store | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [aiRooms, setAiRooms] = useState<AiRoom[]>([]);
    const [groupRooms, setGroupRooms] = useState<GroupRoom[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const store = useMemo<Store>(() => {
        return {
            aiRooms,
            groupRooms,
            messages,

            createAiRoom: (input) => {
                const t = new Date().toISOString();
                const room: AiRoom = {
                    id: `ai-${Date.now()}`,
                    bookTitle: input.bookTitle,
                    author: input.author,
                    coverUrl: input.coverUrl,
                    mood: Math.max(0, Math.min(5, Number(input.mood) || 0)),
                    createdAt: t,
                    lastAt: t,
                    lastMessage: "",
                    status: "IN_PROGRESS",
                };
                setAiRooms((prev) => [room, ...prev]);
                return room;
            },

            addMessage: ({ roomId, sender, text, senderName }) => {
                const msg: ChatMessage = {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    roomId,
                    sender,
                    senderName,
                    text,
                    createdAt: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, msg]);

                setAiRooms((prev) =>
                    prev.map((r) =>
                        r.id === roomId
                            ? { ...r, lastAt: msg.createdAt, lastMessage: msg.text }
                            : r
                    )
                );
            },

            updateAiRoomStatus: (roomId, status) => {
                setAiRooms((prev) =>
                    prev.map((r) => (r.id === roomId ? { ...r, status } : r))
                );
            },

            createGroupRoom: (input) => {
                const room: GroupRoom = {
                    id: `g-${Date.now()}`,
                    bookTitle: input.bookTitle,
                    author: input.author,
                    coverUrl: input.coverUrl,
                    topic: input.topic,
                    mood1: input.mood1,
                    mood2: input.mood2,
                    mood3: input.mood3,
                    mood4: input.mood4,
                    startAt: input.startAtISO,
                    durationMin: input.durationMin,
                    maxPeople: input.maxPeople,
                    joinedPeople: 1,
                    status: "IN_PROGRESS",
                };

                setGroupRooms((prev) => [room, ...prev]);
                return room;
            },

            updateGroupRoomStatus: (roomId, status) => {
                setGroupRooms((prev) =>
                    prev.map((r) => (r.id === roomId ? { ...r, status } : r))
                );
            },

            setGroupJoinedPeople: (roomId, joinedPeople) => {
                setGroupRooms((prev) =>
                    prev.map((r) => (r.id === roomId ? { ...r, joinedPeople } : r))
                );
            },
        };
    }, [aiRooms, groupRooms, messages]);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatStore must be used within ChatProvider");
    return ctx;
}

/// 임시 보관용