import NetworkAdapter, {
    type ReadAddGamerData,
    type ReadAddPlayerData,
    type ReadAnnounceData,
    type ReadAnnounceRestartData,
    type ReadByeMessageData,
    type ReadCentralMessageBaseData,
    type ReadChatData,
    type ReadExplodeBombData,
    type ReadGameOverData,
    type ReadGetGamerModerationInfoResultData,
    type ReadHelloOkMessageData,
    type ReadNextTurnData,
    type ReadNodeMessageBaseData,
    type ReadOneVOneAnnouncementData,
    type ReadRemovePlayerData,
    type ReadRoundData,
    type ReadRoundIntroData,
    type ReadRoundOverData,
    type ReadSetGamerOnlineData,
    type ReadSetRoleData,
    type ReadSetRoomAccessModeData,
    type ReadSetupData,
    type ReadSubmitData,
    type ReadToggleCountdownData,
    type ReadTypeData,
    type ReadUpdatePlaylistRatingsData,
} from "../../abstract/AbstractNetworkAdapter.class";
import {
    bombDurationRange,
    bombpartySessionMessageKinds,
    centralMessageKinds,
    centralSocketTypes,
    customPromptDifficultyRange,
    defaultBombPartyRules,
    dictionaryIds,
    gameIds,
    gameModes,
    hostRoomAccessModes,
    livesRange,
    minWordLengthOptions,
    nodeMessageKinds,
    promptDifficulties,
    queueTypes,
    roomRoles,
    roundsToWinRange,
    scoreGoalRange,
    submitResults,
} from "../../constants/gameConstants";
import type {
    BombPartyRuleKey,
    DictionaryId,
    DictionaryManifest,
    GameData,
    GameMode,
    Gamer,
    Identity,
    Player,
    RoomAccessMode,
    RoomData,
    RoomRole,
} from "../../types/gameTypes";
import MemoryUtils from "./MemoryUtils.class";

export default class WorkingNetworkAdapter implements NetworkAdapter {
    public getCreateRoomMessage({
        dictionaryId,
        secret,
        roomName,
        isPublic,
    }: {
        dictionaryId: DictionaryId;
        secret: string;
        roomName: string;
        isPublic: boolean;
    }): Uint8Array {
        return MemoryUtils.getMessageBaseEnum("hello", centralMessageKinds)
            .writeEnum("queuer", centralSocketTypes)
            .writeString0(secret)
            .writeEnum("hostRoom", queueTypes)
            .writeEnum("bombParty", gameIds)
            .writeString8(dictionaryId)
            .writeString8(roomName)
            .writeBoolean(isPublic)
            .trim();
    }

    public getInitialSetupMessage({ gameMode, dictionaryId }: { gameMode: GameMode; dictionaryId: DictionaryId }): Uint8Array {
        return MemoryUtils.getSessionMessageBase()
            .writeEnum("setup", bombpartySessionMessageKinds)
            .writeEnum(gameMode, gameModes)
            .writeEnum(dictionaryId, dictionaryIds)
            .trim();
    }

    public getSendChatMessage(message: string): Uint8Array {
        return MemoryUtils.getMessageBase().writeEnum("chat", nodeMessageKinds).writeString16(message).writeBoolean(true).trim();
    }

    public getStartGameMessage(): Uint8Array {
        return MemoryUtils.getSessionMessageBase().writeEnum("start", bombpartySessionMessageKinds).trim();
    }

    public getSetGamerRoleMessage({ gamerId, role }: { gamerId: number; role: RoomRole }): Uint8Array {
        return MemoryUtils.getMessageBase()
            .writeEnum("setRole", nodeMessageKinds)
            .writeUint16(gamerId)
            .writeEnum(role, roomRoles)
            .trim();
    }

    public getJoinMessage(): Uint8Array {
        return MemoryUtils.getSessionMessageBase().writeEnum("addPlayer", bombpartySessionMessageKinds).trim();
    }

    public getSetRoomAccessModeMessage({ accessMode }: { accessMode: RoomAccessMode }): Uint8Array {
        return MemoryUtils.getMessageBase()
            .writeEnum("setRoomAccessMode", nodeMessageKinds)
            .writeEnum(accessMode, hostRoomAccessModes)
            .trim();
    }

    public getSetupMessage(rule: BombPartyRuleKey, value: any): Uint8Array {
        const msg = MemoryUtils.getSessionMessageBase().writeEnum("setup", bombpartySessionMessageKinds);
        MemoryUtils.writeRule(msg, rule, value);
        return msg.trim();
    }

    public readAnnounceData(message: Buffer): ReadAnnounceData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const messageText = memoryBuffer.readString16();
        return { timestamp, message: messageText };
    }

    public readAnnounceRestartData(message: Buffer): ReadAnnounceRestartData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const timeLeft = memoryBuffer.readFloat64();
        return { timestamp, timeLeft };
    }

    public readByeMessageData(message: Buffer): ReadByeMessageData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const reason = memoryBuffer.readString8();
        return { timestamp, reason };
    }

    public readGetGamerModerationInfoResultData(message: Buffer): ReadGetGamerModerationInfoResultData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const gamerId = memoryBuffer.readUint16();
        const ipAddress = memoryBuffer.readString8();
        return { timestamp, gamerId, ipAddress };
    }

    public getTypeMessage({ word }: { word: string }): Uint8Array {
        return MemoryUtils.getSessionMessageBase().writeEnum("type", bombpartySessionMessageKinds).writeString8(word).trim();
    }

    public getSubmitWordMessage(): Uint8Array {
        return MemoryUtils.getSessionMessageBase().writeEnum("submit", bombpartySessionMessageKinds).trim();
    }

    public getHelloMessage({ secret, roomCode }: { secret: string; roomCode: string }): Uint8Array {
        return MemoryUtils.getMessageBaseEnum("hello", nodeMessageKinds).writeString0(secret).writeString0(roomCode).trim();
    }

    public readNodeMessageBaseData(message: Buffer): ReadNodeMessageBaseData {
        return MemoryUtils.extractNodeMessageBase(message);
    }

    public readCentralMessageBaseData(message: Buffer): ReadCentralMessageBaseData {
        const res = MemoryUtils.extractCentralMessageBase(message);
        if (res.eventType === "roomReady") {
            return {
                timestamp: res.timestamp,
                eventType: res.eventType,
                roomCode: res.roomCode,
            };
        }
        return {
            timestamp: res.timestamp,
            eventType: res.eventType,
        };
    }

    public readAddGamerData(message: Buffer): ReadAddGamerData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const newPlayerData = memoryBuffer.readUnknown() as Gamer;
        return { timestamp, newPlayerData };
    }

    public readAddPlayerData(message: Buffer): ReadAddPlayerData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const playerData = memoryBuffer.readUnknown() as Player;
        return { timestamp, playerData };
    }

    public readChatData(message: Buffer): ReadChatData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const gamerId = memoryBuffer.readUint16();
        const rawMessage = memoryBuffer.readString16();
        return { timestamp, gamerId, rawMessage };
    }

    public readExplodeBombData(message: Buffer): ReadExplodeBombData {
        const { timestamp } = MemoryUtils.extractNodeMessageBase(message);
        return { timestamp };
    }

    public readGameOverData(message: Buffer): ReadGameOverData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const gameOverData = memoryBuffer.readUnknown();
        let shouldResetPlayers: boolean | undefined;
        if (memoryBuffer.cursor < memoryBuffer.array.length) {
            shouldResetPlayers = memoryBuffer.readBoolean();
        }
        return { timestamp, gameOverData, shouldResetPlayers };
    }

    public readHelloOkMessageData(message: Buffer): ReadHelloOkMessageData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const myGamerId = memoryBuffer.readUint16();
        const roomData = memoryBuffer.readUnknown() as RoomData;
        const gameData = memoryBuffer.readUnknown() as GameData;
        return { timestamp, myGamerId, roomData, gameData };
    }

    public readNextTurnData(message: Buffer): ReadNextTurnData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const prompt = memoryBuffer.readString8();
        const promptAge = memoryBuffer.readUint8();
        const minWordLength = memoryBuffer.readUint8();
        return { timestamp, prompt, promptAge, minWordLength };
    }

    public readRemovePlayerData(message: Buffer): ReadRemovePlayerData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const removedGamerId = memoryBuffer.readUint16();
        return { timestamp, removedGamerId };
    }

    public readRoundData(message: Buffer): ReadRoundData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const prompt = memoryBuffer.readString8();
        const minWordLength = memoryBuffer.readUint8();
        return { timestamp, prompt, minWordLength };
    }

    public readRoundOverData(message: Buffer): ReadRoundOverData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const lastRoundWinnerId = memoryBuffer.readUint16();
        return { timestamp, lastRoundWinnerId };
    }

    public readSetGamerOnlineData(message: Buffer): ReadSetGamerOnlineData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const gamerId = memoryBuffer.readUint16();
        const online = memoryBuffer.readBoolean();
        const playerData = online ? (memoryBuffer.readUnknown() as Identity) : null;
        return { timestamp, gamerId, online, playerData };
    }

    public readSetRoleData(message: Buffer): ReadSetRoleData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const gamerId = memoryBuffer.readUint16();
        const role = memoryBuffer.readEnum(roomRoles);
        return { timestamp, gamerId, role };
    }

    public readSetRoomAccessModeData(message: Buffer): ReadSetRoomAccessModeData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const roomAccessMode = memoryBuffer.readEnum(hostRoomAccessModes);
        return { timestamp, roomAccessMode };
    }

    public readSetupData(message: Buffer, isInitialSetup: boolean): ReadSetupData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);

        if (isInitialSetup) {
            const gameMode = memoryBuffer.readEnum(gameModes);
            const dictionaryId = memoryBuffer.readEnum(dictionaryIds);
            const dictionaryManifest = memoryBuffer.readUnknown() as DictionaryManifest;
            return {
                timestamp,
                initialSetup: true,
                gameMode,
                dictionaryId,
                dictionaryManifest,
            };
        } else {
            const rule = memoryBuffer.readEnum(Object.keys(defaultBombPartyRules));
            if (rule === "gameMode") {
                const gameMode = memoryBuffer.readEnum(gameModes);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: gameMode,
                };
            }
            if (rule === "dictionaryId") {
                const dictionaryId = memoryBuffer.readEnum(dictionaryIds);
                const dictionaryManifest = memoryBuffer.readUnknown() as DictionaryManifest;
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: { dictionaryId, dictionaryManifest },
                };
            }
            if (rule === "promptDifficulty") {
                const promptDifficulty = memoryBuffer.readEnum(promptDifficulties);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: promptDifficulty,
                };
            }
            if (rule === "customPromptDifficulty") {
                const customPromptDifficulty = memoryBuffer.readRangeInt(customPromptDifficultyRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: customPromptDifficulty,
                };
            }
            if (rule === "bombDuration") {
                const bombDuration = memoryBuffer.readRangeInt(bombDurationRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: bombDuration,
                };
            }
            if (rule === "roundsToWin") {
                const roundsToWin = memoryBuffer.readRangeInt(roundsToWinRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: roundsToWin,
                };
            }
            if (rule === "scoreGoal") {
                const scoreGoal = memoryBuffer.readRangeInt(scoreGoalRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: scoreGoal,
                };
            }
            if (rule === "startingLives") {
                const startingLives = memoryBuffer.readRangeInt(livesRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: startingLives,
                };
            }
            if (rule === "maxLives") {
                const maxLives = memoryBuffer.readRangeInt(livesRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: maxLives,
                };
            }
            if (rule === "minWordLengthOption") {
                const minWordLengthOption = memoryBuffer.readEnum(minWordLengthOptions);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: minWordLengthOption,
                };
            }
            if (rule === "bombDuration") {
                const bombDuration = memoryBuffer.readRangeInt(bombDurationRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: bombDuration,
                };
            }
            if (rule === "roundsToWin") {
                const roundsToWin = memoryBuffer.readRangeInt(roundsToWinRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: roundsToWin,
                };
            }
            if (rule === "scoreGoal") {
                const scoreGoal = memoryBuffer.readRangeInt(scoreGoalRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: scoreGoal,
                };
            }
            if (rule === "startingLives") {
                const startingLives = memoryBuffer.readRangeInt(livesRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: startingLives,
                };
            }
            if (rule === "maxLives") {
                const maxLives = memoryBuffer.readRangeInt(livesRange);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: maxLives,
                };
            }
            if (rule === "minWordLengthOption") {
                const minWordLengthOption = memoryBuffer.readEnum(minWordLengthOptions);
                return {
                    timestamp,
                    initialSetup: false,
                    rule,
                    value: minWordLengthOption,
                };
            }
            throw new Error(`Unknown rule: ${rule}`);
        }
    }

    public readSubmitData(message: Buffer): ReadSubmitData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const result = memoryBuffer.readEnum(submitResults);
        const points = memoryBuffer.readInt8();
        return { timestamp, result, points };
    }

    public readToggleCountdownData(message: Buffer): ReadToggleCountdownData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const enabled = memoryBuffer.readBoolean();
        return { timestamp, enabled };
    }

    public readTypeData(message: Buffer): ReadTypeData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const typedWord = memoryBuffer.readString8();
        return { timestamp, typedWord };
    }

    public readRoundIntroData(message: Buffer): ReadRoundIntroData {
        const { timestamp, memoryBuffer } = MemoryUtils.extractNodeMessageBase(message);
        const startPlayerIndex = memoryBuffer.readUint8();
        return { timestamp, startPlayerIndex };
    }

    public readOneVOneAnnouncementData(message: Buffer): ReadOneVOneAnnouncementData {
        const { timestamp } = MemoryUtils.extractNodeMessageBase(message);
        return { timestamp };
    }

    public readUpdatePlaylistRatingsData(message: Buffer): ReadUpdatePlaylistRatingsData {
        const { timestamp } = MemoryUtils.extractNodeMessageBase(message);
        return { timestamp };
    }
}
