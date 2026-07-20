import type Bot from "../class/Bot.class";
import type { ResourceGetter } from "../class/ResourceManager.class";
import type { ConstantRoomData, RoomState } from "../class/Room.class";
import Room from "../class/Room.class";
import type { Session } from "../class/Session.class";
import type { Chatter } from "./gameTypes";

export type BotEventPreviousHandlersCtx = { [key: string]: any };
export type BotEventHandlerFn = (ctx: EventCtx, previousHandlersCtx: BotEventPreviousHandlersCtx) => void;
export type BotEventHandler = BotEventHandlerFn | BotEventHandlerFn[];

export type ChatEventName =
    | "chat"
    | "chatterAdded"
    | "chatterRemoved"
    | "userBanned"
    | "setPlayerCount"
    | "disconnect";

export type GameEventName =
    | "setup"
    | "setMilestone"
    | "setRules"
    | "setDictionaryManifest"
    | "addPlayer"
    | "updatePlayer"
    | "removePlayer"
    | "clearUsedWords"
    | "nextTurn"
    | "livesLost"
    | "bonusAlphabetCompleted"
    | "setPlayerWord"
    | "failWord"
    | "correctWord"
    | "disconnect";

export type BotEventHandlers = {
    chatConnect?: BotEventHandler;
    gameConnect?: BotEventHandler;
    chatDisconnect?: BotEventHandler;
    gameDisconnect?: BotEventHandler;
    chat: { [K in ChatEventName]?: BotEventHandler };
    game: { [K in GameEventName]?: BotEventHandler };
};

export type MessageEventCtx = {
    event: string;
    args: any[];
};

export type BotEventCtx = {
    getResource: ResourceGetter;
    rooms: Readonly<Record<string, Room>>;
    session: Session;
    rawBot: Bot;
};

export type RoomEventCtx = {
    roomState: RoomState;
    constantRoomData: ConstantRoomData;
    rawRoom: Room;
    isHealthy: () => boolean;
};

export type EventCtxUtils = {
    sendChatMessage: (message: string) => void;
    userIsAdmin: (authId: string | null | undefined) => boolean;
    setWord: (word: string) => void;
    joinRound: () => void;
    startRoundNow: () => void;
    setRules: (rules: Record<string, unknown>) => void;
    setRulesLocked: (locked: boolean) => void;
    setRoomPublic: (isPublic: boolean) => void;
    setUserModerator: (peerId: number, isModerator: boolean) => void;
};

export type EventCtx = {
    bot: BotEventCtx;
    room: RoomEventCtx;
    message: MessageEventCtx;
    utils: EventCtxUtils;
};

/** Chatter alias used by command system */
export type CommandAuthor = Chatter;
