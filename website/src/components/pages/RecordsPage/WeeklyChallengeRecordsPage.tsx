import { type LanguageEnum } from "@/lib/records";
import {
    getUtcDateDisplay,
    getWeeklyChallengeObjective,
    WEEKLY_CHALLENGE_NAMES,
    type IWeeklyChallengeLeaderboard,
} from "@/lib/weeklyChallenges";
import PlayerCard from "../common/PlayerCard";
import PlayerRow from "../common/PlayerRow";
import RecordsListLayout from "../common/RecordListLayout";
import WeeklyChallengeScoreDisplay from "./WeeklyChallengeScoreDisplay";
import WeeklyChallengeSelectors from "./WeeklyChallengeSelectors";

type WeeklyChallengeRecordsPageProps = {
    language: LanguageEnum;
    leaderboard: IWeeklyChallengeLeaderboard | null;
    weekOptions: { id: string; label: string }[];
    maxPage: number;
    isFirstPage: boolean;
};

export default function WeeklyChallengeRecordsPage({
    language,
    leaderboard,
    weekOptions,
    maxPage,
    isFirstPage,
}: WeeklyChallengeRecordsPageProps) {
    const period = leaderboard?.period ?? null;
    const entries = (leaderboard?.entries ?? []).map((entry) => ({
        ...entry,
        id: entry.playerId,
        name: entry.username ?? "Unknown player",
    }));
    const top3 = isFirstPage ? entries.slice(0, 3) : [];
    const others = isFirstPage ? entries.slice(3) : entries;

    const score = (entry: (typeof entries)[number]) =>
        period ? (
            <WeeklyChallengeScoreDisplay
                ranking={period.config.ranking}
                primaryValue={entry.primaryValue}
                secondaryValue={entry.secondaryValue}
            />
        ) : null;

    const rows = others.map((entry) => (
        <PlayerRow key={entry.id} playerData={entry} PlayerRowContentSection={<div>{score(entry)}</div>} />
    ));

    const cards = top3.map((entry) => (
        <div key={entry.id} className={`h-full ${entry.rank === 1 ? "col-span-1 sm:col-span-2 md:col-span-1" : ""}`}>
            <PlayerCard
                playerData={entry}
                className="block h-full"
                PlayerCardContentSection={
                    <div className="h-[2rem] space-y-1">
                        <div className="flex items-center justify-center font-medium">{score(entry)}</div>
                    </div>
                }
            />
        </div>
    ));

    return (
        <RecordsListLayout
            maxPage={maxPage}
            emptyMessage={period ? "No completions for this week" : "Challenge of the Week is not available right now"}
            Selectors={
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:flex">
                        <WeeklyChallengeSelectors language={language} periodId={period?.id ?? null} weekOptions={weekOptions} />
                    </div>
                    {period ? (
                        <div className="border-primary-700/30 bg-primary-700/5 rounded-xl border px-4 py-3">
                            <p className="text-primary-700 text-xs font-bold tracking-[.2rem]">CHALLENGE OF THE WEEK</p>
                            <p className="mt-1 text-lg font-bold">
                                {WEEKLY_CHALLENGE_NAMES[period.kind]}{" "}
                                <span className="text-sm font-normal text-neutral-500">
                                    {getUtcDateDisplay(period.startsAt)} to {getUtcDateDisplay(period.endsAt - 1)} (UTC)
                                </span>
                            </p>
                            <p className="text-neutral-700">{getWeeklyChallengeObjective(period, language)}</p>
                            <p className="mt-1 text-sm text-neutral-500">
                                To take part, create your own room with /b on jklm.fun, then type /challenge.
                            </p>
                        </div>
                    ) : null}
                </div>
            }
            Rows={rows}
            Cards={cards}
        />
    );
}
