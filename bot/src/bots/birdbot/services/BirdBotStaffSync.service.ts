import Logger from "../../../lib/class/Logger.class";
import type Bot from "../../../lib/class/Bot.class";
import type { BotStaffCache } from "../../../lib/class/Bot.class";
import BirdBotParityApiService from "./BirdBotParityApi.service";

const POLL_MS = 30_000;

function fingerprint(admins: string[], automods: string[]): string {
    return `a:${[...admins].sort().join(",")}|m:${[...automods].sort().join(",")}`;
}

export default class BirdBotStaffSync {
    private static timer: NodeJS.Timeout | undefined;

    public static empty(): BotStaffCache {
        return { admins: new Set(), automods: new Set(), fingerprint: fingerprint([], []) };
    }

    public static isAdmin(bot: Bot, authId: string | null | undefined): boolean {
        if (!authId || !bot.botData) return false;
        return bot.botData.staff.admins.has(authId);
    }

    public static isAutomod(bot: Bot, authId: string | null | undefined): boolean {
        if (!authId || !bot.botData) return false;
        return bot.botData.staff.automods.has(authId);
    }

    public static async refresh(bot: Bot): Promise<void> {
        if (!bot.botData) return;
        const remote = await BirdBotParityApiService.getStaff();
        const nextFingerprint = fingerprint(remote.admins, remote.automods);
        if (nextFingerprint === bot.botData.staff.fingerprint) return;
        bot.botData.staff = {
            admins: new Set(remote.admins),
            automods: new Set(remote.automods),
            fingerprint: nextFingerprint,
        };
        Logger.log({
            message: `Staff synced: ${remote.admins.length} admin(s), ${remote.automods.length} automod(s)`,
            path: "BirdBotStaffSync.ts",
        });
    }

    public static start(bot: Bot): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            void this.refresh(bot).catch((error) => {
                Logger.error({
                    message: "Staff sync poll failed",
                    path: "BirdBotStaffSync.ts",
                    error,
                });
            });
        }, POLL_MS);
        this.timer.unref?.();
    }

    public static stop(): void {
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
    }
}
