import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUIDv7 } from "bun";

const exampleGames: Prisma.GameCreateInput[] = [
    {
        language: "FR",
        mode: "REGULAR",
    },
    {
        language: "EN",
        mode: "BLITZ",
    },
    {
        language: "ES",
        mode: "FREEPLAY",
    },
    {
        language: "DE",
        mode: "REGULAR",
    },
];

const examplePlayers: Prisma.PlayerCreateInput[] = [
    {
        auth_id: randomUUIDv7(),
        auth_provider: "discord",
        auth_nickname: "John Doe",
    },
    {
        auth_id: randomUUIDv7(),
        auth_provider: "twitter",
        auth_nickname: "Jane Doe",
    },
    {
        auth_id: randomUUIDv7(),
        auth_provider: "google",
        auth_nickname: "Bob Doe",
    },
];

const exampleWords: string[] = [
    "apple",
    "banana",
    "cherry",
    "date",
    "elderberry",
    "fig",
    "grape",
    "honeydew",
    "kiwi",
    "lemon",
    "mango",
    "orange",
    "pear",
    "quince",
    "raspberry",
    "strawberry",
    "tangerine",
    "uva",
    "watermelon",
    "xigua",
    "yuzu",
    "zucchini",
];

async function seed() {
    let prisma = new PrismaClient();
    await prisma.$connect();

    let games = await prisma.game.createManyAndReturn({
        data: exampleGames,
    });

    let players = await prisma.player.createManyAndReturn({
        data: examplePlayers,
    });

    const randomNewUsernames = Array.from({ length: 100 }, () => {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const randomUsername = randomPlayer.auth_nickname + " " + Math.floor(Math.random() * 1000000);

        return {
            player_id: randomPlayer.id,
            username: randomUsername,
        };
    });

    let newUsernames = await prisma.playerUsername.createMany({
        data: randomNewUsernames,
    });

    const newWords = Array.from({ length: 100 }, () => {
        const randomGame = games[Math.floor(Math.random() * games.length)];
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const randomWord = exampleWords[Math.floor(Math.random() * exampleWords.length)];

        return {
            game_id: randomGame.id,
            player_id: randomPlayer.id,
            word: randomWord,
        };
    });

    let words = await prisma.word.createMany({
        data: newWords,
    });
}

seed();
