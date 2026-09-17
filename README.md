# 🐦 BirdBot Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-23.7-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Rust](https://img.shields.io/badge/Rust-1.86-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)


> BirdBot is an automated player for BombParty on [jklm.fun](https://jklm.fun), designed to help players improve their skills through practice and analysis.

## ✨ Features

- **Practice**: Train against a consistent, high-performance opponent
- **Progress Tracking**: Keep track of your records
- **Research Tools**: Access word research tools for specific categories
- **Custom Game Modes**: Experience unique game modes beyond classic BombParty

## Quick Start

### Production Setup

1. **Clone the repository**
   ```bash
   git clone <repository_url> birdbot
   cd birdbot
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Launch with Docker**
   ```bash
   ./prod.sh
   ```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| API | Fastify (TypeScript) + Prisma |
| Website | Next.js (TypeScript) |
| Bot | TypeScript + Socket.IO + Rust |
| Runtime | Docker + Node.js 23.7 (Alpine) |

## Development Guide

### Prerequisites

For development:
- Docker
- Node.js v23.7+
- Rust 1.86+

For production:
- Docker

### Development Setup

1. **Start Development Database (Required)**
```bash
./launch-open-db.sh
```

2. **Run Individual Modules**

**To run the API module:**
```bash
# Go to the API directory
cd api

# Create environment file (Configure as you wish)
cp .env.example .env

# Install dependencies locally
npm install

# Start the API with nodemon in watch mode
npm run dev
```

**To run the Website module:**
```bash
# Go to the website directory
cd website

# Create environment file (Configure as you wish)
cp .env.example .env

# Install dependencies locally
npm install

# Start the Next.js website in development mode
npm run dev
```

**To run the Bot module:**
```bash

# Go to the bot directory
cd bot

# Create environment file (Configure as you wish)
cp .env.example .env

# Build the BirdBot powerhouse for dictionary metadata generation
./build_birdbot_powerhouse.sh

# Create the bot starting script
# index.unstable.ts is gitignored to prevent versioning unstable bot starting scripts in development
cp src/index.ts src/index.unstable.ts

# Run the unstable bot starting script
npm run u
```

Note that, contrary to the API and website modules, you must fully restart the script everytime you make a change to the code.

### Bot configuration

- Admins and automods are stored in Postgres (`bot_staff`); manage with `/staff` (seeded admin: `dfuzer`)
- Optional `JKLM_AUTH_TOKEN` / `JKLM_AUTH_USERNAME` for a logged-in jklm account (guest hosting works without them)
- `API_URL` / `API_KEY` must match the API service used for profiles, feathers, VIP, BBV7 category speed/accuracy records, moderation, staff, and room persistence
- Optional moderation toggles and definitions socket overrides are documented in `bot/.env.example`
- Parity contract and intentional divergences: [`bot/BBV7_PARITY.md`](bot/BBV7_PARITY.md)

The older Croco.games bot archive lives under `archive/BBV7` for historical reference only.

#### Safe admin commands (DB staff)

- `/reconnect` — reconnect the current room sockets
- `/health` — room + API status
- `/staff` — add/remove/show admins and automods
- `/givefeathers`, `/givexp`, `/setxp`, `/suppress`, `/getid`, `/creatorid`
- `/broadcast`, `/rooms`, `/destroyallrooms`, `/diag`

Destructive BBV7 reload/cache-wipe and profile-file delete flows are intentionally not ported.

---

<div align="center">
Made with ❤️ for the BombParty community
</div>
