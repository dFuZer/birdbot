-- Existing rows describe per-word duration/reaction/streak badges and cannot
-- be converted into BBV7 category meta records.
TRUNCATE TABLE "player_milestone";

DROP INDEX "player_milestone_player_id_type_milestone_key";
DROP INDEX "player_milestone_player_id_type_achieved_at_idx";

ALTER TABLE "player_milestone"
    DROP COLUMN "milestone",
    ADD COLUMN "language" "language" NOT NULL,
    ADD COLUMN "mode" "game_mode" NOT NULL,
    ADD COLUMN "category" VARCHAR(40) NOT NULL,
    ADD COLUMN "milestone" INTEGER NOT NULL;

CREATE UNIQUE INDEX "player_milestone_player_id_type_language_mode_category_milestone_key"
    ON "player_milestone"("player_id", "type", "language", "mode", "category", "milestone");

CREATE INDEX "player_milestone_type_language_mode_category_milestone_value_idx"
    ON "player_milestone"("type", "language", "mode", "category", "milestone", "value");

CREATE INDEX "player_milestone_player_id_type_language_mode_idx"
    ON "player_milestone"("player_id", "type", "language", "mode");
