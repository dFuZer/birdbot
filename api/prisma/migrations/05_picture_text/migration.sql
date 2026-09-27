-- JKLM chatter pictures are raw base64 (often multi-KB), not short URLs.
ALTER TABLE "player_cosmetics"
ALTER COLUMN "picture_url" TYPE TEXT;
