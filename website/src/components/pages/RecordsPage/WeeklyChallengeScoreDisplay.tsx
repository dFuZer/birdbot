import { getPreciseTimeDisplay, type WeeklyChallengeRankingKey } from "@/lib/weeklyChallenges";

function Sm({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-normal text-neutral-500">{children}</span>;
}

function MetricValue({ metric, value }: { metric: WeeklyChallengeRankingKey["metric"]; value: number }) {
    if (metric === "elapsed_ms") return <>{getPreciseTimeDisplay(value)}</>;
    return (
        <>
            {value} <Sm>{metric === "words" ? "words" : value === 1 ? "alphabet" : "alphabets"}</Sm>
        </>
    );
}

type WeeklyChallengeScoreDisplayProps = {
    ranking: { primary: WeeklyChallengeRankingKey; secondary: WeeklyChallengeRankingKey | null };
    primaryValue: number;
    secondaryValue: number | null;
};

export default function WeeklyChallengeScoreDisplay({ ranking, primaryValue, secondaryValue }: WeeklyChallengeScoreDisplayProps) {
    return (
        <span className="text-md font-bold text-neutral-950">
            <MetricValue metric={ranking.primary.metric} value={primaryValue} />
            {ranking.secondary && secondaryValue !== null ? (
                <Sm>
                    {" · "}
                    <MetricValue metric={ranking.secondary.metric} value={secondaryValue} />
                </Sm>
            ) : null}
        </span>
    );
}
