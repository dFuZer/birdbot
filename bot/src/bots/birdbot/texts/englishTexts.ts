import { crocoDomain } from "../../../lib/constants/gameConstants";
import { ListedRecord } from "../BirdBotConstants";
import { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType } from "../BirdBotTypes";

export const englishTexts = {
    error: {
        intro: "Error:",
        missing_text: "The translated text is missing. This should never happen. Could you report this on the Discord server?",
        unspecific: "$t(error.intro) An unknown error occurred.",
        api: {
            inaccessible: "$t(error.intro) The API is inaccessible. Please try again later.",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) No game in progress.",
            notInPregame: "$t(error.intro) Not in pregame.",
            notEnoughPlayers: "$t(error.intro) Not enough players to start the game.",
            cannotSetMode: "$t(error.intro) Cannot set mode outside of pregame.",
            cannotSetLanguage: "$t(error.intro) Cannot set language outside of pregame.",
        },
        invalid: {
            regex: "$t(error.intro) Invalid regex: {{regex}}",
            language: "$t(error.intro) Invalid language.",
            gameMode: "$t(error.intro) Invalid game mode.",
        },
        notSupported: {
            language: '$t(intro) Language "{{language}}" is not supported.',
            listedRecordNotExistsInLanguage:
                "$t(error.intro) The requested listed record does not exist in the requested language.",
        },
        "404": {
            word: "$t(error.intro) Word not found in dictionary.",
            player: "$t(error.intro) Player not found.",
            gamer: "$t(error.intro) Gamer not found in room. This should not happen.",
            dictionaryResource: "$t(error.intro) Could not find dictionary resource for this language. This should not happen.",
            playerStats: "$t(error.intro) Player stats not found for this player. This should not happen.",
            currentPlayer: "$t(error.intro) No current player.",
            syllableNotExists: "$t(error.intro) This syllable does not exist in any word in the requested dictionary.",
        },
        searchWords: {
            nonsensicalRecordSearch: "$t(error.intro) It makes no sense to sort words by record(s): {{records}}.",
            multipleRecords: "$t(error.intro) You can only sort by one record at a time.",
            mustProvideOneSyllable:
                "$t(error.intro) You can only sort by multi-syllable words if you provide exactly one syllable.",
            noArguments: "$t(error.intro) You must provide at least one syllable or regex.",
        },
        invalidParams: {
            noUsername: "$t(error.intro) You must provide a username to use this command.",
            mustProvideWord: "$t(error.intro) You must provide a word to use this command.",
        },
        platform: {
            mustBeLoggedIn: `$t(intro) You must be logged in to Croco.games to use this command. To log in, go to the home page at https://${crocoDomain}/ and click "Log in" if you have an account or "New account" if you don\'t.`,
        },
    },
    command: {
        help: {
            description: "Shows the list of commands. If a command is provided, it will show the description of that command.",
            list: "{{commandList}} — For more information about a command, use /help [command]",
            details: "/{{commandName}}: {{description}} — Use: {{usage}} — Ex. {{example}}",
        },
        records: {
            description: "Shows the list of records.",
            specificRecord: "[{{languageFlag}} {{gameMode}} {{recordType}}] {{records}}",
            allRecords: "[{{languageFlag}} {{gameMode}}] {{records}}",
        },
        currentGameScore: {
            description:
                "Shows the current game scores for a given player. If no player is provided, it will show the scores for the current player.",
            result: "{{username}}: {{scores}}",
            noScores: "{{username}}: No scores available",
        },
        startGame: {
            description: "Starts the game.",
            starting: "Starting game...",
        },
        setGameMode: {
            description: "Sets the game mode.",
            alreadySet: "Game mode is already {{gameMode}}.",
            setting: "Setting mode to {{gameMode}}...",
        },
        setRoomLanguage: {
            description: "Sets the language of the room.",
            setting: "Setting language to {{language}}.",
        },
        searchWords: {
            description:
                "Search for words in the dictionary. The user can provide any number of syllables or regexes to search for. The command will return the words that match every given regex.",
            result: "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} hidden)] {{wordsList}}",
            noResults: "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} hidden)] No results available",
            previousSyllableHint:
                "Instead of filtering words for the {{recordType}} record, you should provide multiple regexes. Example: /c ER FA, if ER is the current prompt and FA the previous prompt.",
            alphaHint:
                "Instead of filtering words for the {{recordType}} record, you should provide multiple regexes. Example: /c ^E FA, if E is the current alpha letter and FA is the current prompt.",
        },
        playerProfile: {
            description: "Shows the player profile of a given player.",
            noUsernameNotConnected:
                "You must be connected to Croco.games to check your own profile. If you want to check the profile of someone else, use the /p [username] syntax.",
            resultMode: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: {{records}}. {{profileLink}}",
            result: "[{{languageFlag}}] {{playerUsername}}: Rank #{{rank}} with {{pp}}pp, {{currentLevelXp}}/{{totalLevelXp}}xp, level {{level}}. Top 5 performances: {{topPerformances}}. {{profileLink}}",
            noRecords: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: Player has no records in this category",
        },
        rareSyllables: {
            description: "Shows the rare syllables in the dictionary.",
            result: "[{{languageFlag}}] Rare syllables in {{word}}: {{rareSyllables}}",
            noneFound: "[{{languageFlag}}] Rare syllables in {{word}}: None",
            errorSyllableNotInDictionary:
                "$t(error.intro) One of the syllables of the given word is not in the dictionary. This should never happen. Could you report this to the developers?",
        },
        broadcast: {
            description: "Broadcasts a message to all players in all rooms.",
            message: "Broadcast: {{message}}",
        },
        discord: {
            description: "Gives the discord server link.",
            result: "Discord server: {{link}} - Join the server to get the latest news and updates!",
        },
        github: {
            description: "Gives the github repository link.",
            result: "Github repository: {{link}} - Give a star if you like the project and want to support us!",
        },
        donate: {
            description: "Gives the paypal donation link.",
            result: "Paypal donation link: {{link}} - Thank you so much for your support!",
        },
        website: {
            description: "Gives the website link.",
            result: "Website: {{link}} - On the website you will find all the player records, the documentation on the commands, and much more!",
        },
        uptime: {
            description: "Gives the uptime of the bot.",
            result: "Uptime: {{uptime}}",
        },
        modUser: {
            description: "Gives moderator capabilities to the user.",
            modding: "Modding {{username}}...",
        },
        unmodUser: {
            description: "Removes moderator capabilities from the user.",
            unmodding: "Unmodding {{username}}...",
        },
        privateRoom: {
            description: "Creates a private room.",
            setting: "Setting room to private...",
        },
        publicRoom: {
            description: "Creates a public room.",
            setting: "Setting room to public...",
        },
        destroyAllRooms: {
            description: "Destroys all rooms.",
            message: "Destroying all rooms, probably for maintenance purposes. BirdBot will come back soon!",
        },
        showAllRooms: {
            description: "Shows all rooms.",
            result: "Rooms: {{roomsList}}",
        },
        createRoom: {
            description: "Creates a room.",
            roomCreated: `Room created: https://${crocoDomain}/{{roomCode}}`,
            roomBeingCreated: "$t(error.intro) Room is being created, please wait...",
            roomAlreadyExists: `$t(error.intro) You are already the owner of a room: https://${crocoDomain}/{{code}}`,
            unknownError: "$t(error.intro) An unknown error occurred while creating the room. Please try again later.",
        },
        linkAccount: {
            description:
                "Links your Discord account to your Croco.games account. This is useful if you want to use the website features (and the Discord bot which is coming soon).",
            tokenNotFound: "$t(error.intro) The token is invalid or expired.",
            success: "Your Discord account has been linked to your Croco.games account. You can now use the website features.",
        },
        test: {
            description: "Test command for admins.",
        },
    },
    general: {
        playerStats: {
            diedNoWords: "Oh no, {{username}} you died without placing any words this game. Better luck next time!",
            diedLevelUp:
                "{{username}} died at {{time}} — +{{gainedXp}}xp, {{oldCurrentLevelXp}}/{{oldTotalLevelXp}}xp level {{oldLevel}} -> {{newCurrentLevelXp}}/{{newTotalLevelXp}}xp level {{newLevel}} — Scores: {{scores}}",
            died: "{{username}} died at {{time}} — +{{gainedXp}}xp — Scores: {{scores}}",
        },
        roomState: {
            gameModeSet: "Game mode set to {{gameMode}}.",
        },
        scorePresentation: "{{username}} with {{score}}",
    },
    eventHandler: {
        chat: {
            commandNotFound: "Command not found: {{command}}",
            notRoomCreator:
                "You cannot use this command if you are not the room creator. /b to create your room will be available soon.",
            notAdmin: "You cannot use this command if you are not an admin.",
        },
        submit: {
            turnCommentWithWord: "{{username}}: {{comments}} ({{word}})",
            turnCommentWithoutWord: "{{username}}: {{comments}}.",
            comments: {
                gainedLives: "gained {{count}} lives ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath: "reached {{count}} words without death",
                placedLongWord: "placed a long word ({{playerTotal}}/{{globalTotal}})",
                placedHyphenatedWord: "placed a hyphenated word ({{playerTotal}}/{{globalTotal}})",
                completedAlpha: "completed an alpha: {{alphaString}}",
                placedPreviousSyllable: "placed a previous syllable: {{syllable}} ({{playerTotal}}/{{globalTotal}})",
                gainedMultiSyllables: "gained {{count}} MS ({{prompt}} x {{multiplier}}) ({{playerTotal}}/{{globalTotal}})",
                depletedSyllables: "depleted {{count}} syllable(s): {{syllables}} ({{playerTotal}}/{{globalTotal}})",
                listedRecord: "{{commentIntroduction}} ({{playerTotal}}/{{globalTotal}})",
            },
            listedRecordCommentIntroductions: {
                adverb: "placed an adverb",
                chemical: "placed a chemical",
                creature: "placed a creature",
                ethnonym: "placed an ethnonym",
                plant: "placed a plant",
                slur: "placed a slur",
            } satisfies Record<ListedRecord, string>,
        },
    },
    lib: {
        mode: {
            easy: "Easy",
            blitz: "Blitz",
            regular: "Regular",
            sub500: "Sub-500",
            sub50: "Sub-50",
            freeplay: "Freeplay",
        } satisfies Record<BirdBotGameMode, string>,
        language: {
            en: { flag: "🇺🇸", name: "English" },
            fr: { flag: "🇫🇷", name: "French" },
            es: { flag: "🇪🇸", name: "Spanish" },
            de: { flag: "🇩🇪", name: "German" },
            it: { flag: "🇮🇹", name: "Italian" },
            brpt: { flag: "🇧🇷", name: "Brazilian Portuguese" },
        } satisfies Record<BirdBotLanguage, { flag: string; name: string }>,
        recordType: {
            word: {
                recordName: "Words",
                score_one: "{{count}} word",
                score_other: "{{count}} words",
                score_specific_one: "{{count}} word",
                score_specific_other: "{{count}} words",
            },
            flips: {
                recordName: "Flips",
                score_one: "{{count}} flip",
                score_other: "{{count}} flips",
                score_specific_one: "{{count}} flip",
                score_specific_other: "{{count}} flips",
            },
            alpha: {
                recordName: "Alpha",
                score: "{{formattedScore}}",
            },
            time: {
                recordName: "Time",
                score: "{{formattedScore}}",
            },
            depleted_syllables: {
                recordName: "Depleted syllables",
                score_one: "{{count}} syllable",
                score_other: "{{count}} syllables",
                score_specific_one: "{{count}} depleted syllable",
                score_specific_other: "{{count}} depleted syllables",
            },
            multi_syllable: {
                recordName: "Multi-syllables",
                score_one: "{{count}} MS",
                score_other: "{{count}} MS",
                score_specific_one: "{{count}} MS",
                score_specific_other: "{{count}} MS",
            },
            previous_syllable: {
                recordName: "Previous syllables",
                score_one: "{{count}} syllable",
                score_other: "{{count}} syllables",
                score_specific_one: "{{count}} previous syllable",
                score_specific_other: "{{count}} previous syllables",
            },
            no_death: {
                recordName: "No death",
                score_one: "{{count}} word",
                score_other: "{{count}} words",
                score_specific_one: "{{count}} word without death",
                score_specific_other: "{{count}} words without death",
            },
            hyphen: {
                recordName: "Hyphenated words",
                score_one: "{{count}} word",
                score_other: "{{count}} words",
                score_specific_one: "{{count}} hyphenated word",
                score_specific_other: "{{count}} hyphenated words",
            },
            more_than_20_letters: {
                recordName: "Long words",
                score_one: "{{count}} word",
                score_other: "{{count}} words",
                score_specific_one: "{{count}} long word",
                score_specific_other: "{{count}} long words",
            },
            adverb: {
                recordName: "Adverbs",
                score_one: "{{count}} adverb",
                score_other: "{{count}} adverbs",
                score_specific_one: "{{count}} adverb",
                score_specific_other: "{{count}} adverbs",
            },
            chemical: {
                recordName: "Chemicals",
                score_one: "{{count}} chemical",
                score_other: "{{count}} chemicals",
                score_specific_one: "{{count}} chemical",
                score_specific_other: "{{count}} chemicals",
            },
            creature: {
                recordName: "Creatures",
                score_one: "{{count}} creature",
                score_other: "{{count}} creatures",
                score_specific_one: "{{count}} creature",
                score_specific_other: "{{count}} creatures",
            },
            ethnonym: {
                recordName: "Ethnonyms",
                score_one: "{{count}} ethnonym",
                score_other: "{{count}} ethnonyms",
                score_specific_one: "{{count}} ethnonym",
                score_specific_other: "{{count}} ethnonyms",
            },
            plant: {
                recordName: "Plants",
                score_one: "{{count}} plant",
                score_other: "{{count}} plants",
                score_specific_one: "{{count}} plant",
                score_specific_other: "{{count}} plants",
            },
            slur: {
                recordName: "Slurs",
                score_one: "{{count}} slur",
                score_other: "{{count}} slurs",
                score_specific_one: "{{count}} slur",
                score_specific_other: "{{count}} slurs",
            },
        } satisfies Record<
            BirdBotRecordType,
            | {
                  recordName: string;
                  score_one: string;
                  score_other: string;
                  score_specific_one: string;
                  score_specific_other: string;
              }
            | {
                  recordName: string;
                  score: string;
              }
        >,
    },
};

export type ResourceText = typeof englishTexts;
