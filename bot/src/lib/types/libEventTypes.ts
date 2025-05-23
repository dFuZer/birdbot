import type WebSocket from "ws";
import type AbstractNetworkAdapter from "../abstract/AbstractNetworkAdapter.class";
import Bot from "../class/Bot.class";
import type { ResourceGetter } from "../class/ResourceManager.class";
import type { ConstantRoomData, RoomState } from "../class/Room.class";
import Room from "../class/Room.class";
import type { Session } from "../class/Session.class";
import type { BombpartySessionMessageKind, NodeMessageKind } from "./gameTypes";

export type BotEventPreviousHandlersCtx = { [key: string]: any };
export type BotEventHandlerFn = (ctx: EventCtx, previousHandlersCtx: BotEventPreviousHandlersCtx) => void;
export type BotEventHandler = BotEventHandlerFn | BotEventHandlerFn[];

export type BotEventHandlers = {
    open?: BotEventHandler;
    close?: BotEventHandler;
    message: {
        [key in Exclude<NodeMessageKind, "session">]?: BotEventHandler;
    } & {
        session: { [key in BombpartySessionMessageKind]?: BotEventHandler };
    };
};

export type MessageEventCtx = Buffer;

export type BotEventCtx = {
    getResource: ResourceGetter;
    rooms: Readonly<Record<string, Room>>;
    session: Session;
    networkAdapter: AbstractNetworkAdapter;
    rawBot: Bot;
};

export type RoomEventCtx = {
    roomState: RoomState;
    constantRoomData: ConstantRoomData;
    ws: WebSocket;
    rawRoom: Room;
    isHealthy: () => boolean;
};

export type EventCtxUtils = {
    sendChatMessage: (message: string) => void;
    userIsAdmin: (username: any) => boolean;
};

export type EventCtx = {
    bot: BotEventCtx;
    room: RoomEventCtx;
    message: MessageEventCtx;
    utils: EventCtxUtils;
};
