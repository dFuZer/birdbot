import type { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import { dictionaryIdToBirdbotLanguage } from "../BirdBotConstants";
import type { BirdBotSupportedDictionaryId } from "../BirdBotTypes";
import type { BirdBotRoomMetadata } from "../BirdBotTypes";
import { l, t } from "../texts/BirdBotTextUtils";

export default class BirdBotGameplayStateService {
    public static metadata(ctx: CommandOrEventCtx): BirdBotRoomMetadata {
        return ctx.room.roomState.metadata as BirdBotRoomMetadata;
    }

    public static initialize(metadata: BirdBotRoomMetadata): void {
        metadata.playstyle ??= "regular";
        metadata.training ??= null;
        metadata.rankedBlockedUntilSeating ??= false;
        metadata.nextDelayMs ??= 0;
    }

    public static resetForLanguageChange(ctx: CommandOrEventCtx): void {
        const metadata = this.metadata(ctx);
        metadata.gameplayLanguage =
            dictionaryIdToBirdbotLanguage[
                ctx.room.roomState.gameData!.rules.dictionaryId as BirdBotSupportedDictionaryId
            ];
        metadata.playstyle = "regular";
        metadata.training = null;
        metadata.rankedBlockedUntilSeating = false;
        metadata.nextDelayMs = 0;
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
        return metadata.gameMode !== "custom" && metadata.training === null && !metadata.rankedBlockedUntilSeating;
    }

    public static announceScoreCounting(ctx: CommandOrEventCtx): void {
        const metadata = this.metadata(ctx);
        const inRound = ctx.room.roomState.gameData?.milestone.name === "round";
        if (metadata.gameMode === "custom") {
            ctx.utils.sendChatMessage(
                t("parity.gameplay.unrankedReason", {
                    reason: t("parity.gameplay.unrankedReasonCustom", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "info",
            );
            return;
        }
        if (metadata.training !== null) {
            metadata.rankedBlockedUntilSeating = false;
            ctx.utils.sendChatMessage(
                t("parity.gameplay.unrankedReason", {
                    reason: t("parity.gameplay.unrankedReasonTraining", { lng: l(ctx) }),
                    lng: l(ctx),
                }),
                "info",
            );
            return;
        }
        if (inRound) {
            metadata.rankedBlockedUntilSeating = true;
            ctx.utils.sendChatMessage(t("parity.gameplay.scoresWillCountAfterGame", { lng: l(ctx) }), "success");
            return;
        }
        metadata.rankedBlockedUntilSeating = false;
        ctx.utils.sendChatMessage(t("parity.gameplay.scoresNowCount", { lng: l(ctx) }), "success");
    }

    public static clearRoundScoreBlock(ctx: CommandOrEventCtx): void {
        const metadata = this.metadata(ctx);
        if (!metadata.rankedBlockedUntilSeating) return;
        metadata.rankedBlockedUntilSeating = false;
        if (this.isScoreEligible(ctx)) {
            ctx.utils.sendChatMessage(t("parity.gameplay.scoresNowCount", { lng: l(ctx) }), "success");
        }
    }
}
