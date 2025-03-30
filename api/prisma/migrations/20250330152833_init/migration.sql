-- CreateEnum
CREATE TYPE "language" AS ENUM ('FR', 'EN', 'DE', 'ES', 'BRPT');

-- CreateEnum
CREATE TYPE "game_mode" AS ENUM ('REGULAR', 'EASY', 'BLITZ', 'SUB500', 'SUB50', 'FREEPLAY');

-- CreateTable
CREATE TABLE "player_username" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_username_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auth_nickname" VARCHAR(50) NOT NULL,
    "auth_provider" VARCHAR(50) NOT NULL,
    "auth_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game" (
    "id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "language" "language" NOT NULL,
    "mode" "game_mode" NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_recap" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "died_at" TIMESTAMP(3) NOT NULL,
    "words_count" INTEGER NOT NULL,
    "flips_count" INTEGER NOT NULL,
    "depleted_syllables_count" INTEGER NOT NULL,
    "alpha_count" INTEGER NOT NULL,
    "words_without_death_count" INTEGER NOT NULL,
    "previous_syllables_count" INTEGER NOT NULL,
    "multi_syllables_count" INTEGER NOT NULL,
    "hyphen_words_count" INTEGER NOT NULL,
    "more_than_20_letters_words_count" INTEGER NOT NULL,

    CONSTRAINT "game_recap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "player_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "word" VARCHAR(50) NOT NULL,
    "flip" BOOLEAN NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "prompt" VARCHAR(10) NOT NULL,

    CONSTRAINT "word_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "player_username" ADD CONSTRAINT "player_username_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_recap" ADD CONSTRAINT "game_recap_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_recap" ADD CONSTRAINT "game_recap_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word" ADD CONSTRAINT "word_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word" ADD CONSTRAINT "word_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
