import type Bot from "../../../lib/class/Bot.class";
import type { CommandOrEventCtx } from "../../../lib/class/CommandUtils.class";
import Logger from "../../../lib/class/Logger.class";
import type Room from "../../../lib/class/Room.class";
import Utilitary from "../../../lib/class/Utilitary.class";
import type { Chatter } from "../../../lib/types/gameTypes";
import type { EventCtx } from "../../../lib/types/libEventTypes";
import { dictionaryIdToBirdbotLanguage, recordsUtils } from "../BirdBotConstants";
import type {
    BirdBotLanguage,
    BirdBotRoomMetadata,
    BirdBotSupportedDictionaryId,
    BirdBotWeeklyChallengeRoomState,
    PlayerGameScores,
} from "../BirdBotTypes";
import {
    isInstantObjectiveReached,
    matchWeeklyChallenge,
    selectActiveWeeklyChallenge,
    WEEKLY_CHALLENGE_LEADERBOARD_URL,
    weeklyChallengeResultValues,
    weeklyChallengeRulesFingerprint,
    type WeeklyChallengeConfig,
    type WeeklyChallengeMetrics,
    type WeeklyChallengePeriod,
} from "../BirdBotWeeklyChallengeRules";
import { t } from "../texts/BirdBotTextUtils";
import BirdBotApiWriteQueue from "./BirdBotApiWriteQueue.service";
import BirdBotModerationService from "./BirdBotModeration.service";
import BirdBotParityApiService, { weeklyChallengeSubmissionSchema } from "./BirdBotParityApi.service";

const POLL_MS = 5 * 60_000;
const ROLLOVER_CHECK_MS = 30_000;
const CELEBRATION_LEAD_MS = 1000;
const BACKGROUND_REFRESH_THROTTLE_MS = 30_000;

type RoomLike = Pick<Room, "roomState">;

function roomLanguage(room: RoomLike): BirdBotLanguage | undefined {
    const dictionaryId = room.roomState.gameData?.rules.dictionaryId;
    return dictionaryId ? dictionaryIdToBirdbotLanguage[dictionaryId as BirdBotSupportedDictionaryId] : undefined;
}

export default class BirdBotWeeklyChallengeService {
    private static current: WeeklyChallengePeriod | null = null;
    private static next: WeeklyChallengePeriod | null = null;
    private static pollTimer: NodeJS.Timeout | undefined;
    private static rolloverTimer: NodeJS.Timeout | undefined;
    private static refreshing: Promise<void> | null = null;
    private static lastBackgroundRefreshAt = 0;

    public static setPeriodsForTests(current: WeeklyChallengePeriod | null, next: WeeklyChallengePeriod | null = null): void {
        this.current = current;
        this.next = next;
    }

    public static async refresh(): Promise<void> {
        if (this.refreshing) return this.refreshing;
        this.refreshing = (async () => {
            try {
                const remote = await BirdBotParityApiService.getCurrentWeeklyChallenge();
                if (remote.current.id !== this.current?.id) {
                    Logger.log({
                        message: `Weekly challenge loaded: ${remote.current.kind} (#${remote.current.sequence})`,
                        path: "BirdBotWeeklyChallenge.service.ts",
                    });
                }
                this.current = remote.current;
                this.next = remote.next;
            } catch (error) {
                Logger.error({
                    message: "Weekly challenge refresh failed; keeping the cached period",
                    path: "BirdBotWeeklyChallenge.service.ts",
                    error,
                });
            } finally {
                this.refreshing = null;
            }
        })();
        return this.refreshing;
    }

    public static start(bot: Bot): void {
        this.stop();
        this.pollTimer = setInterval(() => void this.refresh(), POLL_MS);
        this.pollTimer.unref?.();
        this.rolloverTimer = setInterval(() => this.checkRollover(bot), ROLLOVER_CHECK_MS);
        this.rolloverTimer.unref?.();
    }

    public static stop(): void {
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.rolloverTimer) clearInterval(this.rolloverTimer);
        this.pollTimer = undefined;
        this.rolloverTimer = undefined;
    }

    public static activePeriod(now = Date.now()): WeeklyChallengePeriod | null {
        const period = selectActiveWeeklyChallenge(this.current, this.next, now);
        if (period !== this.current && now - this.lastBackgroundRefreshAt >= BACKGROUND_REFRESH_THROTTLE_MS) {
            this.lastBackgroundRefreshAt = now;
            void this.refresh();
        }
        return period;
    }

    public static state(room: RoomLike): BirdBotWeeklyChallengeRoomState {
        const metadata = room.roomState.metadata as BirdBotRoomMetadata;
        metadata.weeklyChallenge ??= { matchedPeriodId: null, completedPeerIds: [], pendingCelebration: false };
        return metadata.weeklyChallenge;
    }

    public static resetRound(room: RoomLike): void {
        const state = this.state(room);
        state.completedPeerIds = [];
        state.pendingCelebration = false;
    }

    public static matchingPeriod(room: RoomLike, now = Date.now()): WeeklyChallengePeriod | null {
        const rules = room.roomState.gameData?.rules;
        if (!rules) return null;
        const period = this.activePeriod(now);
        return matchWeeklyChallenge(period, roomLanguage(room), rules) ? period : null;
    }

    /** Re-evaluates confirmed room rules; returns whether they match and whether that changed. */
    public static syncRoomMatch(room: RoomLike): { matched: boolean; changed: boolean } {
        const state = this.state(room);
        const period = this.matchingPeriod(room);
        const nextId = period?.id ?? null;
        const changed = state.matchedPeriodId !== nextId;
        state.matchedPeriodId = nextId;
        return { matched: nextId !== null, changed };
    }

    public static objectiveText(period: WeeklyChallengePeriod, lng: BirdBotLanguage): string {
        const languageConfig = period.config.languages[lng];
        return t("weeklyChallenge.explain", {
            name: t(`weeklyChallenge.kinds.${period.kind}.name`, { lng }),
            objective: t(`weeklyChallenge.kinds.${period.kind}.objective`, {
                letter: languageConfig?.targetLetter?.toUpperCase() ?? "",
                target: period.config.objective.target ?? undefined,
                lng,
            }),
            url: WEEKLY_CHALLENGE_LEADERBOARD_URL,
            lng,
        });
    }

    public static greetingAddon(lng: BirdBotLanguage): string | null {
        const period = this.activePeriod();
        if (!period) return null;
        return `${this.objectiveText(period, lng)} ${t("weeklyChallenge.howToPlay", { lng })}`;
    }

    public static rulesFor(period: WeeklyChallengePeriod, lng: BirdBotLanguage) {
        return period.config.languages[lng]?.rules ?? null;
    }

    public static handleWord(
        ctx: EventCtx,
        chatter: Chatter,
        scores: PlayerGameScores,
        promptMemoryChain: number,
    ): void {
        this.handleInstantEvent(ctx, chatter, scores, { type: "word", promptMemoryChain, alpha: scores.alpha });
    }

    public static handleFlip(ctx: EventCtx, chatter: Chatter, scores: PlayerGameScores): void {
        this.handleInstantEvent(ctx, chatter, scores, { type: "flip" });
    }

    public static handleDeath(ctx: EventCtx, chatter: Chatter, scores: PlayerGameScores): void {
        const period = this.roundPeriod(ctx, chatter);
        if (!period || period.config.objective.type !== "survival") return;
        const metrics = this.metrics(ctx, scores);
        if (weeklyChallengeResultValues(period.config.ranking, metrics).primaryValue <= 0) return;
        this.complete(ctx, period, chatter, metrics);
    }

    /** Called when it is BirdBot's turn; returns how long to hold the celebration before answering. */
    public static consumeCelebration(ctx: EventCtx): number {
        const state = this.state(ctx.room);
        if (!state.pendingCelebration) return 0;
        state.pendingCelebration = false;
        const lng = roomLanguage(ctx.room) ?? "en";
        ctx.utils.previewWord(t("weeklyChallenge.celebration", { lng }));
        const bombMs = (ctx.room.roomState.gameData?.rules.minTurnDuration ?? 0) * 1000;
        return Math.max(0, bombMs - CELEBRATION_LEAD_MS);
    }

    private static handleInstantEvent(
        ctx: EventCtx,
        chatter: Chatter,
        scores: PlayerGameScores,
        event: Parameters<typeof isInstantObjectiveReached>[1],
    ): void {
        const period = this.roundPeriod(ctx, chatter);
        if (!period || !isInstantObjectiveReached(period.config.objective, event)) return;
        this.complete(ctx, period, chatter, this.metrics(ctx, scores));
    }

    private static roundPeriod(ctx: EventCtx, chatter: Chatter): WeeklyChallengePeriod | null {
        if (chatter.peerId === ctx.room.roomState.myPeerId) return null;
        if (ctx.room.roomState.gameData?.milestone.name !== "round") return null;
        const metadata = ctx.room.roomState.metadata as BirdBotRoomMetadata;
        if (metadata.training) return null;
        if (this.state(ctx.room).completedPeerIds.includes(String(chatter.peerId))) return null;
        return this.matchingPeriod(ctx.room);
    }

    private static metrics(ctx: EventCtx, scores: PlayerGameScores): WeeklyChallengeMetrics {
        return {
            elapsed_ms: Math.max(0, Date.now() - ctx.room.roomState.roundStartTimestamp),
            words: scores.words,
            flips: scores.flips,
        };
    }

    public static formatScore(config: WeeklyChallengeConfig, metrics: WeeklyChallengeMetrics, lng: BirdBotLanguage): string {
        const format = (metric: keyof WeeklyChallengeMetrics) => {
            if (metric === "elapsed_ms") return recordsUtils.time.format(metrics.elapsed_ms);
            const recordType = metric === "words" ? "word" : "flips";
            return t(`lib.recordType.${recordType}.score`, { count: metrics[metric], lng });
        };
        const parts = [format(config.ranking.primary.metric)];
        if (config.ranking.secondary) parts.push(format(config.ranking.secondary.metric));
        return parts.join(" — ");
    }

    private static complete(
        ctx: EventCtx,
        period: WeeklyChallengePeriod,
        chatter: Chatter,
        metrics: WeeklyChallengeMetrics,
    ): void {
        const state = this.state(ctx.room);
        state.completedPeerIds.push(String(chatter.peerId));
        const lng = roomLanguage(ctx.room) ?? "en";
        const score = this.formatScore(period.config, metrics, lng);
        const roundStartTimestamp = ctx.room.roomState.roundStartTimestamp;
        const celebrate = () => {
            if (ctx.room.roomState.roundStartTimestamp !== roundStartTimestamp) return;
            if (ctx.room.roomState.gameData?.milestone.name !== "round") return;
            this.state(ctx.room).pendingCelebration = true;
        };

        if (!chatter.authId) {
            ctx.utils.sendChatMessage(
                t("weeklyChallenge.completedGuest", { username: chatter.nickname, score, lng }),
                "success",
            );
            celebrate();
            return;
        }

        const authId = chatter.authId;
        const gameId = Utilitary.valueToUUID(ctx.room.roomState.roundStartTimestamp.toString());
        const values = weeklyChallengeResultValues(period.config.ranking, metrics);
        const body = {
            periodId: period.id,
            configVersion: period.configVersion,
            language: lng,
            rulesFingerprint: weeklyChallengeRulesFingerprint(ctx.room.roomState.gameData!.rules),
            player: { authId, nickname: chatter.nickname },
            gameId,
            ...values,
            elapsedMs: metrics.elapsed_ms,
            wordsCount: metrics.words,
            achievedAt: Date.now(),
        };

        void (async () => {
            if (await BirdBotModerationService.isBlacklisted(authId)) {
                if (!ctx.room.isHealthy()) return;
                ctx.utils.sendChatMessage(
                    t("weeklyChallenge.notRanked", {
                        username: chatter.nickname,
                        score,
                        reason: t("parity.gameplay.scoresNotSavedBlacklisted", { lng }),
                        lng,
                    }),
                    "info",
                );
                celebrate();
                return;
            }
            const raw = await BirdBotApiWriteQueue.enqueueWeeklyChallengeResult(
                body,
                BirdBotApiWriteQueue.makeWeeklyChallengeKey(period.id, gameId, authId),
            );
            if (!ctx.room.isHealthy()) return;
            const parsed = weeklyChallengeSubmissionSchema.safeParse(raw);
            if (!parsed.success) {
                ctx.utils.sendChatMessage(
                    t("weeklyChallenge.notRanked", {
                        username: chatter.nickname,
                        score,
                        reason: t("parity.gameplay.scoresNotSavedApi", { lng }),
                        lng,
                    }),
                    "info",
                );
                celebrate();
                return;
            }
            const result = parsed.data;
            const personalBest = result.improved
                ? t("weeklyChallenge.personalBest", { lng })
                : t("weeklyChallenge.previousBest", {
                      best: this.formatScore(
                          period.config,
                          {
                              elapsed_ms: result.best.elapsedMs,
                              words: result.best.wordsCount,
                              flips: period.config.ranking.primary.metric === "flips" ? result.best.primaryValue : 0,
                          },
                          lng,
                      ),
                      lng,
                  });
            ctx.utils.sendChatMessage(
                t("weeklyChallenge.completedRanked", {
                    username: chatter.nickname,
                    score,
                    personalBest,
                    rank: result.rank,
                    total: result.totalPlayers,
                    url: WEEKLY_CHALLENGE_LEADERBOARD_URL,
                    lng,
                }),
                "success",
            );
            celebrate();
        })();
    }

    /** Rooms whose rules matched a period that just ended stop counting and are told about the new one. */
    private static checkRollover(bot: Bot): void {
        for (const room of Object.values(bot.rooms)) {
            const metadata = room.roomState.metadata as Partial<BirdBotRoomMetadata>;
            if (!metadata.wasInitialized || !room.roomState.gameData) continue;
            const previous = this.state(room).matchedPeriodId;
            if (!previous) continue;
            const { matched } = this.syncRoomMatch(room);
            if (matched) continue;
            const lng = roomLanguage(room) ?? "en";
            const period = this.activePeriod();
            Utilitary.sendChatMessage(
                room,
                period
                    ? `${t("weeklyChallenge.ended", { lng })} ${this.objectiveText(period, lng)}`
                    : t("weeklyChallenge.ended", { lng }),
                "info",
            );
        }
    }

    public static isRoomCreatorOrAdmin(ctx: CommandOrEventCtx, authId: string | null): boolean {
        if (ctx.utils.userIsAdmin(authId)) return true;
        const creator = ctx.room.constantRoomData.roomCreatorAuthId;
        return Boolean(authId && creator && creator === authId);
    }
}
