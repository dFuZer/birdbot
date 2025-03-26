import { RecordsEnum } from "@/lib/records";

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
    if (recordType === RecordsEnum.TIME) {
        return <div>{getTimeDisplayFromMilliseconds(score)}</div>;
    }
    if (
        [
            RecordsEnum.WORDS,
            RecordsEnum.HYPHEN,
            RecordsEnum.MORE_THAN_20_LETTERS,
            RecordsEnum.PREVIOUS_SYLLABLE,
            RecordsEnum.NO_DEATH,
        ].includes(recordType)
    ) {
        return <div>{score} words</div>;
    }
    if ([RecordsEnum.DEPLETED_SYLLABLES].includes(recordType)) {
        return <div>{score} syllables</div>;
    }
    if ([RecordsEnum.HYPHEN, RecordsEnum.MORE_THAN_20_LETTERS].includes(recordType)) {
        return <div>{score} letters</div>;
    }
    if (RecordsEnum.ALPHA === recordType) {
        return <div>{getAlphaDisplay(score)}</div>;
    }
    if (RecordsEnum.FLIPS === recordType) {
        return <div>{score} flips</div>;
    }
    return <div>{score} points</div>;
}
