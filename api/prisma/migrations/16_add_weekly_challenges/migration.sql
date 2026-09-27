-- CreateEnum
CREATE TYPE "weekly_challenge_kind" AS ENUM ('THIRTY_OF_A_LETTER', 'PROMPT_MEMORY_SPRINT', 'ALPHA_SPRINT', 'FIVEFOLD_ALPHABET', 'BLITZ_SURVIVAL', 'SUB50_SURVIVAL', 'SUB500_LIFE_GAIN');

-- CreateTable
CREATE TABLE "weekly_challenge_period" (
    "id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" "weekly_challenge_kind" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "config_version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_challenge_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_challenge_best_result" (
    "period_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "player_id" UUID NOT NULL,
    "primary_value" INTEGER NOT NULL,
    "secondary_value" INTEGER,
    "elapsed_ms" INTEGER NOT NULL,
    "words_count" INTEGER NOT NULL,
    "game_id" UUID NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_challenge_best_result_pkey" PRIMARY KEY ("period_id","language","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_challenge_period_sequence_key" ON "weekly_challenge_period"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_challenge_period_starts_at_key" ON "weekly_challenge_period"("starts_at");

-- CreateIndex
CREATE INDEX "weekly_challenge_period_starts_at_ends_at_idx" ON "weekly_challenge_period"("starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "weekly_challenge_best_result_period_id_language_primary_val_idx" ON "weekly_challenge_best_result"("period_id", "language", "primary_value", "secondary_value");

-- AddForeignKey
ALTER TABLE "weekly_challenge_best_result" ADD CONSTRAINT "weekly_challenge_best_result_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "weekly_challenge_period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_challenge_best_result" ADD CONSTRAINT "weekly_challenge_best_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

