// src/chat/types.ts
export type ChatMessageSender = "ME" | "AI" | "USER";
export type RoomStatus = "IN_PROGRESS" | "ENDED";

export type AiRoom = {
    id: string;
    bookTitle: string;
    author: string;
    coverUrl?: string;

    mood: number;            // ✅ 0~5
    createdAt: string;       // ISO
    lastAt?: string;         // ISO
    lastMessage?: string;
    status: RoomStatus;
};

export type GroupRoom = {
    id: string;
    bookTitle: string;
    author: string;
    coverUrl?: string;

    topic: string;

    mood1: string;
    mood2: string;
    mood3: string;
    mood4: string;

    startAt: string; // ISO
    durationMin: number;
    maxPeople: number;
    joinedPeople: number;

    status: RoomStatus;
};

export type ChatMessage = {
    id: string;
    roomId: string;
    sender: ChatMessageSender;
    text: string;
    createdAt: string; // ISO
    senderName?: string;
};