DROP TRIGGER IF EXISTS "set_player_avatar_url_trigger" ON "website_user_to_player";
DROP FUNCTION IF EXISTS "set_player_avatar_url"();

UPDATE "player"
SET "metadata" = "metadata" - 'avatar_url'
WHERE "metadata" ? 'avatar_url';

ALTER TABLE "website_user"
    ALTER COLUMN "oauth_avatar" DROP NOT NULL;
