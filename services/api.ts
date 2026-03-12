import { API_BASE_URL } from "../constants/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        credentials: "include",
        ...options,
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
        const message =
            typeof data === "object" && data && "message" in data
                ? String((data as { message?: string }).message)
                : "요청에 실패했습니다.";
        throw new Error(message);
    }

    return data as T;
}

export async function login(userId: string, password: string) {
    return apiFetch<{
        success: boolean;
        message: string;
        id: number;
        userId: string;
        name: string;
        nickname: string;
        email: string;
        role: string;
        surveyCompleted: boolean;
    }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            userId,
            password,
            rememberMe: false,
        }),
    });
}

export async function getMyProfile(userId: number) {
    return apiFetch<{
        success: boolean;
        data: {
            id: number;
            userId: string;
            nickname: string;
            email: string;
            profileImage: string | null;
            createdAt: string;
            genres: string[];
            readingStyles: string[];
        };
    }>(`/api/mypage/profile?userId=${userId}`);
}

export async function getWishlist(userId: number) {
    return apiFetch<{
        success: boolean;
        count: number;
        data: Array<{
            id: number;
            userId: number;
            bookIsbn: string;
            bookTitle: string;
            author?: string;
            coverImage?: string;
            publisher?: string;
            createdAt?: string;
        }>;
    }>(`/api/mypage/wishlist/${userId}`);
}

export async function getReadingNotes(userId: number) {
    return apiFetch<{
        success: boolean;
        count: number;
        data: Array<{
            id: number;
            userId: number;
            bookIsbn: string;
            bookTitle: string;
            author?: string;
            coverImage?: string;
            publisher?: string;
            memorableQuote?: string;
            createdAt?: string;
            updatedAt?: string;
        }>;
    }>(`/api/mypage/reading-notes/${userId}`);
}

export async function getReadCompletions(userId: number) {
    return apiFetch<{
        success: boolean;
        count: number;
        data: Array<{
            id: number;
            bookIsbn: string;
            bookTitle: string;
            bookAuthor?: string;
            bookCover?: string;
            completionType: "AI_CHAT" | "GROUP_CHAT";
            completedAt?: string;
        }>;
    }>(`/api/read-completions?userId=${userId}`);
}

export async function sendEmailCode(email: string) {
    return apiFetch<{ success: boolean; message: string }>(
        "/api/auth/email/send-code",
        {
            method: "POST",
            body: JSON.stringify({ email }),
        }
    );
}

export async function verifyEmailCode(email: string, code: string) {
    return apiFetch<{ success: boolean; message: string }>(
        "/api/auth/email/verify-code",
        {
            method: "POST",
            body: JSON.stringify({ email, code }),
        }
    );
}

export async function join(params: {
    userId: string;
    password: string;
    passwordConfirm: string;
    name: string;
    nickname: string;
    email: string;
}) {
    return apiFetch<{
        success: boolean;
        message: string;
        id: number;
        userId: string;
    }>("/api/auth/join", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function savePreferences(params: {
    genres: string[];
    readingStyles: string[];
}) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: unknown;
    }>("/api/preferences", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function getThinkingStyleStats(year?: number | null, month?: number | null) {
    const params = new URLSearchParams();

    if (year != null) params.append("year", String(year));
    if (month != null) params.append("month", String(month));

    const query = params.toString();

    return apiFetch<{
        success: boolean;
        data: {
            critic: number;
            emotion: number;
            analysis: number;
            empathy: number;
            creative: number;
        };
    }>(`/api/analytics/thinking-style${query ? `?${query}` : ""}`);
}

export async function getActivityStats(year?: number | null, month?: number | null) {
    const params = new URLSearchParams();

    if (year != null) params.append("year", String(year));
    if (month != null) params.append("month", String(month));

    const query = params.toString();

    return apiFetch<{
        success: boolean;
        data: Array<{
            hour: number;
            messageCount: number;
            charCount: number;
            participationScore: number;
        }>;
    }>(`/api/analytics/activity${query ? `?${query}` : ""}`);
}

export async function getEmotionGenreStats(paramsObj: {
    mode: "EMOTION_TO_GENRE" | "GENRE_TO_EMOTION";
    emotionId?: number;
    genre?: string;
    year?: number | null;
    month?: number | null;
}) {
    const params = new URLSearchParams();

    params.append("mode", paramsObj.mode);

    if (paramsObj.emotionId != null) {
        params.append("emotionId", String(paramsObj.emotionId));
    }

    if (paramsObj.genre) {
        params.append("genre", paramsObj.genre);
    }

    if (paramsObj.year != null) {
        params.append("year", String(paramsObj.year));
    }

    if (paramsObj.month != null) {
        params.append("month", String(paramsObj.month));
    }

    return apiFetch<{
        success: boolean;
        data: {
            mode: string;
            emotionId?: number | null;
            genre?: string | null;
            slices: Array<{
                label: string;
                value: number;
            }>;
        };
    }>(`/api/analytics/emotion-genre?${params.toString()}`);
}

// ================================================================
// AI 채팅 관련 타입
// ================================================================

export interface AiRoomSummary {
    roomId: number;
    status: "IN_PROGRESS" | "FINISHED";
    lastMessageAt?: string;
    bookId: number;
    title: string;
    coverUrl?: string;
    genre?: string;
}

export interface AiMessage {
    id: number;
    roomId: number;
    sender: "ME" | "AI";
    text: string;
    createdAt: string;
}

export interface AiMessageApi {
    messageId: number;
    role: "USER" | "AI";
    content: string;
    createdAt: string;
}

export interface BookSearchItem {
    title: string;
    isbn: string;
    authors: string[];
    publisher: string;
    thumbnail: string;
    contents: string;
}

// ================================================================
// AI 채팅 API
// ================================================================

export async function searchBooks(query: string, page = 1, size = 10) {
    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size),
    });

    return apiFetch<{
        query: string;
        page: number;
        size: number;
        isEnd: boolean;
        totalCount: number;
        items: BookSearchItem[];
    }>(`/api/books/search?${params.toString()}`);
}

export async function createAiRoom(params: {
    isbn: string;
    title: string;
    coverUrl?: string;
    genre?: string;
    authorText?: string;
    publisher?: string;
    emotionId: number;
}) {
    return apiFetch<{
        success: boolean;
        roomId: number;
    }>("/api/aichat/rooms", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function getAiRooms() {
    return apiFetch<{
        success: boolean;
        data: AiRoomSummary[];
    }>("/api/aichat/rooms");
}

export async function sendAiMessage(roomId: number, content: string) {
    return apiFetch<{
        success: boolean;
        data: AiMessageApi;  // ← userMessage/aiMessage 객체가 아니라 단일 MessageResponse
    }>(`/api/aichat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

export async function getAiMessages(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: AiMessageApi[];
    }>(`/api/aichat/rooms/${roomId}/messages`);
}

export async function startAiSession(roomId: number) {
    return apiFetch<{ success: boolean; sessionId: number }>(
        `/api/aichat/rooms/${roomId}/session/start`,
        { method: "POST" }
    );
}

export async function saveAiSession(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: {
            roomId: number;
            critic: number;
            emotion: number;
            analysis: number;
            empathy: number;
            creative: number;
            createdAt: string;
        };
    }>(`/api/aichat/rooms/${roomId}/end-session`, {
        method: "POST",
    });
}

export async function finishAiSession(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: {
            roomId: number;
            critic: number;
            emotion: number;
            analysis: number;
            empathy: number;
            creative: number;
            createdAt: string;
        };
    }>(`/api/aichat/rooms/${roomId}/finish-session`, {
        method: "POST",
    });
}