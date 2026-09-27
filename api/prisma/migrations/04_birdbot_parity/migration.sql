-- CreateEnum
CREATE TYPE "milestone_type" AS ENUM ('SPEED', 'ACCURACY');
CREATE TYPE "vip_tier" AS ENUM ('NONE', 'VIP', 'VIP_PLUS');

-- Extend word telemetry
ALTER TABLE "word"
ADD COLUMN "duration_ms" INTEGER,
ADD COLUMN "reaction_ms" INTEGER,
ADD CONSTRAINT "word_duration_ms_check" CHECK ("duration_ms" IS NULL OR "duration_ms" >= 0),
ADD CONSTRAINT "word_reaction_ms_check" CHECK ("reaction_ms" IS NULL OR "reaction_ms" >= 0);

-- Player milestone records
CREATE TABLE "player_milestone" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "type" "milestone_type" NOT NULL,
    "milestone" VARCHAR(80) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(80),
    "idempotency_key" VARCHAR(120) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "player_milestone_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "player_milestone_idempotency_key_key" ON "player_milestone"("idempotency_key");
CREATE UNIQUE INDEX "player_milestone_player_id_type_milestone_key" ON "player_milestone"("player_id", "type", "milestone");
CREATE INDEX "player_milestone_player_id_type_achieved_at_idx" ON "player_milestone"("player_id", "type", "achieved_at");

-- Credits use a current balance plus an immutable ledger.
CREATE TABLE "credit_account" (
    "player_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "credit_account_pkey" PRIMARY KEY ("player_id"),
    CONSTRAINT "credit_account_balance_check" CHECK ("balance" >= 0)
);
CREATE TABLE "credit_ledger" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" VARCHAR(120) NOT NULL,
    "reference" VARCHAR(160),
    "idempotency_key" VARCHAR(140) NOT NULL,
    "actor" VARCHAR(80) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credit_ledger_amount_check" CHECK ("amount" <> 0),
    CONSTRAINT "credit_ledger_balance_after_check" CHECK ("balance_after" >= 0)
);
CREATE UNIQUE INDEX "credit_ledger_idempotency_key_key" ON "credit_ledger"("idempotency_key");
CREATE INDEX "credit_ledger_player_id_created_at_idx" ON "credit_ledger"("player_id", "created_at");

-- XP administration uses the same append-only, idempotent audit pattern as credits.
CREATE TABLE "xp_ledger" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "xp_after" INTEGER NOT NULL,
    "operation" VARCHAR(12) NOT NULL,
    "reason" VARCHAR(120) NOT NULL,
    "idempotency_key" VARCHAR(140) NOT NULL,
    "actor" VARCHAR(80) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "xp_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "xp_ledger_xp_after_check" CHECK ("xp_after" >= 0),
    CONSTRAINT "xp_ledger_operation_check" CHECK ("operation" IN ('ADD', 'SET'))
);
CREATE UNIQUE INDEX "xp_ledger_idempotency_key_key" ON "xp_ledger"("idempotency_key");
CREATE INDEX "xp_ledger_player_id_created_at_idx" ON "xp_ledger"("player_id", "created_at");

-- VIP grants are append-only entitlement events; the newest event is current.
CREATE TABLE "vip_entitlement" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "tier" "vip_tier" NOT NULL DEFAULT 'NONE',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "granted_by" VARCHAR(80) NOT NULL,
    "reason" VARCHAR(240),
    "idempotency_key" VARCHAR(120) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vip_entitlement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vip_entitlement_dates_check" CHECK ("expires_at" IS NULL OR "expires_at" > "starts_at")
);
CREATE UNIQUE INDEX "vip_entitlement_idempotency_key_key" ON "vip_entitlement"("idempotency_key");
CREATE INDEX "vip_entitlement_player_id_starts_at_idx" ON "vip_entitlement"("player_id", "starts_at");

CREATE TABLE "purchase" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "sku" VARCHAR(120) NOT NULL,
    "credits_spent" INTEGER NOT NULL,
    "external_reference" VARCHAR(160),
    "idempotency_key" VARCHAR(120) NOT NULL,
    "actor" VARCHAR(80) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_credits_spent_check" CHECK ("credits_spent" >= 0)
);
CREATE UNIQUE INDEX "purchase_external_reference_key" ON "purchase"("external_reference");
CREATE UNIQUE INDEX "purchase_idempotency_key_key" ON "purchase"("idempotency_key");
CREATE INDEX "purchase_player_id_purchased_at_idx" ON "purchase"("player_id", "purchased_at");

CREATE TABLE "player_cosmetics" (
    "player_id" UUID NOT NULL,
    "welcome_message" VARCHAR(500),
    "room_name" VARCHAR(100),
    "bot_name" VARCHAR(80),
    "picture_url" VARCHAR(500),
    "updated_by" VARCHAR(80) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "player_cosmetics_pkey" PRIMARY KEY ("player_id")
);

CREATE TABLE "moderation_state" (
    "player_id" UUID NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklist_reason" VARCHAR(500),
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "suppress_reason" VARCHAR(500),
    "updated_by" VARCHAR(80) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "moderation_state_pkey" PRIMARY KEY ("player_id"),
    CONSTRAINT "moderation_state_trust_score_check" CHECK ("trust_score" BETWEEN -100 AND 100)
);

CREATE TABLE "news_entry" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by" VARCHAR(80) NOT NULL,
    "updated_by" VARCHAR(80) NOT NULL,
    "idempotency_key" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "news_entry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "news_entry_idempotency_key_key" ON "news_entry"("idempotency_key");
CREATE INDEX "news_entry_published_published_at_idx" ON "news_entry"("published", "published_at");

ALTER TABLE "player_milestone" ADD CONSTRAINT "player_milestone_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_account" ADD CONSTRAINT "credit_account_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vip_entitlement" ADD CONSTRAINT "vip_entitlement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_cosmetics" ADD CONSTRAINT "player_cosmetics_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "moderation_state" ADD CONSTRAINT "moderation_state_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
