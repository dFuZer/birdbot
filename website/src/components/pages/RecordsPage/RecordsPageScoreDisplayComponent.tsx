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

export default function ScoreDisplayComponent({ score, recordType }: ScoreDisplayProps) {
    if (recordType === recordsEnumSchema.Values.time) {
        return <div>{getTimeDisplayFromMilliseconds(score)}</div>;
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
        return <div>{score} words</div>;
    }
    if ([recordsEnumSchema.Values.depleted_syllables as string].includes(recordType)) {
        return <div>{score} syllables</div>;
    }
    if ([recordsEnumSchema.Values.hyphen as string, recordsEnumSchema.Values.more_than_20_letters].includes(recordType)) {
        return <div>{score} letters</div>;
    }
    if (recordsEnumSchema.Values.alpha === recordType) {
        return <div>{getAlphaDisplay(score)}</div>;
    }
    if (recordsEnumSchema.Values.flips === recordType) {
        return <div>{score} flips</div>;
    }
    return <div>{score} points</div>;
}
