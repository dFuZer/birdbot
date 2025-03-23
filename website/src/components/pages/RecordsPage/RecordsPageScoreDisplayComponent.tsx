import { RecordsEnum } from "@/records";

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

type ScoreDisplayProps = {
    score: number;
    recordType: RecordsEnum;
};

export default function ScoreDisplayComponent({ score, recordType }: ScoreDisplayProps) {
    if (recordType === RecordsEnum.TIME) {
        return <div>{getTimeDisplayFromMilliseconds(score)}</div>;
    }
    if (recordType === RecordsEnum.WORDS) {
        return <div>{score} words</div>;
    }
    return <div>{score} points</div>;
}
