import type { Socket } from "socket.io-client";
import * as JklmTypes from "../types/gameTypes";

export type RoomMetadata = Record<string, any>;

export type RoomState = {
    wordHistory: string[];
    gameData: JklmTypes.GameData | null;
    roomData: JklmTypes.RoomData | null;
    myPeerId: number;
    metadata: RoomMetadata;
    /** Round start time for API game ids (set when entering round milestone) */
    roundStartTimestamp: number;
    lastActivityAt: number;
};

export type ConstantRoomData = {
    roomCode: string;
    targetConfig: RoomTargetConfig;
    roomCreatorAuthId: string | null;
    userToken: string;
    serverUrl: string | null;
};

export type RoomTargetConfig = {
    dictionaryId: JklmTypes.DictionaryId;
    isPublic: boolean;
    roomName: string;
    [key: string]: any;
};

export default class Room {
    public chatSocket: Socket | null;
    public gameSocket: Socket | null;
    public roomState: RoomState;
    public constantRoomData: ConstantRoomData;
    public id: string;
    public hasEverConnected: boolean;

    constructor({
        roomCode,
        id,
        targetConfig,
        roomCreatorAuthId,
        userToken,
        serverUrl,
    }: {
        roomCode: string;
        id: string;
        targetConfig: RoomTargetConfig;
        roomCreatorAuthId: string | null;
        userToken: string;
        serverUrl?: string | null;
    }) {
        this.chatSocket = null;
        this.gameSocket = null;
        this.id = id;
        this.hasEverConnected = false;
        this.constantRoomData = {
            roomCode,
            targetConfig,
            roomCreatorAuthId,
            userToken,
            serverUrl: serverUrl ?? null,
        };
        this.roomState = {
            gameData: null,
            roomData: null,
            myPeerId: -1,
            wordHistory: [],
            metadata: {},
            roundStartTimestamp: 0,
            lastActivityAt: Date.now(),
        };
    }

    public isConnected(): boolean {
        return !!(this.chatSocket?.connected && this.gameSocket?.connected);
    }
}
