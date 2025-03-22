import { RecordsEnum } from "@/records";

export default function ScoreDisplayComponent({ score, recordType }: { score: number; recordType: RecordsEnum }) {
    if (recordType === RecordsEnum.TIME) {
        return <div>{score} milliseconds</div>;
    }
    return <div>{score} points</div>;
}
