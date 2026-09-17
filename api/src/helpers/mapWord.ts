import { SubmitResultType } from "@prisma/client";

const submitResultMap: Record<SubmitResultType, string> = {
    SUCCESS: "success",
    FAILS_PROMPT: "failsPrompt",
    INVALID_WORD: "invalidWord",
    NO_TEXT: "noText",
    ALREADY_USED: "alreadyUsed",
    BOMB_EXPLODED: "bombExploded",
};

export type WordRow = {
    id: string;
    created_at: Date;
    word: string;
    prompt: string;
    flip: boolean;
    submit_result: SubmitResultType;
    duration_ms: number | null;
    reaction_ms: number | null;
    player_id: string;
    account_name: string;
    username: string | null;
};

export function mapWordRow(row: WordRow) {
    return {
        id: row.id,
        createdAt: row.created_at.toISOString(),
        word: row.word,
        prompt: row.prompt,
        flip: row.flip,
        submitResult: submitResultMap[row.submit_result],
        durationMs: row.duration_ms,
        reactionMs: row.reaction_ms,
        playerId: row.player_id,
        accountName: row.account_name,
        username: row.username ?? row.account_name,
    };
}
