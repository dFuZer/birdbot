-- CreateEnum
CREATE TYPE "bot_staff_role" AS ENUM ('ADMIN', 'AUTOMOD');

-- CreateTable
CREATE TABLE "bot_staff" (
    "account_name" VARCHAR(120) NOT NULL,
    "role" "bot_staff_role" NOT NULL,
    "updated_by" VARCHAR(80) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_staff_pkey" PRIMARY KEY ("account_name","role")
);

-- CreateTable
CREATE TABLE "bot_room" (
    "room_code" VARCHAR(16) NOT NULL,
    "user_token" VARCHAR(120) NOT NULL,
    "server_url" VARCHAR(500),
    "creator_auth_id" VARCHAR(120),
    "target_config" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_room_pkey" PRIMARY KEY ("room_code")
);

-- CreateTable
CREATE TABLE "ban_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_account" VARCHAR(120) NOT NULL,
    "room_code" VARCHAR(16) NOT NULL,
    "moderator_accounts" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ban_event_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "word" ADD COLUMN "idempotency_key" VARCHAR(140);

UPDATE "word"
SET "idempotency_key" = gen_random_uuid()::text
WHERE "idempotency_key" IS NULL;

ALTER TABLE "word" ALTER COLUMN "idempotency_key" SET NOT NULL;

CREATE UNIQUE INDEX "word_idempotency_key_key" ON "word"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "game_recap_game_id_player_id_key" ON "game_recap"("game_id", "player_id");

-- CreateIndex
CREATE INDEX "ban_event_room_code_created_at_idx" ON "ban_event"("room_code", "created_at");

-- CreateIndex
CREATE INDEX "ban_event_player_account_created_at_idx" ON "ban_event"("player_account", "created_at");

-- Seed initial admin from former admins.txt
INSERT INTO "bot_staff" ("account_name", "role", "updated_by", "updated_at", "created_at")
VALUES ('dfuzer', 'ADMIN', 'migration:6_safety_catchup', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
