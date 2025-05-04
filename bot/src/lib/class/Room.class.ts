import WebSocket from "ws";
import * as CrocoTypes from "../types/gameTypes";
import Utilitary from "./Utilitary.class";

export type RoomMetadata = Record<string, any>;

export type RoomState = {
    wordHistory: string[];
    gameData: CrocoTypes.GameData | null;
    roomData: CrocoTypes.RoomData | null;
    currentTurnIndex: number;
    myGamerId: number;
    metadata: RoomMetadata;
};

export type ConstantRoomData = {
    roomCode: string;
    targetConfig: RoomTargetConfig | null;
    roomCreatorUsername: string | null;
};

export type RoomTargetConfig = {
    gameMode: CrocoTypes.GameMode;
    dictionaryId: CrocoTypes.DictionaryId;
};

export default class Room {
    public ws: WebSocket | null;
    public roomState: RoomState;
    public constantRoomData: ConstantRoomData;
    public nodeHost: string | null;
    public id: string;

    constructor({
        roomCode,
        id,
        targetConfig,
        roomCreatorUsername,
    }: {
        roomCode: string;
        id: string;
        targetConfig?: RoomTargetConfig;
        roomCreatorUsername: string | null;
    }) {
        this.ws = null;
        this.nodeHost = null;
        this.id = id;
        this.constantRoomData = {
            roomCode: roomCode,
            targetConfig: targetConfig ?? null,
            roomCreatorUsername: roomCreatorUsername,
        };
        this.roomState = {
            gameData: null,
            roomData: null,
            currentTurnIndex: -1,
            myGamerId: -1,
            wordHistory: [],
            metadata: {},
        };
    }

    public async init({ sessionSecret }: { sessionSecret: string }) {
        const joinRoomResponse = await Utilitary.postJson<{ code: string; nodeHost: string }>("/api/rooms/join", {
            secret: sessionSecret,
            gameId: "bombParty",
            code: this.constantRoomData.roomCode,
        });

        this.nodeHost = joinRoomResponse.nodeHost;
    }
}
