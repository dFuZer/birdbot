import type {
    BombPartyRuleKey,
    BombpartySessionMessageKind,
    CentralMessageKind,
    DictionaryId,
    DictionaryManifest,
    GameData,
    GameMode,
    Gamer,
    Identity,
    MinWordLengthOption,
    NodeMessageKind,
    Player,
    PromptDifficulty,
    RoomAccessMode,
    RoomData,
    RoomRole,
    SubmitResultType,
} from "../types/gameTypes";

type CommonMessageData = {
    timestamp: number;
};

export type ReadHelloOkMessageData = CommonMessageData & {
    myGamerId: number;
    roomData: RoomData;
    gameData: GameData;
};

export type ReadSetRoomAccessModeData = CommonMessageData & {
    roomAccessMode: string;
};

export type ReadSetRoleData = CommonMessageData & {
    gamerId: number;
    role: string;
};

export type ReadAddGamerData = CommonMessageData & {
    newPlayerData: Gamer;
};

export type ReadSetGamerOnlineData = CommonMessageData & {
    gamerId: number;
    online: boolean;
    playerData: Identity | null;
};

export type ReadChatData = CommonMessageData & {
    gamerId: number;
    rawMessage: string;
};

export type ReadSetupData = CommonMessageData &
    (
        | { initialSetup: true; gameMode: GameMode; dictionaryId: DictionaryId; dictionaryManifest: DictionaryManifest }
        | {
              initialSetup: false;
              rule: "gameMode";
              value: GameMode;
          }
        | {
              initialSetup: false;
              rule: "dictionaryId";
              value: { dictionaryId: DictionaryId; dictionaryManifest: DictionaryManifest };
          }
        | {
              initialSetup: false;
              rule: "promptDifficulty";
              value: PromptDifficulty;
          }
        | {
              initialSetup: false;
              rule: "bombDuration";
              value: number;
          }
        | {
              initialSetup: false;
              rule: "customPromptDifficulty";
              value: number;
          }
        | {
              initialSetup: false;
              rule: "roundsToWin";
              value: number;
          }
        | {
              initialSetup: false;
              rule: "minWordLengthOption";
              value: MinWordLengthOption;
          }
        | {
              initialSetup: false;
              rule: "scoreGoal";
              value: number;
          }
        | {
              initialSetup: false;
              rule: "startingLives";
              value: number;
          }
        | {
              initialSetup: false;
              rule: "maxLives";
              value: number;
          }
    );

export type ReadToggleCountdownData = CommonMessageData & {
    enabled: boolean;
};

export type ReadRemovePlayerData = CommonMessageData & {
    removedGamerId: number;
};

export type ReadAddPlayerData = CommonMessageData & {
    playerData: Player;
};

export type ReadRoundData = CommonMessageData & {
    prompt: string;
    minWordLength: number;
};

export type ReadRoundOverData = CommonMessageData & {
    lastRoundWinnerId: number;
};

export type ReadExplodeBombData = CommonMessageData;

export type ReadNextTurnData = CommonMessageData & {
    prompt: string;
    promptAge: number;
    minWordLength: number;
};

export type ReadSubmitData = CommonMessageData & {
    result: SubmitResultType;
    points: number;
};

export type ReadTypeData = CommonMessageData & {
    typedWord: string;
};

export type ReadGameOverData = CommonMessageData & {
    gameOverData: unknown;
    shouldResetPlayers?: boolean;
};

export type ReadNodeMessageBaseData = {
    timestamp: number;
} & (
    | {
          eventType: "session";
          sessionEventType: BombpartySessionMessageKind;
      }
    | {
          eventType: Exclude<NodeMessageKind, "session">;
      }
);

export type ReadRoundIntroData = CommonMessageData & {
    startPlayerIndex: number;
};

export type ReadOneVOneAnnouncementData = CommonMessageData;

export type ReadUpdatePlaylistRatingsData = CommonMessageData;

export type ReadCentralMessageBaseData =
    | {
          timestamp: number;
          eventType: "roomReady";
          roomCode: string;
      }
    | {
          timestamp: number;
          eventType: Exclude<CentralMessageKind, "roomReady">;
      };

export type ReadByeMessageData = CommonMessageData & {
    reason: string;
};

export type ReadGetGamerModerationInfoResultData = CommonMessageData & {
    gamerId: number;
    ipAddress: string;
};

export type ReadAnnounceData = CommonMessageData & {
    message: string;
};

export type ReadAnnounceRestartData = CommonMessageData & {
    timeLeft: number;
};

export default abstract class NetworkAdapter {
    public abstract getCreateRoomMessage({
        dictionaryId,
        secret,
    }: {
        dictionaryId: DictionaryId;
        secret: string;
    }): Uint8Array;

    public abstract getTypeMessage({ word }: { word: string }): Uint8Array;

    public abstract getStartGameMessage(): Uint8Array;

    public abstract getSetupMessage(rule: BombPartyRuleKey, value: any): Uint8Array;

    public abstract getJoinMessage(): Uint8Array;

    public abstract getInitialSetupMessage({
        gameMode,
        dictionaryId,
    }: {
        gameMode: GameMode;
        dictionaryId: DictionaryId;
    }): Uint8Array;

    public abstract getSubmitWordMessage(): Uint8Array;

    public abstract getSendChatMessage(message: string): Uint8Array;

    public abstract getHelloMessage({ secret, roomCode }: { secret: string; roomCode: string }): Uint8Array;

    public abstract readNodeMessageBaseData(message: Buffer): ReadNodeMessageBaseData;

    public abstract readByeMessageData(message: Buffer): ReadByeMessageData;

    public abstract getSetRoomAccessModeMessage({ accessMode }: { accessMode: RoomAccessMode }): Uint8Array;

    public abstract getSetGamerRoleMessage({ gamerId, role }: { gamerId: number; role: RoomRole }): Uint8Array;

    public abstract readGetGamerModerationInfoResultData(message: Buffer): ReadGetGamerModerationInfoResultData;

    public abstract readAnnounceData(message: Buffer): ReadAnnounceData;

    public abstract readAnnounceRestartData(message: Buffer): ReadAnnounceRestartData;

    public abstract readHelloOkMessageData(message: Buffer): ReadHelloOkMessageData;

    public abstract readSetRoomAccessModeData(message: Buffer): ReadSetRoomAccessModeData;

    public abstract readCentralMessageBaseData(message: Buffer): ReadCentralMessageBaseData;

    public abstract readSetRoleData(message: Buffer): ReadSetRoleData;

    public abstract readAddGamerData(message: Buffer): ReadAddGamerData;

    public abstract readSetGamerOnlineData(message: Buffer): ReadSetGamerOnlineData;

    public abstract readChatData(message: Buffer): ReadChatData;

    public abstract readSetupData(message: Buffer, isInitialSetup: boolean): ReadSetupData;

    public abstract readToggleCountdownData(message: Buffer): ReadToggleCountdownData;

    public abstract readRemovePlayerData(message: Buffer): ReadRemovePlayerData;

    public abstract readAddPlayerData(message: Buffer): ReadAddPlayerData;

    public abstract readRoundData(message: Buffer): ReadRoundData;

    public abstract readRoundOverData(message: Buffer): ReadRoundOverData;

    public abstract readExplodeBombData(message: Buffer): ReadExplodeBombData;

    public abstract readNextTurnData(message: Buffer): ReadNextTurnData;

    public abstract readSubmitData(message: Buffer): ReadSubmitData;

    public abstract readTypeData(message: Buffer): ReadTypeData;

    public abstract readGameOverData(message: Buffer): ReadGameOverData;

    public abstract readRoundIntroData(message: Buffer): ReadRoundIntroData;

    public abstract readOneVOneAnnouncementData(message: Buffer): ReadOneVOneAnnouncementData;

    public abstract readUpdatePlaylistRatingsData(message: Buffer): ReadUpdatePlaylistRatingsData;
}
