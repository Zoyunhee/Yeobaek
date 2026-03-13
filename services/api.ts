import { API_BASE_URL } from "../constants/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const res = await fetch(url, {
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

    console.log("[apiFetch]", {
        method: options.method ?? "GET",
        url,
        status: res.status,
        data,
    });

    if (!res.ok) {
        const message =
            typeof data === "object" && data && "message" in data
                ? String((data as { message?: string }).message)
                : `요청 실패 (${res.status})`;

        throw new Error(message);
    }

    return data as T;
}

/* =========================
   인증
========================= */

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

export async function logout() {
    return apiFetch<{ success: boolean; message: string }>("/api/auth/logout", {
        method: "POST",
    });
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

/* =========================
   취향 설정
========================= */

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

/* =========================
   마이페이지 / 프로필
========================= */

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

export async function updateNickname(userId: number, nickname: string) {
    return apiFetch<{
        success: boolean;
        message: string;
        nickname: string;
    }>(`/api/mypage/profile/nickname?userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify({ nickname }),
    });
}

export async function updatePassword(
    userId: number,
    params: {
        currentPassword: string;
        newPassword: string;
        newPasswordConfirm: string;
    }
) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/mypage/profile/password?userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify(params),
    });
}

export async function uploadProfileImage(userId: number, imageUri: string) {
    const formData = new FormData();

    formData.append(
        "profileImage",
        {
            uri: imageUri,
            name: "profile.jpg",
            type: "image/jpeg",
        } as any
    );

    const url = `${API_BASE_URL}/api/mypage/profile/image?userId=${userId}`;

    const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        body: formData,
    });

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    console.log("[uploadProfileImage]", {
        url,
        status: res.status,
        data,
    });

    if (!res.ok) {
        const message =
            typeof data === "object" && data && "message" in data
                ? String((data as { message?: string }).message)
                : `요청 실패 (${res.status})`;

        throw new Error(message);
    }

    return data as {
        success: boolean;
        message: string;
        imageUrl: string;
    };
}

export async function deleteProfileImage(userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/mypage/profile/image?userId=${userId}`, {
        method: "DELETE",
    });
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

export async function createReadingNote(params: {
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    author?: string;
    coverImage?: string;
    publisher?: string;
    memorableQuote: string;
}) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: {
            id: number;
            userId: number;
            bookIsbn: string;
            bookTitle: string;
            memorableQuote: string;
            createdAt: string;
        };
    }>("/api/mypage/reading-notes", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function updateReadingNote(
    noteId: number,
    userId: number,
    memorableQuote: string
) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: unknown;
    }>(`/api/mypage/reading-notes/${noteId}?userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify({ memorableQuote }),
    });
}

export async function deleteReadingNote(noteId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/mypage/reading-notes/${noteId}?userId=${userId}`, {
        method: "DELETE",
    });
}

/* =========================
   찜
========================= */

export async function addWishlist(params: {
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    author?: string;
    coverImage?: string;
    publisher?: string;
}) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: {
            id: number;
            userId: number;
            bookIsbn: string;
            bookTitle: string;
            author?: string;
            coverImage?: string;
            publisher?: string;
            createdAt?: string;
        };
    }>("/api/mypage/wishlist", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

export async function removeWishlistById(wishlistId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/mypage/wishlist/${wishlistId}?userId=${userId}`, {
        method: "DELETE",
    });
}

export async function removeWishlistByIsbn(userId: number, bookIsbn: string) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/mypage/wishlist/isbn/${bookIsbn}?userId=${userId}`, {
        method: "DELETE",
    });
}

export async function checkWishlist(userId: number, bookIsbn: string) {
    const params = new URLSearchParams({
        userId: String(userId),
        bookIsbn,
    });

    return apiFetch<{
        success: boolean;
        isWishlisted: boolean;
    }>(`/api/mypage/wishlist/check?${params.toString()}`);
}

/* =========================
   책 관련
========================= */

export interface BookSearchItem {
    title: string;
    isbn: string;
    authors: string[];
    publisher: string;
    thumbnail: string;
    contents: string;
    genre?: string;
}

export interface BookGenreResponse {
    isbn: string;
    rawCategoryId?: number | null;
    rawCategoryName?: string | null;
    genre: string;
}

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

export async function getBookGenre(isbn: string) {
    const params = new URLSearchParams({ isbn });

    return apiFetch<{
        success: boolean;
        data: BookGenreResponse;
    }>(`/api/books/genre?${params.toString()}`);
}

export async function saveBook(params: {
    isbn: string;
    title: string;
    authors?: string[];
    publisher?: string;
    thumbnail?: string;
    genre?: string;
}) {
    return apiFetch<number>("/api/books", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

/* =========================
   분석/감정 관련
========================= */

export async function saveEmotionLog(params: {
    roomId: number;
    emotionId: number;
    selectedAt?: string;
}) {
    return apiFetch<{
        success: boolean;
        data: {
            id: number;
            roomId: number;
            userId: number;
            emotionId: number;
            selectedAt: string;
        };
    }>("/api/analytics/emotions", {
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

/* =========================
   AI 채팅 관련
========================= */

export interface AiRoomSummary {
    roomId: number;
    status: "IN_PROGRESS" | "FINISHED";
    lastMessageAt?: string;
    displayTime?: string;
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

export async function getAiRooms(status?: "IN_PROGRESS" | "FINISHED") {
    const query = status ? `?status=${status}` : "";
    return apiFetch<{
        success: boolean;
        data: AiRoomSummary[];
    }>(`/api/aichat/rooms${query}`);
}

export async function discardAiRoom(roomId: number) {
    return apiFetch<void>(`/api/aichat/rooms/${roomId}/discard`, {
        method: "DELETE",
    });
}

export async function sendAiMessage(roomId: number, content: string) {
    return apiFetch<{
        success: boolean;
        data: AiMessageApi;
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
            id?: number;
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
            id?: number;
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

/* =========================
   홈 화면 API
========================= */

export interface RecommendedBook {
    title: string;
    authors: string[];
    publisher: string;
    thumbnail: string;
    isbn: string;
    price: number;
    description: string;
    matchScore: number;
    matchReason: string;
}

export type BestsellerBook = {
    isbn?: string;
    isbn13?: string;
    title?: string;
    author?: string;
    authors?: string[];
    publisher?: string;
    description?: string;
    cover?: string;
    thumbnail?: string;
    rank?: number;
};

export interface DailyQuiz {
    quizId: number;
    question: string;
    options: string[];
    completed: boolean;
}

export async function getRecommendations(userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        recommendations: RecommendedBook[];
    }>(`/api/recommendations/user/${userId}`);
}

export async function getMonthlyBestsellers() {
    return apiFetch<{
        success: boolean;
        data: BestsellerBook[];
    }>("/api/bestsellers/monthly");
}

export async function getTodayQuiz(userId: number) {
    return apiFetch<{
        success: boolean;
        data: DailyQuiz;
    }>(`/api/quiz/today?userId=${userId}`);
}

export async function submitQuizAnswer(userId: number, quizId: number, answer: boolean) {
    return apiFetch<{
        success: boolean;
        message: string;
        correct: boolean;
        explanation?: string;
    }>(`/api/quiz/submit?userId=${userId}`, {
        method: "POST",
        body: JSON.stringify({ quizId, answer }),
    });
}

/* =========================
   그룹 채팅
========================= */

export type DiscussionStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";
export type DiscussionMessageType = "CHAT" | "ENTER" | "LEAVE" | "SYSTEM";

export interface DiscussionRoom {
    id: number;
    bookTitle: string;
    bookAuthor: string;
    description?: string;
    maxParticipants: number;
    currentParticipants: number;
    discussionStartTime: string;
    status: DiscussionStatus;
    discussionRules: string[];
}

export interface DiscussionParticipant {
    userId: number;
    nickname: string;
    role: "HOST" | "PARTICIPANT";
    isReady: boolean;
}

export interface DiscussionMessage {
    discussionRoomId: number;
    type: DiscussionMessageType;
    content: string;
    sender: {
        id: number;
        userId: string;
        nickname: string;
    };
    createdAt?: string;
}

/* 방 목록 */
export async function getDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions");
}

/* 참여 가능한 방 목록 */
export async function getAvailableDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/available");
}

/* 대기중 방 목록 */
export async function getWaitingDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/waiting");
}

/* 진행중 방 목록 */
export async function getInProgressDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/in-progress");
}

/* 방 상세 */
export async function getDiscussionRoom(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}`);
}

/* 방 생성 */
export async function createDiscussionRoom(params: {
    bookTitle: string;
    bookAuthor: string;
    bookIsbn?: string;
    bookCover?: string;
    bookPublisher?: string;
    description?: string;
    maxParticipants: number;
    discussionStartTime: string;
    hostId: number;
    discussionRules: string[];
}) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: DiscussionRoom;
    }>("/api/book-discussions", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

/* 방 참가 */
export async function joinDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}/join?userId=${userId}`, {
        method: "POST",
    });
}

/* 방 퇴장 */
export async function leaveDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}/leave?userId=${userId}`, {
        method: "POST",
    });
}

/* 준비 토글 */
export async function toggleDiscussionReady(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: {
            roomStatus: DiscussionStatus;
            allReady: boolean;
        };
    }>(`/api/book-discussions/${roomId}/ready?userId=${userId}`, {
        method: "POST",
    });
}

/* 강제 시작 */
export async function forceStartDiscussion(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}/force-start?userId=${userId}`, {
        method: "POST",
    });
}

/* 방 종료 */
export async function finishDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}/finish?userId=${userId}`, {
        method: "POST",
    });
}

/* 방 삭제 */
export async function deleteDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}?userId=${userId}`, {
        method: "DELETE",
    });
}

/* 참여자 목록 */
export async function getDiscussionParticipants(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionParticipant[];
    }>(`/api/book-discussions/${roomId}/participants`);
}

/* 메시지 목록 */
export async function getDiscussionMessages(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionMessage[];
    }>(`/api/book-discussions/${roomId}/messages`);
}