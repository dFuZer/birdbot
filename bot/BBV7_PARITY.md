# BBV7 BirdBot parity contract

This document is the compatibility manifest for the TypeScript BirdBot on jklm.fun versus archived BBV7 BirdBot behavior. It is intentionally not a 1:1 JS→TS port: the runtime is re-engineered around dual JKLM sockets, Postgres-backed economy/meta state, and modular command domains.

## In scope

- BirdBot product only (not archived `1v1` / `jklmMain` products)
- JKLM dual-socket lifecycle, reconnect, room creation, and DB-backed room rejoin
- Game state normalization (bonus letters, timing, lowercase canonical words)
- Command registry permissions, aliases, cooldowns, global throttle, and ranked word-input gates
- Gameplay modes / playstyles / training / search / trust
- API/Postgres VIP, credits, cosmetics, news, milestones, moderation, staff, ban audit
- Localized command denial and moderation messaging
- BBV7-parity chat spam (char budget + similarity + soft-warn-only) and nickname filters

## Command domains

| Domain | Module | Notes |
| --- | --- | --- |
| information / room / account | `BirdBotCommands.ts` + `BirdBotParityCommands.ts` | player-facing + VIP/economy |
| administration | `BirdBotAdminCommands.ts` | safe admin ops only |

### Alias contract highlights

- `/s` = speed records (not live score)
- live score = `/score`, `/stats`, `/j`
- `/destroy` = current room; `/destroyallrooms` = all rooms
- `/test` = listed-word trust helper; `/diag` = dictionary diagnostic

## Safe admin ops restored

- `/reconnect` (`/reco`) — scoped to the current room
- `/creatorid`, `/getid`, `/suppress`
- `/givecredits` (`/gc`), `/givexp`, `/setxp`
- `/health` (`/status`) — bot room summary + API health probe
- `/staff` — manage DB-backed admins and automods
- existing `/broadcast`, `/diag`, `/rooms`, `/destroyallrooms`

## Staff model

- Admins and automods live in Postgres `bot_staff` (not `admins.txt`).
- Bot polls `GET /staff` every 30s and refreshes after `/staff` mutations.
- Automods are manually selected accounts that receive JKLM moderator in every BirdBot room.
- Trust score does **not** auto-grant JKLM mod.

## Reliability

- All rooms upserted to `bot_room` and rejoined on boot.
- Reconnect retries with backoff before destroying a room.
- Mid-round reconnect replays `wasWordValidated` scoring (BBV7 `validateWord` equivalent).
- Word/recap API writes go through an in-memory retry queue with idempotency keys.
- Ranked word-input commands are restricted to the BBV7 safe allowlist while scores are eligible.

## Intentional divergences / local impossibilities

- No Node `require` cache reload / `REFRESH` resource wipe. Use process restart + `/health`.
- No destructive local JSON profile wipe. `/suppress` marks API moderation state (suppressed + blacklisted) without deleting Postgres history.
- No `TRANSFER` / `REINIT` / `RESET` / mass-ban `DCR` equivalents.
- No WPM anticheat (BBV7 had it hard-disabled; not ported).
- Cosmetics primarily apply to newly created rooms. `/cpp` copies the caller's live JKLM chatter picture into DB-backed cosmetics (VIP+).
- Speed/accuracy meta records are milestone-based (timing/streak thresholds), not BBV7 per-category local JSON boards. `/s` and `/acc` without a player show global milestone leaders; with a player they show that player's milestones.
- Credits are earned from scored game recaps (idempotent ledger) and can also be granted by admins.

## Ops checklist

1. Apply Prisma migrations through `6_safety_catchup` (seeds admin `dfuzer`)
2. Configure bot `.env` from `.env.example` (API + moderation + optional defs)
3. Build/start API, then bot (staff loads from DB; rooms rejoin from `bot_room`)
4. Smoke: `/staff show`, reconnect, mid-round disconnect recovery, credits after a scored death, blacklist skip, private-room create gate
