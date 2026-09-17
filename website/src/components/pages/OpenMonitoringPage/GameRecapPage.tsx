import Flag from "@/components/pages/common/Flag";
import GameRecapDownloadButton from "@/components/pages/OpenMonitoringPage/GameRecapDownloadButton";
import GameRecapWordsTable from "@/components/pages/OpenMonitoringPage/GameRecapWordsTable";
import { GameRecapDetail, GameRecapSummary, GameWordsPage } from "@/lib/gameRecaps";
import {
    GAME_MODES_DATA,
    getTimeDisplayFromMilliseconds,
    listedRecords,
    listedRecordsPerLanguage,
    RECORDS_DATA,
    RecordsEnum,
} from "@/lib/records";
import { katibehFont } from "@/app/fonts";
import Link from "next/link";

const STAT_ITEMS: { key: keyof GameRecapSummary; record: RecordsEnum }[] = [
    { key: "wordsCount", record: "word" },
    { key: "flipsCount", record: "flips" },
    { key: "depletedSyllablesCount", record: "depleted_syllables" },
    { key: "alphaCount", record: "alpha" },
    { key: "wordsWithoutDeathCount", record: "no_death" },
    { key: "previousSyllablesCount", record: "previous_syllable" },
    { key: "multiSyllablesCount", record: "multi_syllable" },
    { key: "hyphenWordsCount", record: "hyphen" },
    { key: "moreThan20LettersWordsCount", record: "more_than_20_letters" },
    { key: "slursCount", record: "slur" },
    { key: "creaturesCount", record: "creature" },
    { key: "ethnonymsCount", record: "ethnonym" },
    { key: "chemicalsCount", record: "chemical" },
    { key: "plantsCount", record: "plant" },
    { key: "foodsCount", record: "food" },
    { key: "adverbsCount", record: "adverb" },
];

export default function GameRecapPage({ detail, initialWords }: { detail: GameRecapDetail; initialWords: GameWordsPage }) {
    const recap = detail.recap;
    const durationMs = Math.max(0, new Date(recap.diedAt).getTime() - new Date(recap.startedAt).getTime());
    const listedForLanguage = listedRecordsPerLanguage[recap.language];

    const visibleStats = STAT_ITEMS.filter((item) => {
        if ((listedRecords as readonly RecordsEnum[]).includes(item.record)) {
            return listedForLanguage.includes(item.record as (typeof listedRecords)[number]);
        }
        return true;
    });

    return (
        <div className="flex min-h-screen justify-center px-4 py-6 sm:py-10">
            <div className="flex w-full flex-1 flex-col pb-6 sm:max-w-7xl sm:rounded-xl sm:bg-white/70 sm:p-6 sm:shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link href="/open-monitoring?tab=recaps" className="text-sm text-neutral-600 hover:underline">
                            ← Game recaps
                        </Link>
                        <h1 className={`${katibehFont.className} mt-3 text-4xl leading-none text-neutral-950 sm:text-5xl`}>
                            Game recap
                        </h1>
                    </div>
                    <GameRecapDownloadButton recapId={recap.id} username={recap.username} diedAt={recap.diedAt} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-700">
                    <Link
                        href={`/p/${encodeURIComponent(recap.accountName)}`}
                        className="font-bold text-neutral-950 hover:underline"
                    >
                        {recap.username}
                    </Link>
                    <span className="text-neutral-400">·</span>
                    <span className="flex items-center gap-1.5">
                        <Flag language={recap.language} className="h-4 w-4" />
                        {GAME_MODES_DATA[recap.mode].displayName}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span>{getTimeDisplayFromMilliseconds(durationMs)}</span>
                    <span className="text-neutral-400">·</span>
                    <span>{new Date(recap.diedAt).toLocaleString()}</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {visibleStats.map((item) => (
                        <div key={item.record} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                            <p className="text-xs text-neutral-500">{RECORDS_DATA[item.record].displayName}</p>
                            <p className="text-lg font-semibold text-neutral-950">
                                {(recap[item.key] as number).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                {detail.playersInGame.length > 1 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-neutral-950">Players in this game</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {detail.playersInGame.map((player) => (
                                <Link
                                    key={player.recapId}
                                    href={`/open-monitoring/recaps/${player.recapId}`}
                                    className={`rounded-full border px-3 py-1 text-sm ${
                                        player.recapId === recap.id
                                            ? "border-primary-600 bg-primary-50 text-primary-800"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                                    }`}
                                >
                                    {player.username}
                                    <span className="ml-1 text-neutral-500">{player.wordsCount}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="mt-8 text-lg font-semibold text-neutral-950">Words</h2>
                <GameRecapWordsTable
                    gameId={recap.gameId}
                    playerId={recap.playerId}
                    playerUsername={recap.username}
                    gameWordCount={detail.gameWordCount}
                    initialPage={initialWords}
                />
            </div>
        </div>
    );
}
