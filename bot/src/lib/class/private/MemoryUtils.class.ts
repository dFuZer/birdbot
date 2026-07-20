import {
    bombDurationRange,
    bombpartySessionMessageKinds,
    centralMessageKinds,
    livesRange,
    minWordLengthOptions,
    roundsToWinRange,
    scoreGoalRange,
} from "../../constants/gameConstants";

import { customPromptDifficultyRange, dictionaryIds, gameModes, promptDifficulties } from "../../constants/gameConstants";

import WebSocket from "ws";
import { defaultBombPartyRules, nodeMessageKinds } from "../../constants/gameConstants";
import type { BombPartyRuleKey } from "../../types/gameTypes";
import Utilitary from "../Utilitary.class";
import MemoryBuffer from "./MemoryBuffer.class";

export default class MemoryUtils {
    public static getSessionMessageBase() {
        return this.getMessageBaseEnum("session", nodeMessageKinds);
    }

    public static extractCentralMessageBase(message: Buffer) {
        const mem = new MemoryBuffer(message);
        const timestamp = mem.readFloat64();
        const eventType = mem.readEnum(centralMessageKinds);
        if (eventType === "roomReady") {
            const roomCode = mem.readString(4);
            return { timestamp, eventType, roomCode, memoryBuffer: mem };
        }
        return { timestamp, eventType, memoryBuffer: mem };
    }

    public static getMessageBaseEnum<T>(type: T, kinds: readonly T[]) {
        const msg = this.getMessageBase();
        msg.writeEnum(type, kinds);
        return msg;
    }

    public static getMessageBase() {
        const msg = new MemoryBuffer(new Uint8Array(65536));
        msg.reset().writeFloat64(Date.now());
        return msg;
    }

    public static sendChatMessage(ws: WebSocket, message: string) {
        const messageChunks = Utilitary.cutMessage(message, 299);
        for (const chunk of messageChunks) {
            const msg = this.getMessageBase().writeEnum("chat", nodeMessageKinds).writeString16(chunk);
            ws.send(msg.trim());
        }
    }
    public static extractNodeMessageBase(message: Buffer) {
        const mem = new MemoryBuffer(message);
        const timestamp = mem.readFloat64();
        const eventType = mem.readEnum(nodeMessageKinds);
        if (eventType === "session") {
            const sessionEventType = mem.readEnum(bombpartySessionMessageKinds);
            return { timestamp, eventType, sessionEventType, memoryBuffer: mem };
        }
        return { timestamp, eventType, memoryBuffer: mem };
    }

    public static writeRule(msg: MemoryBuffer, rule: BombPartyRuleKey, value: any) {
        const keys = Object.keys(defaultBombPartyRules);
        msg.writeEnum(rule, keys);
        switch (rule) {
            case "gameMode":
                msg.writeEnum(value, gameModes);
                break;
            case "dictionaryId":
                msg.writeEnum(value, dictionaryIds);
                break;
            case "promptDifficulty":
                msg.writeEnum(value, promptDifficulties);
                break;
            case "customPromptDifficulty":
                msg.writeRangeInt(value, customPromptDifficultyRange);
                break;
            case "bombDuration":
                msg.writeRangeInt(value, bombDurationRange);
                break;
            case "roundsToWin":
                msg.writeRangeInt(value, roundsToWinRange);
                break;
            case "scoreGoal":
                msg.writeRangeInt(value, scoreGoalRange);
                break;
            case "startingLives":
                msg.writeRangeInt(value, livesRange);
                break;
            case "maxLives":
                msg.writeRangeInt(value, livesRange);
                break;
            case "minWordLengthOption":
                msg.writeEnum(value, minWordLengthOptions);
                break;
        }
    }
}
