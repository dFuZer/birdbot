# BirdBot Monorepo

BirdBot is an automated player designed to play BombParty, a game available on the croco.games platform. This monorepo contains all the necessary modules for BirdBot to function.

While BirdBot never loses, playing against it offers several advantages for players:

*   **Practice:** Focus on improving your own skills against a consistent opponent.
*   **Track Progress:** Games are saved, allowing you to monitor your improvement and personal bests.
*   **Research:** Access tools for researching words to improve scores in specific categories.
*   **Innovative Game Modes:** Experience fun and unique game modes and record categories beyond the classic BombParty.

## Setup

To get BirdBot up and running:

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    ```
2.  **Configure Environment Variables:**
    Navigate to the root of the cloned repository and rename `.env.example` to `.env`. Modify the environment variables within this file to match your desired configuration.
3.  **Run the Production Script:**
    Execute the production setup script:
    ```bash
    ./prod.sh
    ```
    This script will build and orchestrate the various BirdBot modules using Docker.

## Project Stack

This monorepo utilizes the following technologies:

*   **Database:** PostgreSQL
*   **API Module:** Fastify (TypeScript)
*   **Website Module:** Next.js (TypeScript)
*   **Bot Module:** TypeScript, using the `ws` npm package.
*   **Containerization:** All modules run within Docker containers, orchestrated by `docker-compose`, utilizing Node.js 23.7 on Alpine images.

## Developer Implementation - Network Adapter

For the bot module to function correctly, developers **must implement the `NetworkAdapter` class**. A working implementation of this class is **gitignored** to prevent cheating on the croco.games platform, in accordance with the wishes of the croco.games team. Implementing the `NetworkAdapter` involves reverse-engineering the croco.games protocol.

## Development Setup (Individual Modules)

It is possible to run each module individually during development:

1.  **Open Database Port:**
    Run the following script to expose the database on port 5432:
    ```bash
    ./launch-open-db.sh
    ```
2.  **Add .env Files:**
    Create `.env` files within the `api`, `bot`, and `website` module directories, adding the necessary environment variables for each module.
3.  **Run Modules:**
    *   For the `api` and `website` modules:
        ```bash
        npm run dev
        ```
    *   For the `bot` module:
        ```bash
        npm run u
        ```
        This command runs the gitignored `index.unstable.ts` script, allowing developers to test bot scripts without affecting version control. Developers will need to create this file, using `index.example.ts` as a guide.

