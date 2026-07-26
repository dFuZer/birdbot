# BBV7 BirdBot parity contract

This document is the compatibility manifest for the TypeScript BirdBot on jklm.fun versus archived BBV7 BirdBot behavior. It is intentionally not a 1:1 JS→TS port: the runtime is re-engineered around dual JKLM sockets, Postgres-backed economy/meta state, and modular command domains.

## In scope

- BirdBot product only (not archived `1v1` / `jklmMain` products)
- JKLM dual-socket lifecycle, reconnect, and room creation
- Game state normalization (bonus letters, timing, lowercase canonical words)
- Command registry permissions, aliases, cooldowns, and word-input gates
- Gameplay modes / playstyles / training / search / trust
- API/Postgres VIP, credits, cosmetics, news, milestones, moderation
- Localized command denial and moderation messaging

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
- existing `/broadcast`, `/diag`, `/rooms`, `/destroyallrooms`

## Intentional divergences / local impossibilities

- No Node `require` cache reload / `REFRESH` resource wipe. Use process restart + `/health`.
- No destructive local JSON profile wipe. `/suppress` marks API moderation state (suppressed + blacklisted) without deleting Postgres history.
- No `TRANSFER` / `REINIT` / `RESET` / mass-ban `DCR` equivalents.
- Cosmetics primarily apply to newly created rooms; picture cosmetics require a URL (no live JKLM avatar copy).
- Speed/accuracy meta records are milestone-based (timing/streak thresholds), not BBV7 per-category local JSON boards. `/s` and `/acc` without a player show global milestone leaders; with a player they show that player's milestones.
- Credits are earned from scored game recaps (idempotent ledger) and can also be granted by admins.

## Ops checklist

1. Apply Prisma migration `4_birdbot_parity`
2. Configure bot `.env` from `.env.example` (API + moderation + optional defs)
3. Populate `bot/admins.txt` with jklm auth ids
4. Build/start API, then bot
5. Smoke in a private room: reconnect, credits after a scored death, `/s`, `/economy`, cosmetics create-room path
