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
            roomId?: number;
            reviewId?: number;
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

export interface HomeBookSearchItem {
    id?: number;
    isbn: string;
    title: string;
    authors: string[];
    publisher: string;
    publishedDate?: string;
    description?: string;
    thumbnailUrl?: string;
    price?: number;
    salePrice?: number;
    url?: string;
}

export interface BookGenreResponse {
    isbn: string;
    rawCategoryId?: number | null;
    rawCategoryName?: string | null;
    genre: string;
}

export interface SearchKeywordItem {
    keyword: string;
    searchCount: number;
    lastSearchedAt: string;
}

export async function searchBooks(query: string) {
    const params = new URLSearchParams({
        query,
    });

    const res = await apiFetch<{
        success: boolean;
        data: {
            totalResults: number;
            books: Array<{
                title: string;
                author: string;
                publisher: string;
                cover: string;
                isbn13: string;
                categoryName?: string;
                description?: string;
            }>;
        };
    }>(`/api/aladin/books/search?${params.toString()}`);

    return {
        query,
        page: 1,
        size: res.data?.books?.length ?? 0,
        isEnd: true,
        totalCount: res.data?.totalResults ?? 0,
        items: (res.data?.books ?? []).map((book) => ({
            title: book.title,
            isbn: book.isbn13,
            authors: book.author
                ? book.author.split(",").map((v) => v.trim())
                : [],
            publisher: book.publisher,
            thumbnail: book.cover,
            contents: book.description ?? "",
            genre: book.categoryName ?? "",
        })),
    };
}

export async function searchHomeBooks(query: string, page = 1, size = 10) {
    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size),
    });

    return apiFetch<{
        success: boolean;
        data: {
            books: HomeBookSearchItem[];
            currentPage: number;
            pageSize: number;
            totalCount: number;
            isEnd: boolean;
        };
    }>(`/api/home/books/search?${params.toString()}`);
}

export async function getHomeSearchKeywords(limit = 10) {
    return apiFetch<{
        success: boolean;
        data: {
            popularKeywords: SearchKeywordItem[];
            recentKeywords: SearchKeywordItem[];
        };
    }>(`/api/home/books/keywords?limit=${limit}`);
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
    bookId?: number;
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

type AiRoomCreateResponseDto = {
    id?: number;
    roomId?: number;
};

type AIChatMessageResponseDto = {
    id?: number;
    messageId?: number;
    role?: "USER" | "AI" | "SYSTEM";
    sender?: "USER" | "AI" | "SYSTEM";
    content?: string;
    message?: string;
    createdAt?: string;
};

type AIChatExchangeResponseDto = {
    userMessage?: AIChatMessageResponseDto;
    aiMessage?: AIChatMessageResponseDto;
    messages?: AIChatMessageResponseDto[];
    finished?: boolean;
};

function mapAiMessageFromApi(roomId: number, item: AIChatMessageResponseDto): AiMessage {
    const role = item.role ?? item.sender ?? "AI";

    return {
        id: Number(item.id ?? item.messageId ?? Date.now()),
        roomId,
        sender: role === "USER" ? "ME" : "AI",
        text: item.content ?? item.message ?? "",
        createdAt: item.createdAt ?? new Date().toISOString(),
    };
}

export async function createAiRoom(params: {
    userId: number;
    reviewId: number;
    topicId: number;
}) {
    const res = await apiFetch<{
        success?: boolean;
        message?: string;
        data?: AiRoomCreateResponseDto;
    }>("/api/aichat/rooms", {
        method: "POST",
        body: JSON.stringify({
            userId: params.userId,
            reviewId: params.reviewId,
            topicId: params.topicId,
        }),
    });

    return {
        success: res.success ?? true,
        message: res.message,
        roomId: Number(res.data?.roomId ?? res.data?.id ?? 0),
        data: res.data,
    };
}

export async function getAiRooms(status?: "IN_PROGRESS" | "FINISHED") {
    const query = status ? `?status=${status}` : "";

    return apiFetch<{
        success: boolean;
        data: AiRoomSummary[];
    }>(`/api/aichat/rooms${query}`);
}

export async function sendAiMessage(roomId: number, content: string) {
    const res = await apiFetch<{
        success?: boolean;
        message?: string;
        data?: AIChatExchangeResponseDto;
    }>(`/api/aichat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });

    const exchange = res.data;

    const userMessage = exchange?.userMessage
        ? mapAiMessageFromApi(roomId, exchange.userMessage)
        : null;

    const aiMessage = exchange?.aiMessage
        ? mapAiMessageFromApi(roomId, exchange.aiMessage)
        : null;

    const messages = exchange?.messages
        ? exchange.messages.map((item) => mapAiMessageFromApi(roomId, item))
        : [userMessage, aiMessage].filter(Boolean) as AiMessage[];

    return {
        success: res.success ?? true,
        message: res.message,
        data: {
            userMessage,
            aiMessage,
            messages,
            finished: exchange?.finished ?? false,
        },
    };
}

export async function getAiMessages(roomId: number) {
    const res = await apiFetch<{
        success?: boolean;
        data?: AIChatMessageResponseDto[];
    }>(`/api/aichat/rooms/${roomId}/messages`);

    const items = (res.data ?? []).map((item) => mapAiMessageFromApi(roomId, item));

    return {
        success: res.success ?? true,
        data: items,
    };
}

export async function completeDiagnosis(roomId: number) {
    return apiFetch<{
        success?: boolean;
        message?: string;
        data?: unknown;
    }>(`/api/diagnosis/rooms/${roomId}/complete`, {
        method: "POST",
    });
}

/* =========================
   발제문 / 토픽
========================= */

export type ThinkingType =
    | "EMOTION"
    | "ANALYSIS"
    | "CRITICISM"
    | "EMPATHY"
    | "CREATIVITY";

export type TopicRole = "TOP" | "MIDDLE" | "GROWTH";

export type ThinkingAnalysisResult = {
    reviewId: number;
    userId: number;
    emotionScore: number;
    analysisScore: number;
    criticismScore: number;
    empathyScore: number;
    creativityScore: number;
    topType: ThinkingType;
    middleType: ThinkingType;
    growthType: ThinkingType;
};

type TopicResponseDto = {
    id: number;
    reviewId: number;
    userId: number;
    topicRole: TopicRole;
    thinkingType: ThinkingType;
    question: string;
};

export type TopicItem = {
    id: number;
    reviewId: number;
    userId: number;
    topicRole: TopicRole;
    thinkingType: ThinkingType;
    title: string;
    description: string;
    firstQuestion: string;
};

function mapThinkingTypeToLabel(type?: ThinkingType) {
    switch (type) {
        case "EMOTION":
            return "감정";
        case "ANALYSIS":
            return "분석";
        case "CRITICISM":
            return "비평";
        case "EMPATHY":
            return "공감";
        case "CREATIVITY":
            return "창의";
        default:
            return "추천";
    }
}

function mapTopicRoleToLabel(role?: TopicRole) {
    switch (role) {
        case "TOP":
            return "강점";
        case "MIDDLE":
            return "확장";
        case "GROWTH":
            return "성장";
        default:
            return "주제";
    }
}

function mapTopic(dto: TopicResponseDto): TopicItem {
    const typeLabel = mapThinkingTypeToLabel(dto.thinkingType);
    const roleLabel = mapTopicRoleToLabel(dto.topicRole);

    return {
        id: dto.id,
        reviewId: dto.reviewId,
        userId: dto.userId,
        topicRole: dto.topicRole,
        thinkingType: dto.thinkingType,
        title: `${roleLabel} · ${typeLabel}`,
        description: dto.question,
        firstQuestion: dto.question,
    };
}

export async function analyzeReview(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        message?: string;
        data: ThinkingAnalysisResult;
    }>(`/api/thinking-analysis/${reviewId}`, {
        method: "POST",
    });

    return res;
}

export async function getThinkingAnalysis(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: ThinkingAnalysisResult;
    }>(`/api/thinking-analysis/${reviewId}`);

    return res;
}

export async function generateTopics(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        message?: string;
        data: TopicResponseDto[];
    }>(`/api/topics/${reviewId}`, {
        method: "POST",
    });

    return {
        success: res.success,
        message: res.message,
        data: (res.data ?? []).map(mapTopic),
    };
}

export async function getTopics(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: TopicResponseDto[];
    }>(`/api/topics/${reviewId}`);

    return {
        success: res.success,
        data: (res.data ?? []).map(mapTopic),
    };
}

export async function prepareTopics(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        message?: string;
        data: TopicResponseDto[];
    }>(`/api/aichat/reviews/${reviewId}/prepare`, {
        method: "POST",
    });

    return {
        success: res.success,
        message: res.message,
        data: (res.data ?? []).map(mapTopic),
    };
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
    bookIsbn?: string;
    bookCover?: string;
    bookPublisher?: string;
    description?: string;
    maxParticipants: number;
    currentParticipants: number;
    discussionStartTime: string;
    estimatedDurationMinutes?: number;
    estimatedEndTime?: string;
    status: DiscussionStatus;
    discussionRules: string[];
    host?: {
        id: number;
        userId: string;
        nickname: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface DiscussionParticipant {
    userId: number;
    nickname: string;
    role: "HOST" | "PARTICIPANT";
    isReady: boolean;
    joinedAt?: string;
}

export interface DiscussionMessage {
    id?: number;
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

export interface ToggleDiscussionReadyResponse {
    userId?: number;
    nickname?: string;
    isReady: boolean;
    allReady: boolean;
    roomStatus: DiscussionStatus;
    starting?: boolean;
}

export async function getDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions");
}

export async function getAvailableDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/available");
}

export async function getWaitingDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/waiting");
}

export async function getInProgressDiscussionRooms() {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom[];
    }>("/api/book-discussions/in-progress");
}

export async function getDiscussionRoom(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}`);
}

export async function createDiscussionRoom(params: {
    bookTitle: string;
    bookAuthor: string;
    bookIsbn?: string;
    bookCover?: string;
    bookPublisher?: string;
    description?: string;
    maxParticipants: number;
    discussionStartTime: string;
    estimatedDurationMinutes: number;
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

export async function joinDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}/join?userId=${userId}`, {
        method: "POST",
    });
}

export async function leaveDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}/leave?userId=${userId}`, {
        method: "POST",
    });
}

export async function toggleDiscussionReady(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: ToggleDiscussionReadyResponse;
    }>(`/api/book-discussions/${roomId}/ready?userId=${userId}`, {
        method: "POST",
    });
}

export async function forceStartDiscussion(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
        data: DiscussionRoom;
    }>(`/api/book-discussions/${roomId}/force-start?userId=${userId}`, {
        method: "POST",
    });
}

export async function finishDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}/finish?userId=${userId}`, {
        method: "POST",
    });
}

export async function deleteDiscussionRoom(roomId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-discussions/${roomId}?userId=${userId}`, {
        method: "DELETE",
    });
}

export async function getDiscussionParticipants(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionParticipant[];
    }>(`/api/book-discussions/${roomId}/participants`);
}

export async function getDiscussionMessages(roomId: number) {
    return apiFetch<{
        success: boolean;
        data: DiscussionMessage[];
    }>(`/api/book-discussions/${roomId}/messages`);
}

/* =========================
   자가진단
========================= */

export async function getAvailableGenres() {
    return apiFetch<{
        success: boolean;
        data: string[];
    }>("/api/books/genres");
}

/* =========================
   독후감
========================= */

type BookReviewDto = {
    id: number;
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    bookAuthor?: string;
    bookCover?: string;
    bookPublisher?: string;
    bookCategory?: string;
    bookDescription?: string;
    content?: string;
    rating?: number | null;
    createdAt?: string;
    updatedAt?: string;
};

export type BookReviewItem = {
    id: number;
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    author?: string;
    coverImage?: string;
    publisher?: string;
    bookCategory?: string;
    bookDescription?: string;
    content?: string;
    rating?: number | null;
    createdAt?: string;
    updatedAt?: string;
};

function mapBookReview(dto: BookReviewDto): BookReviewItem {
    return {
        id: dto.id,
        userId: dto.userId,
        bookIsbn: dto.bookIsbn,
        bookTitle: dto.bookTitle,
        author: dto.bookAuthor,
        coverImage: dto.bookCover,
        publisher: dto.bookPublisher,
        bookCategory: dto.bookCategory,
        bookDescription: dto.bookDescription,
        content: dto.content,
        rating: dto.rating ?? null,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
}

export async function getBookReviews(userId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: BookReviewDto[];
    }>(`/api/book-reviews?userId=${userId}`);

    return {
        success: res.success,
        count: res.data?.length ?? 0,
        data: (res.data ?? []).map(mapBookReview),
    };
}

export async function getBookReviewDetail(reviewId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: BookReviewDto;
    }>(`/api/book-reviews/${reviewId}`);

    return {
        success: res.success,
        data: mapBookReview(res.data),
    };
}

export async function createBookReview(params: {
    userId: number;
    bookIsbn: string;
    bookTitle: string;
    author?: string;
    coverImage?: string;
    publisher?: string;
    category?: string;
    description?: string;
    content: string;
    rating?: number | null;
}) {
    const res = await apiFetch<{
        success: boolean;
        message: string;
        data: BookReviewDto;
    }>("/api/book-reviews", {
        method: "POST",
        body: JSON.stringify({
            userId: params.userId,
            bookIsbn: params.bookIsbn,
            bookTitle: params.bookTitle,
            bookAuthor: params.author,
            bookCover: params.coverImage,
            bookPublisher: params.publisher,
            bookCategory: params.category,
            bookDescription: params.description,
            content: params.content,
            rating: params.rating ?? null,
        }),
    });

    return {
        success: res.success,
        message: res.message,
        data: mapBookReview(res.data),
    };
}

export async function updateBookReview(
    reviewId: number,
    userId: number,
    content: string,
    rating?: number
) {
    const res = await apiFetch<{
        success: boolean;
        message: string;
        data: BookReviewDto;
    }>(`/api/book-reviews/${reviewId}?userId=${userId}`, {
        method: "PUT",
        body: JSON.stringify({ content, rating: rating ?? null }),
    });

    return {
        success: res.success,
        message: res.message,
        data: mapBookReview(res.data),
    };
}

export async function deleteBookReview(reviewId: number, userId: number) {
    return apiFetch<{
        success: boolean;
        message: string;
    }>(`/api/book-reviews/${reviewId}?userId=${userId}`, {
        method: "DELETE",
    });
}

/* =========================
   자가진단 / 독서 성향 분석
========================= */

export type StyleKey = "emotion" | "analysis" | "critic" | "empathy" | "creative";

export type DiagnosisRadarProfile = Record<StyleKey, number>;

export type DiagnosisTimelineItem = {
    id: string;
    title: string;
    cover: string;
    scores: Record<StyleKey, number>;
    changes: Record<StyleKey, number | null>;
    insights: Record<StyleKey, string>;
};

export type DiagnosisGuideBook = {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    description: string;
    cover: string;
    reason?: string;
};

export type DiagnosisGuide = {
    taste: DiagnosisGuideBook | null;
    growth: DiagnosisGuideBook | null;
};

type DiagnosisRadarResponseDto = {
    labels: string[];
    scores: number[];
    topType: string;
    middleType: string;
    growthType: string;
    summaryComment: string;
};

type DiagnosisTrendSummaryDto = {
    emotion: string;
    analysis: string;
    criticism: string;
    empathy: string;
    creativity: string;
};

export type DiagnosisTrendResult = {
    success: boolean;
    data: DiagnosisTimelineItem[];
    summary: DiagnosisTrendSummaryDto | null;
};

type DiagnosisTrendItemResponseDto = {
    reviewId: number;
    bookTitle: string;

    emotionScore: number;
    analysisScore: number;
    criticismScore: number;
    empathyScore: number;
    creativityScore: number;

    emotionChange: number | null;
    analysisChange: number | null;
    criticismChange: number | null;
    empathyChange: number | null;
    creativityChange: number | null;

    emotionInsight: string;
    analysisInsight: string;
    criticismInsight: string;
    empathyInsight: string;
    creativityInsight: string;
};

type DiagnosisTrendResponseDto = {
    items: DiagnosisTrendItemResponseDto[];
    summary: DiagnosisTrendSummaryDto;
};

type RecommendedBookItemResponseDto = {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    cover: string;
    description: string;
    reason: string;
};

type RecommendationResponseDto = {
    preferenceBook: RecommendedBookItemResponseDto;
    growthBook: RecommendedBookItemResponseDto;
};

function safeNum(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export async function getDiagnosisLatest(userId: number) {
    return apiFetch<{
        success: boolean;
        data: {
            reviewId: number;
            roomId: number;

            emotionScore: number;
            analysisScore: number;
            criticismScore: number;
            empathyScore: number;
            creativityScore: number;

            topType: string;
            middleType: string;
            growthType: string;

            summaryComment: string;
            conversationSummary: string[];
            hashtags: string[];
        };
    }>(`/api/diagnosis/users/${userId}/latest`);
}

export async function getDiagnosisRadar(userId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: {
            labels: string[];
            scores: number[];
            topType: string;
            middleType: string;
            growthType: string;
            summaryComment: string;
        };
    }>(`/api/diagnosis/users/${userId}/radar`);

    const labels = res.data?.labels ?? [];
    const scores = res.data?.scores ?? [];

    const scoreMap = new Map<string, number>();
    labels.forEach((label, index) => {
        scoreMap.set(String(label).toUpperCase(), Number(scores[index] ?? 0));
    });

    const pick = (keys: string[]) => {
        for (const key of keys) {
            const value = scoreMap.get(key);
            if (typeof value === "number" && Number.isFinite(value)) {
                return value <= 1 ? value * 100 : value;
            }
        }
        return 0;
    };

    return {
        success: res.success,
        data: {
            profile: {
                emotion: pick(["EMOTION", "감정"]),
                analysis: pick(["ANALYSIS", "분석"]),
                critic: pick(["CRITICISM", "CRITIC", "비평"]),
                empathy: pick(["EMPATHY", "공감"]),
                creative: pick(["CREATIVITY", "CREATIVE", "창의"]),
            } as DiagnosisRadarProfile,
            summary: res.data?.summaryComment ?? "자가진단 요약이 없습니다.",
            topType: res.data?.topType ?? "",
            middleType: res.data?.middleType ?? "",
            growthType: res.data?.growthType ?? "",
        },
    };
}

export async function getDiagnosisTrend(userId: number): Promise<DiagnosisTrendResult> {
    const res = await apiFetch<{
        success: boolean;
        data: DiagnosisTrendResponseDto;
    }>(`/api/diagnosis/users/${userId}/trend`);

    const items = res.data?.items ?? [];
    const summary = res.data?.summary ?? null;

    const mappedItems: DiagnosisTimelineItem[] = items.map((item, index) => ({
        id: String(item.reviewId ?? index),
        title: item.bookTitle ?? "알 수 없는 책",
        cover: "",
        scores: {
            emotion: safeNum(item.emotionScore),
            analysis: safeNum(item.analysisScore),
            critic: safeNum(item.criticismScore),
            empathy: safeNum(item.empathyScore),
            creative: safeNum(item.creativityScore),
        },
        changes: {
            emotion: item.emotionChange ?? null,
            analysis: item.analysisChange ?? null,
            critic: item.criticismChange ?? null,
            empathy: item.empathyChange ?? null,
            creative: item.creativityChange ?? null,
        },
        insights: {
            emotion: item.emotionInsight ?? "이 책의 감정 흐름을 확인할 수 있어요.",
            analysis: item.analysisInsight ?? "이 책의 분석 흐름을 확인할 수 있어요.",
            critic: item.criticismInsight ?? "이 책의 비평 흐름을 확인할 수 있어요.",
            empathy: item.empathyInsight ?? "이 책의 공감 흐름을 확인할 수 있어요.",
            creative: item.creativityInsight ?? "이 책의 창의 흐름을 확인할 수 있어요.",
        },
    }));

    return {
        success: res.success,
        data: mappedItems,
        summary,
    };
}

export async function getDiagnosisHistory(userId: number) {
    return apiFetch<{
        success: boolean;
        data: Array<{
            reviewId: number;
            bookTitle: string;
            emotionScore: number;
            analysisScore: number;
            criticismScore: number;
            empathyScore: number;
            creativityScore: number;
            createdAt: string;
        }>;
    }>(`/api/diagnosis/users/${userId}/history`);
}

export async function getDiagnosisRecommendations(userId: number) {
    const res = await apiFetch<{
        success: boolean;
        data: RecommendationResponseDto;
    }>(`/api/recommend/users/${userId}`);

    return {
        success: res.success,
        data: {
            taste: res.data?.preferenceBook
                ? {
                    isbn: res.data.preferenceBook.isbn,
                    title: res.data.preferenceBook.title,
                    author: res.data.preferenceBook.author,
                    publisher: res.data.preferenceBook.publisher,
                    description: res.data.preferenceBook.reason || res.data.preferenceBook.description,
                    cover: res.data.preferenceBook.cover,
                    reason: res.data.preferenceBook.reason,
                }
                : null,
            growth: res.data?.growthBook
                ? {
                    isbn: res.data.growthBook.isbn,
                    title: res.data.growthBook.title,
                    author: res.data.growthBook.author,
                    publisher: res.data.growthBook.publisher,
                    description: res.data.growthBook.reason || res.data.growthBook.description,
                    cover: res.data.growthBook.cover,
                    reason: res.data.growthBook.reason,
                }
                : null,
        } as DiagnosisGuide,
    };
}