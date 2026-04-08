export type MoodScore = 0 | 1 | 2 | 3 | 4 | 5;
export type ChatMessageSender = "ME" | "AI" | "USER";
export type RoomStatus = "IN_PROGRESS" | "FINISHED";

export type AiRoom = {
    id: string;
    bookTitle: string;
    author: string;
    coverUrl?: string;

    mood: number;
    createdAt: string;
    lastAt?: string;
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

    startAt: string;
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
    createdAt: string;
    senderName?: string;
};