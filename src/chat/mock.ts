import { AiRoom, ChatMessage, GroupRoom } from "./types";

export const mockAiRooms: AiRoom[] = [
    {
        id: "ai-1",
        bookTitle: "1퍼센트 부자들의 법칙",
        author: "사토 후미아키",
        coverUrl: "https://image.yes24.com/goods/123456/XL",
        mood: 4,
        createdAt: new Date().toISOString(),
        lastMessage: "마지막 대화…",
        status: "IN_PROGRESS",
    },
];

export const mockGroupRooms: GroupRoom[] = [
    {
        id: "g-1",
        bookTitle: "1퍼센트 부자들의 법칙",
        author: "사토 후미아키",
        coverUrl: "https://image.yes24.com/goods/123456/XL",
        topic: "주인공 감정에 대해 토론해요",
        startAt: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
        durationMin: 120,
        maxPeople: 4,
        joinedPeople: 2,
        status: "IN_PROGRESS", // ✅ 종료 전까지 진행중
        mood1: "",
        mood2: "",
        mood3: "",
        mood4: "",
    },
    {
        id: "g-ended",
        bookTitle: "종료된 방 예시",
        author: "누군가",
        topic: "종료된 방은 숨겨야 함",
        startAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        durationMin: 60,
        maxPeople: 4,
        joinedPeople: 4,
        status: "ENDED", // ✅ 리스트에서 안 보이게
        mood1: "",
        mood2: "",
        mood3: "",
        mood4: "",
    },
];

export const mockMessages: ChatMessage[] = [
    {
        id: "m1",
        roomId: "ai-1",
        sender: "AI",
        text: "안녕하세요! 오늘은 어떤 기분으로 이 책을 읽고 있나요?",
        createdAt: new Date().toISOString(),
    },
    {
        id: "m2",
        roomId: "ai-1",
        sender: "ME",
        text: "오늘은 꽤 좋은 기분이에요.",
        createdAt: new Date().toISOString(),
    },
    {
        id: "gm1",
        roomId: "g-1",
        sender: "USER",
        senderName: "주미님",
        text: "저는 주인공 감정이 이해가 됐어요.",
        createdAt: new Date().toISOString(),
    },
];
// 백엔드 붙이기 전까지: 더미