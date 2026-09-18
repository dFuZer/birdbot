import Logger from "../../../lib/class/Logger.class";
import Utilitary from "../../../lib/class/Utilitary.class";
import type BirdBot from "../BirdBot.class";
import BirdBotUtils from "../BirdBotUtils.class";
import BirdBotApiWriteQueue from "./BirdBotApiWriteQueue.service";
import BirdBotRoomCheckpointService from "./BirdBotRoomCheckpoint.service";
import BirdBotStaffSync from "./BirdBotStaffSync.service";

type LifecycleExit = (code: number) => void;

export default class BirdBotLifecycle {
    public static readonly SHUTDOWN_TIMEOUT_MS = 20_000;
    public static readonly QUEUE_DRAIN_TIMEOUT_MS = 8_000;

    private shutdownPromise: Promise<void> | null = null;

    constructor(
        private readonly bot: BirdBot,
        private readonly exit: LifecycleExit = (code) => process.exit(code),
    ) {}

    public markReady(): void {
        this.bot.acceptingTraffic = true;
        this.bot.shuttingDown = false;
    }

    public async shutdown(signal: string): Promise<void> {
        if (this.shutdownPromise) return this.shutdownPromise;
        this.shutdownPromise = this.shutdownNow(signal);
        return this.shutdownPromise;
    }

    private async shutdownNow(signal: string): Promise<void> {
        this.bot.shuttingDown = true;
        this.bot.acceptingTraffic = false;
        Logger.log({
            message: `Graceful shutdown started (${signal})`,
            path: "BirdBotLifecycle.service.ts",
        });

        const forceExit = setTimeout(() => {
            Logger.error({
                message: "Graceful shutdown timed out; exiting",
                path: "BirdBotLifecycle.service.ts",
            });
            this.exit(1);
        }, BirdBotLifecycle.SHUTDOWN_TIMEOUT_MS);
        forceExit.unref?.();

        try {
            await this.bot.stopServer();
            this.bot.clearPeriodicTasks();
            BirdBotStaffSync.stop();

            for (const room of Object.values(this.bot.rooms)) {
                BirdBotUtils.flushPendingRegistrationsOnRoom(room);
            }
            const remaining = await BirdBotApiWriteQueue.drain(BirdBotLifecycle.QUEUE_DRAIN_TIMEOUT_MS);
            if (remaining > 0) {
                Logger.warn({
                    message: `Write queue still had ${remaining} item(s) after drain timeout`,
                    path: "BirdBotLifecycle.service.ts",
                });
            }

            await BirdBotRoomCheckpointService.saveAll(Object.values(this.bot.rooms));
            Utilitary.disconnectRoomsForRestart(this.bot);
            Logger.log({
                message: "Graceful shutdown complete; leaving room registry intact",
                path: "BirdBotLifecycle.service.ts",
            });
            clearTimeout(forceExit);
            this.exit(0);
        } catch (error) {
            Logger.error({
                message: "Graceful shutdown failed",
                path: "BirdBotLifecycle.service.ts",
                error,
            });
            clearTimeout(forceExit);
            this.exit(1);
        }
    }
}
