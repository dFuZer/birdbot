-- AlterTable
ALTER TABLE "game_recap" ADD COLUMN     "adverbs_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "chemicals_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creatures_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ethnonyms_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plants_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slurs_count" INTEGER NOT NULL DEFAULT 0;

