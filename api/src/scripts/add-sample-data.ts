import { GameMode, Language, PrismaClient, SubmitResultType } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const firstNames: string[] = [
    "James",
    "Mary",
    "Robert",
    "Patricia",
    "John",
    "Jennifer",
    "Michael",
    "Linda",
    "David",
    "Elizabeth",
    "William",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Thomas",
    "Sarah",
    "Charles",
    "Karen",
    "Christopher",
    "Lisa",
    "Daniel",
    "Nancy",
    "Matthew",
    "Betty",
    "Anthony",
    "Margaret",
    "Donald",
    "Sandra",
    "Steven",
    "Ashley",
    "Paul",
    "Kimberly",
    "Andrew",
    "Emily",
    "Joshua",
    "Donna",
    "Kenneth",
    "Michelle",
    "George",
    "Carol",
    "Kevin",
    "Amanda",
    "Brian",
    "Dorothy",
    "Edward",
    "Melissa",
    "Ronald",
    "Deborah",
];

const lastNames: string[] = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Hall",
    "Green",
    "Adams",
    "Baker",
    "Hill",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Roberts",
    "Carter",
    "Phillips",
    "Evans",
    "Turner",
    "Parker",
    "Collins",
    "Edwards",
    "Stewart",
    "Flores",
    "Morris",
    "Murphy",
    "Cook",
    "Rogers",
    "Morgan",
    "Peterson",
    "Cooper",
    "Reed",
];

function getRandomName() {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
        lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
}

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

let languageArray = Object.values(Language);
let modeArray = Object.values(GameMode);

(async () => {
    let prisma = new PrismaClient();
    await prisma.$connect();

    let games = await prisma.game.createManyAndReturn({
        data: Array.from({ length: 100 }, () => {
            const randomLanguage = languageArray[Math.floor(Math.random() * languageArray.length)];
            const randomMode = modeArray[Math.floor(Math.random() * modeArray.length)];
            // const randomLanguage = Language.FR;
            // const randomMode = GameMode.REGULAR;
            return { language: randomLanguage, mode: randomMode };
        }),
    });

    let players = await prisma.player.createManyAndReturn({
        data: Array.from({ length: 10 }, () => {
            return {
                account_name: getRandomName(),
            };
        }),
    });

    let fixedPlayersUsernames = await prisma.playerUsername.createMany({
        data: players.map((player) => {
            return {
                player_id: player.id,
                username: getRandomName(),
            };
        }),
    });

    const randomNewUsernames = Array.from({ length: 20 }, () => {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const randomUsername = getRandomName();

        return {
            player_id: randomPlayer.id,
            username: randomUsername,
        };
    });

    let newUsernames = await prisma.playerUsername.createMany({
        data: randomNewUsernames,
    });

    const newWords = Array.from({ length: 1000 }, () => {
        const randomGame = games[Math.floor(Math.random() * games.length)];
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const randomWord = exampleWords[Math.floor(Math.random() * exampleWords.length)];
        return {
            word: randomWord,
            flip: true,
            submit_result: SubmitResultType.SUCCESS,
            prompt: "TEST",
            player_id: randomPlayer.id,
            game_id: randomGame.id,
        };
    });

    let words = await prisma.word.createMany({
        data: newWords,
    });

    const newGameRecaps = Array.from({ length: 200 })
        .map((x, i) => {
            const player = players[Math.floor(Math.random() * players.length)];
            const game = games[i];
            if (!game) return undefined;
            return {
                player_id: player.id,
                game_id: game.id,
                died_at: new Date(game.started_at.getTime() + 1000 * 60 * 60 * Math.random()),
                words_count: Math.floor(Math.random() * 500),
                flips_count: Math.floor(Math.random() * 500),
                depleted_syllables_count: Math.floor(Math.random() * 500),
                alpha_count: Math.floor(Math.random() * 500),
                words_without_death_count: Math.floor(Math.random() * 500),
                previous_syllables_count: Math.floor(Math.random() * 500),
                multi_syllables_count: Math.floor(Math.random() * 500),
                hyphen_words_count: Math.floor(Math.random() * 500),
                more_than_20_letters_words_count: Math.floor(Math.random() * 500),
            };
        })
        .filter((x) => x !== undefined);

    const gameRecaps = await prisma.gameRecap.createManyAndReturn({
        data: newGameRecaps,
    });
})();
