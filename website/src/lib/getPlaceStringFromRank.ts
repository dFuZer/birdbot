export default function getPlaceStringFromRank(rank: number) {
    if (rank === 1) {
        return "1st place";
    } else if (rank === 2) {
        return "2nd place";
    } else if (rank === 3) {
        return "3rd place";
    } else {
        return `${rank}th place`;
    }
}
