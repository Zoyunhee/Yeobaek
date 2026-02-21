// src/chat/store.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { AiRoom, ChatMessage, GroupRoom, RoomStatus } from "./types";

const nowIso = () => new Date().toISOString();

// ---- 더미 데이터 ----
const seedAiRooms: AiRoom[] = [
    {
        id: "ai-1",
        bookTitle: "1퍼센트 부자들의 법칙",
        author: "사토 후미아키",
        coverUrl: "https://image.yes24.com/goods/123456/XL",
        mood: 4,
        createdAt: nowIso(),
        lastAt: nowIso(),
        lastMessage: "마지막 대화…",
        status: "IN_PROGRESS",
    },
];

const seedGroupRooms: GroupRoom[] = [
    {
        id: "g-1",
        bookTitle: "1퍼센트 부자들의 법칙",
        author: "사토 후미아키",
        coverUrl: "https://image.yes24.com/goods/123456/XL",
        topic: "주인공 감정에 대해 토론해요",
        mood1: "스포일러 없음",
        mood2: "따뜻하게",
        mood3: "서로 존중 / 끼어들기 금지",
        mood4: "자유 토론 / 턴제",
        startAt: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
        durationMin: 120,
        maxPeople: 4,
        joinedPeople: 1,
        status: "IN_PROGRESS",
    },
];

const seedMessages: ChatMessage[] = [
    {
        id: "m1",
        roomId: "ai-1",
        sender: "AI",
        text: "안녕하세요! 오늘은 어떤 기분으로 이 책을 읽고 있나요?",
        createdAt: nowIso(),
    },
    {
        id: "m2",
        roomId: "ai-1",
        sender: "ME",
        text: "오늘은 꽤 좋은 기분이에요.",
        createdAt: nowIso(),
    },
    {
        id: "gm1",
        roomId: "g-1",
        sender: "USER",
        senderName: "주미님",
        text: "저는 주인공 감정이 이해가 됐어요.",
        createdAt: nowIso(),
    },
];

// ---- Store 타입 ----
type CreateAiRoomInput = {
    bookTitle: string;
    author: string;
    coverUrl?: string;
    mood: number; // 0~5
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

    // ✅ AI 채팅 생성
    createAiRoom: (input: CreateAiRoomInput) => AiRoom;

    addMessage: (input: { roomId: string; sender: ChatMessage["sender"]; text: string; senderName?: string }) => void;

    updateAiRoomStatus: (roomId: string, status: RoomStatus) => void;

    createGroupRoom: (input: CreateGroupRoomInput) => GroupRoom;
    updateGroupRoomStatus: (roomId: string, status: RoomStatus) => void;
    setGroupJoinedPeople: (roomId: string, joinedPeople: number) => void;
};

const ChatContext = createContext<Store | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [aiRooms, setAiRooms] = useState<AiRoom[]>(seedAiRooms);
    const [groupRooms, setGroupRooms] = useState<GroupRoom[]>(seedGroupRooms);
    const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);

    const store = useMemo<Store>(() => {
        return {
            aiRooms,
            groupRooms,
            messages,

            // ✅ createAiRoom 구현
            createAiRoom: (input) => {
                const t = nowIso();
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
                    createdAt: nowIso(),
                };
                setMessages((prev) => [...prev, msg]);

                // ✅ AI 방 마지막 대화/시간 업데이트
                setAiRooms((prev) =>
                    prev.map((r) => (r.id === roomId ? { ...r, lastAt: msg.createdAt, lastMessage: msg.text } : r))
                );
            },

            updateAiRoomStatus: (roomId, status) => {
                setAiRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status } : r)));
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
                setGroupRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status } : r)));
            },

            setGroupJoinedPeople: (roomId, joinedPeople) => {
                setGroupRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, joinedPeople } : r)));
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