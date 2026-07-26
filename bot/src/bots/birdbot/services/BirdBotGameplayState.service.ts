import type { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import type { BirdBotSupportedDictionaryId } from "../BirdBotTypes";
import type { BirdBotRoomMetadata } from "../BirdBotTypes";

export default class BirdBotGameplayStateService {
    public static metadata(ctx: CommandOrEventCtx): BirdBotRoomMetadata {
        return ctx.room.roomState.metadata as BirdBotRoomMetadata;
    }

    public static initialize(metadata: BirdBotRoomMetadata): void {
        metadata.playstyle ??= "regular";
        metadata.training ??= null;
        metadata.humanMode ??= false;
    }

    public static resetForLanguageChange(ctx: CommandOrEventCtx): void {
        const metadata = this.metadata(ctx);
        metadata.gameplayLanguage =
            dictionaryIdToBirdbotLanguage[
                ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId
            ];
        metadata.playstyle = "regular";
        metadata.training = null;
        metadata.humanMode = false;
    }

    public static resetIfLanguageChanged(ctx: CommandOrEventCtx): void {
        const language =
            dictionaryIdToBirdbotLanguage[
                ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId
            ];
        const metadata = this.metadata(ctx);
        if (metadata.gameplayLanguage && metadata.gameplayLanguage !== language) {
            this.resetForLanguageChange(ctx);
        }
        metadata.gameplayLanguage = language;
    }

    public static isScoreEligible(ctx: CommandOrEventCtx): boolean {
        const metadata = this.metadata(ctx);
        return metadata.gameMode !== "custom" && metadata.training === null && !metadata.humanMode;
    }
}
