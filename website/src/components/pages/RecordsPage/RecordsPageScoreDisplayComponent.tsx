import { RecordsEnum } from "@/records";

type ScoreDisplayProps = {
    score: number;
    recordType: RecordsEnum;
};

export default function ScoreDisplayComponent({ score, recordType }: ScoreDisplayProps) {
    if (recordType === RecordsEnum.TIME) {
        return <div>{score} milliseconds</div>;
    }
    return <div>{score} points</div>;
}
