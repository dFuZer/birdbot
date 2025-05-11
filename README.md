# 🐦 BirdBot Monorepo

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-23.7-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> An automated player for BombParty on croco.games platform, designed to help players improve their skills through practice and analysis.

## ✨ Features

- 🎯 **Practice Mode**: Train against a consistent, high-performance opponent
- 📊 **Progress Tracking**: Save and analyze your game history
- 🔍 **Research Tools**: Access word research tools for specific categories
- 🎮 **Custom Game Modes**: Experience unique game modes beyond classic BombParty

## 🚀 Quick Start

### Production Setup

1. **Clone the repository**
   ```bash
   git clone <repository_url>
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

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| API | Fastify (TypeScript) + Prisma |
| Frontend | Next.js (TypeScript) |
| Bot | TypeScript + WebSocket + Rust |
| Runtime | Docker + Node.js 23.7 (Alpine) |

## 👨‍💻 Development Guide

### Prerequisites

For development:
- Docker (for PostgreSQL)
- Node.js v23.7+
- Rust 1.86+

For production:
- Docker

### Development Setup

1. **Start Development Database**
   ```bash
   ./launch-open-db.sh
   ```

2. **Configure Module Environments**
   - Create `.env` files in `api/`, `bot/`, and `website/` directories
   - Use provided example files as templates

3. **Run Individual Modules**

   **API & Website:**
   ```bash
   npm run dev
   ```

   **Bot Module:**
   ```bash
   ./build_birdbot_powerhouse.sh
   npm run u
   ```

### Important Note for Developers

The `NetworkAdapter` class implementation is intentionally gitignored to comply with croco.games platform policies. Developers must implement this class by reverse-engineering the croco.games protocol. Use `index.example.ts` as a reference for creating your `index.unstable.ts` file.

---

<div align="center">
Made with ❤️ for the BombParty community
</div>
