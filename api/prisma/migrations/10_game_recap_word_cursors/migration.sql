CREATE INDEX "game_recap_died_at_id_idx" ON "game_recap" ("died_at", "id");

CREATE INDEX "word_game_created_id_idx" ON "word" ("game_id", "created_at", "id");
