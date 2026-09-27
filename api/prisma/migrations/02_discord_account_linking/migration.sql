/*
  Warnings:

  - You are about to drop the `oauth_link_to_player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oauth_link_to_player" DROP CONSTRAINT "oauth_link_to_player_player_id_fkey";

-- AlterTable
ALTER TABLE "player" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';

-- DropTable
DROP TABLE "oauth_link_to_player";

-- DropTable
DROP TABLE "session";

-- CreateTable
CREATE TABLE "website_session" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "website_user_id" UUID NOT NULL,

    CONSTRAINT "website_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_user" (
    "id" UUID NOT NULL,
    "oauth_identifier" TEXT NOT NULL,
    "oauth_username" TEXT NOT NULL,
    "oauth_global_name" TEXT NOT NULL,
    "oauth_avatar" TEXT NOT NULL,
    "oauth_provider" TEXT NOT NULL,

    CONSTRAINT "website_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_user_to_player" (
    "player_id" UUID NOT NULL,
    "website_user_id" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "website_user_to_player_token" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "website_user_id" UUID NOT NULL,

    CONSTRAINT "website_user_to_player_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_session_session_token_key" ON "website_session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_oauth_identifier_key" ON "website_user"("oauth_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_to_player_player_id_key" ON "website_user_to_player"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_to_player_website_user_id_key" ON "website_user_to_player"("website_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_to_player_token_token_key" ON "website_user_to_player_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "website_user_to_player_token_website_user_id_key" ON "website_user_to_player_token"("website_user_id");

-- AddForeignKey
ALTER TABLE "website_session" ADD CONSTRAINT "website_session_website_user_id_fkey" FOREIGN KEY ("website_user_id") REFERENCES "website_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_user_to_player" ADD CONSTRAINT "website_user_to_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_user_to_player" ADD CONSTRAINT "website_user_to_player_website_user_id_fkey" FOREIGN KEY ("website_user_id") REFERENCES "website_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_user_to_player_token" ADD CONSTRAINT "website_user_to_player_token_website_user_id_fkey" FOREIGN KEY ("website_user_id") REFERENCES "website_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;