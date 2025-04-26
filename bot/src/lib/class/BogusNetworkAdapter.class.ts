import type {
    ReadAddGamerData,
    ReadAddPlayerData,
    ReadAnnounceData,
    ReadAnnounceRestartData,
    ReadByeMessageData,
    ReadCentralMessageBaseData,
    ReadChatData,
    ReadExplodeBombData,
    ReadGameOverData,
    ReadGetGamerModerationInfoResultData,
    ReadHelloOkMessageData,
    ReadNextTurnData,
    ReadNodeMessageBaseData,
    ReadOneVOneAnnouncementData,
    ReadRemovePlayerData,
    ReadRoundData,
    ReadRoundIntroData,
    ReadRoundOverData,
    ReadSetGamerOnlineData,
    ReadSetRoleData,
    ReadSetRoomAccessModeData,
    ReadSetupData,
    ReadSubmitData,
    ReadToggleCountdownData,
    ReadTypeData,
    ReadUpdatePlaylistRatingsData,
} from "../abstract/NetworkAdapter.abstract.class";
import NetworkAdapter from "../abstract/NetworkAdapter.abstract.class";
import type { BombPartyRuleKey, DictionaryId, GameMode } from "../types/gameTypes";

// This bogus implementation obviously does not work.
// To run BirdBot yourself, you will have to reverse engineer the Croco protocol.
// Those are the wishes of the Croco team.

// Want to make a bot ?
// If you do manage to reverse engineer the protocol and implement this abstract class, please do NOT share the source code with anyone.
// It would significantly lower the barrier of entry for cheaters and ruin the game for everyone.

export default class BogusNetworkAdapter implements NetworkAdapter {
    public getCreateRoomMessage({ dictionaryId, secret }: { dictionaryId: DictionaryId; secret: string }): Uint8Array {
        return 0 as any;
    }
    public getInitialSetupMessage({
        gameMode,
        dictionaryId,
    }: {
        gameMode: GameMode;
        dictionaryId: DictionaryId;
    }): Uint8Array {
        return 0 as any;
    }
    public getJoinMessage(): Uint8Array {
        return 0 as any;
    }
    public getSetupMessage(rule: BombPartyRuleKey, value: any): Uint8Array {
        return 0 as any;
    }
    public getSendChatMessage(message: string): Uint8Array {
        return 0 as any;
    }
    public readByeMessageData(message: Buffer): ReadByeMessageData {
        return 0 as any;
    }
    public getSubmitWordMessage(): Uint8Array {
        return 0 as any;
    }
    public getTypeMessage({ word }: { word: string }): Uint8Array {
        return 0 as any;
    }
    public readAnnounceData(message: Buffer): ReadAnnounceData {
        return 0 as any;
    }
    public readAnnounceRestartData(message: Buffer): ReadAnnounceRestartData {
        return 0 as any;
    }
    public readGetGamerModerationInfoResultData(message: Buffer): ReadGetGamerModerationInfoResultData {
        return 0 as any;
    }
    public getHelloMessage({ secret, roomCode }: { secret: string; roomCode: string }): Uint8Array {
        return 0 as any;
    }
    public readCentralMessageBaseData(message: Buffer): ReadCentralMessageBaseData {
        return 0 as any;
    }
    public readOneVOneAnnouncementData(message: Buffer): ReadOneVOneAnnouncementData {
        return 0 as any;
    }
    public readUpdatePlaylistRatingsData(message: Buffer): ReadUpdatePlaylistRatingsData {
        return 0 as any;
    }
    public readRoundIntroData(message: Buffer): ReadRoundIntroData {
        return 0 as any;
    }
    public readNodeMessageBaseData(message: Buffer): ReadNodeMessageBaseData {
        return 0 as any;
    }
    public readAddGamerData(message: Buffer): ReadAddGamerData {
        return 0 as any;
    }
    public readAddPlayerData(message: Buffer): ReadAddPlayerData {
        return 0 as any;
    }
    public readChatData(message: Buffer): ReadChatData {
        return 0 as any;
    }
    public readExplodeBombData(message: Buffer): ReadExplodeBombData {
        return 0 as any;
    }
    public readGameOverData(message: Buffer): ReadGameOverData {
        return 0 as any;
    }
    public readHelloOkMessageData(message: Buffer): ReadHelloOkMessageData {
        return 0 as any;
    }
    public readNextTurnData(message: Buffer): ReadNextTurnData {
        return 0 as any;
    }
    public readRemovePlayerData(message: Buffer): ReadRemovePlayerData {
        return 0 as any;
    }
    public readRoundData(message: Buffer): ReadRoundData {
        return 0 as any;
    }
    public readRoundOverData(message: Buffer): ReadRoundOverData {
        return 0 as any;
    }
    public readSetGamerOnlineData(message: Buffer): ReadSetGamerOnlineData {
        return 0 as any;
    }
    public readSetRoleData(message: Buffer): ReadSetRoleData {
        return 0 as any;
    }
    public readSetRoomAccessModeData(message: Buffer): ReadSetRoomAccessModeData {
        return 0 as any;
    }
    public readSetupData(message: Buffer): ReadSetupData {
        return 0 as any;
    }
    public readSubmitData(message: Buffer): ReadSubmitData {
        return 0 as any;
    }
    public readToggleCountdownData(message: Buffer): ReadToggleCountdownData {
        return 0 as any;
    }
    public readTypeData(message: Buffer): ReadTypeData {
        return 0 as any;
    }
}
