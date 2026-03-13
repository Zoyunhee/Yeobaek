import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "../constants/api";
import type { DiscussionMessage } from "./api";

type ConnectParams = {
    roomId: number;
    onMessage: (message: DiscussionMessage) => void;
    onConnect?: () => void;
    onError?: (error: unknown) => void;
};

function getWsBaseUrl() {
    return API_BASE_URL.replace(/\/$/, "");
}

export function createDiscussionSocket({
                                           roomId,
                                           onMessage,
                                           onConnect,
                                           onError,
                                       }: ConnectParams) {
    const client = new Client({
        webSocketFactory: () => new SockJS(`${getWsBaseUrl()}/ws-book-discussion`),
        reconnectDelay: 5000,
        debug: () => {},
        onConnect: () => {
            client.subscribe(`/topic/discussion/${roomId}`, (frame: IMessage) => {
                try {
                    const body = JSON.parse(frame.body) as DiscussionMessage;
                    onMessage(body);
                } catch (e) {
                    onError?.(e);
                }
            });

            onConnect?.();
        },
        onStompError: (frame) => {
            onError?.(frame);
        },
        onWebSocketError: (event) => {
            onError?.(event);
        },
    });

    client.activate();
    return client;
}

export function publishDiscussionChat(
    client: Client,
    roomId: number,
    payload: DiscussionMessage
) {
    client.publish({
        destination: `/app/discussion/${roomId}`,
        body: JSON.stringify(payload),
    });
}

export function publishDiscussionEnter(
    client: Client,
    roomId: number,
    payload: DiscussionMessage
) {
    client.publish({
        destination: `/app/discussion/${roomId}/enter`,
        body: JSON.stringify(payload),
    });
}

export function publishDiscussionLeave(
    client: Client,
    roomId: number,
    payload: DiscussionMessage
) {
    client.publish({
        destination: `/app/discussion/${roomId}/leave`,
        body: JSON.stringify(payload),
    });
}

export function disconnectDiscussionSocket(client?: Client | null) {
    if (!client) return;
    if (client.active) {
        client.deactivate();
    }
}