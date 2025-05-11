import { RecordsEnum, recordsEnumSchema } from "@/lib/records";

function getTimeDisplayFromMilliseconds(milliseconds: number) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    const hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    const minutesDisplay = minutes.toString().padStart(2, "0");
    const secondsDisplay = seconds.toString().padStart(2, "0");
    const hoursDisplay = hours.toString().padStart(2, "0");
    return `${hoursDisplay}:${minutesDisplay}:${secondsDisplay}`;
}

function getAlphaDisplay(score: number) {
    const alphas = Math.floor(score / 26);
    const remaining = score % 26;
    const remainingLetter = String.fromCharCode(65 + remaining);
    return `${alphas} (${remainingLetter})`;
}

type ScoreDisplayProps = {
    score: number;
    recordType: RecordsEnum;
};

function Sm({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-normal text-neutral-500">{children}</span>;
}

function Md({ children }: { children: React.ReactNode }) {
    return <span className="text-md font-bold text-neutral-950">{children}</span>;
}

export default function ScoreDisplayComponent({ score, recordType }: ScoreDisplayProps) {
    if (recordType === recordsEnumSchema.Values.time) {
        return <Md>{getTimeDisplayFromMilliseconds(score)}</Md>;
    }
    if (
        [
            recordsEnumSchema.Values.word as string,
            recordsEnumSchema.Values.hyphen,
            recordsEnumSchema.Values.more_than_20_letters,
            recordsEnumSchema.Values.previous_syllable,
            recordsEnumSchema.Values.no_death,
        ].includes(recordType)
    ) {
        return (
            <Md>
                {score} <Sm>words</Sm>
            </Md>
        );
    }
    if ([recordsEnumSchema.Values.depleted_syllables as string].includes(recordType)) {
        return (
            <Md>
                {score} <Sm>syllables</Sm>
            </Md>
        );
    }
    if ([recordsEnumSchema.Values.hyphen as string, recordsEnumSchema.Values.more_than_20_letters].includes(recordType)) {
        return (
            <Md>
                {score} <Sm>letters</Sm>
            </Md>
        );
    }
    if (recordsEnumSchema.Values.alpha === recordType) {
        return <Md>{getAlphaDisplay(score)}</Md>;
    }
    if (recordsEnumSchema.Values.flips === recordType) {
        return (
            <Md>
                {score} <Sm>flips</Sm>
            </Md>
        );
    }
    return (
        <Md>
            {score} <Sm>points</Sm>
        </Md>
    );
}
