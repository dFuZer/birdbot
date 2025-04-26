import type WebSocket from "ws";
import type NetworkAdapter from "../abstract/NetworkAdapter.abstract.class";
import type { ResourceGetter } from "../class/ResourceManager.class";
import type { ConstantRoomData, RoomState } from "../class/Room.class";
import type { Session } from "../class/Session.class";
import type { BombpartySessionMessageKind, NodeMessageKind } from "./gameTypes";

export type BotEventPreviousHandlersCtx = { [key: string]: any };
export type BotEventHandlerFn = (
    ctx: EventCtx,
    previousHandlersCtx: BotEventPreviousHandlersCtx
) => void | Promise<void>;
export type BotEventHandler = BotEventHandlerFn | BotEventHandlerFn[];

export type BotEventHandlers = {
    open?: BotEventHandler;
    close?: BotEventHandler;
    message: { [key in Exclude<NodeMessageKind, "session">]?: BotEventHandler } & {
        session: { [key in BombpartySessionMessageKind]?: BotEventHandler };
    };
};

export type MessageEventCtx = Buffer;

export type BotEventCtx = {
    getResource: ResourceGetter;
    session: Session;
    networkAdapter: NetworkAdapter;
};

export type RoomEventCtx = {
    roomState: RoomState;
    constantRoomData: ConstantRoomData;
    ws: WebSocket;
};

export type EventCtxUtils = {
    sendChatMessage: (message: string) => void;
};

export type EventCtx = {
    bot: BotEventCtx;
    room: RoomEventCtx;
    message: MessageEventCtx;
    utils: EventCtxUtils;
};
