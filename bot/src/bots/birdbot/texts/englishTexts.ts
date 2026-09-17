import { jklmDomain } from "../../../lib/constants/gameConstants";
import { DISCORD_SERVER_LINK, GITHUB_REPO_LINK, ListedRecord, PAYPAL_DONATE_LINK, WEBSITE_LINK } from "../BirdBotConstants";
import { BirdBotGameMode, BirdBotLanguage, BirdBotRecordType } from "../BirdBotTypes";

export const englishTexts = {
    error: {
        intro: "Error:",
        missing_text: "The translated text is missing. This should never happen. Could you report this on the Discord server?",
        unspecific: "$t(error.intro) An unknown error occurred.",
        api: {
            inaccessible: "$t(error.intro) The API is inaccessible. Please try again later.",
            conflict: "$t(error.intro) That operation conflicts with the current account state.",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) No game in progress.",
            notInPregame: "$t(error.intro) Not in pregame.",
            notEnoughPlayers: "$t(error.intro) Not enough players to start the game.",
            cannotSetMode: "$t(error.intro) Cannot set mode outside of pregame.",
            cannotSetLanguage: "$t(error.intro) Cannot set language outside of pregame.",
            cannotSetBonusAlphabet: "$t(error.intro) Cannot change bonus letters outside of pregame.",
        },
        invalid: {
            regex: "$t(error.intro) Invalid regex: {{regex}}",
            language: "$t(error.intro) Invalid language.",
            gameMode: "$t(error.intro) Invalid game mode.",
        },
        notSupported: {
            language: '$t(error.intro) Language "{{language}}" is not supported.',
            listedRecordNotExistsInLanguage:
                "$t(error.intro) The requested listed record does not exist in the requested language.",
        },
        "404": {
            word: "$t(error.intro) Word not found in dictionary.",
            player: "$t(error.intro) Player not found.",
            gamer: "$t(error.intro) Player not found in room. This should not happen.",
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
            mustBeLoggedIn: `$t(error.intro) You must be logged in to jklm.fun to use this command. To log in, go to the home page at https://${jklmDomain}/ and click "Log in" if you have an account or "New account" if you don\'t.`,
        },
    },
    command: {
        help: {
            description: "Shows the list of commands. If a command is provided, it will show the description of that command.",
            list: "{{commandList}} — For more information about a command, use /help [command]",
            details: "/{{commandName}}: {{description}} — Use: {{usage}} — Ex. {{example}}",
        },
        speedRecords: { description: "Shows the fastest times to reach score milestones by category." },
        accuracyRecords: { description: "Shows the fewest words used to reach score milestones by category." },
        feathers: { description: "Shows your BirdBot feather balance." },
        economy: { description: "Shows a player's feathers, VIP status, and purchases." },
        buy: { description: "Purchases VIP with BirdBot feathers." },
        setName: { description: "Changes your BirdBot profile name." },
        welcomeMessage: { description: "Sets the welcome message used when you join a room." },
        roomName: { description: "Sets the name used for rooms you create." },
        botName: { description: "Sets the BirdBot name used in rooms you create." },
        picture: { description: "Copies your current jklm.fun profile picture onto BirdBot for rooms you create." },
        news: { description: "Shows the latest published BirdBot news." },
        trust: { description: "Administrates API-backed reviewer trust state." },
        blacklist: { description: "Administrates API-backed room blacklist state." },
        loginHelp: {
            description: "Explains how to log in to jklm.fun.",
            result: "To connect to jklm.fun, open https://jklm.fun, click your nickname at the top right, and select Twitch or Discord.",
        },
        reconnectBot: { description: "Reconnects BirdBot to the current room." },
        playerId: { description: "Shows a player's account, profile, and internal IDs." },
        dictionaryQueue: { description: "Shows the words queued for French dictionary diagnostics." },
        admin: {
            creatorId: "Room creator auth id: {{id}}",
            reconnecting: "Reconnecting this room...",
            playerId: "Match: {{account}} / {{username}} ({{playerId}})",
            suppressUsage: "Usage: /suppress [player] [reason?]",
            suppressResult: "Suppressed {{player}}: {{suppressed}}",
            giveFeathersUsage: "Usage: /givefeathers [player] [amount]",
            giveFeathersResult: "Adjusted {{player}} by {{amount}} feathers. Balance: {{balance}}.",
            giveXpUsage: "Usage: /givexp [player] [amount]",
            giveXpResult: "Adjusted {{player}} by {{amount}} XP. Total XP: {{xp}}.",
            setXpUsage: "Usage: /setxp [player] [amount]",
            setXpResult: "Set {{player}} XP to {{xp}}.",
            health: "Health — rooms {{rooms}} (connected {{connected}}), API {{api}}, uptime {{uptime}}",
            staffUsage: "Usage: /staff [add|remove|show] [admin|automod] [player]",
            staffShow: "Admins: {{admins}} — Automods: {{automods}}",
            staffUpdated: "Staff updated. Admins: {{admins}} — Automods: {{automods}}",
            staffEmpty: "(none)",
        },
        parity: {
            accuracyValue: "{{value}} words",
            recordDoesNotExist: "$t(error.intro) The record category “{{record}}” does not exist for this language.",
            noRecordsForCategory: "There are no records for {{category}} yet.",
            pageDoesNotExist: "Milestone page {{page}} does not exist for {{category}} yet.",
            categoryRecords: "{{category}} milestone {{milestone}} — {{records}}",
            globalRecords: "{{mode}} records — {{records}}",
            noRecordsYet: "There are no {{mode}} records yet.",
            feathers: "You have {{count}} feathers.",
            economy: "{{player}}: {{feathers}} feathers — {{tier}} — {{purchases}} purchase(s).",
            purchaseLogin: "You must be logged in to make a purchase.",
            availableSkus: "Available: VIP (500 feathers).",
            alreadyVip: "You already have VIP.",
            purchasedVip: "Purchased VIP.",
            insufficientFeathers: "You do not have enough feathers.",
            setNameLogin: "You must be logged in to set a profile name.",
            invalidName: "Profile names must contain 2 to 20 characters.",
            nameSet: "Your BirdBot profile name is now {{name}}.",
            nameClaimed: "That profile name is already claimed.",
            nameCooldown: "You can only change your name every 30 days.",
            cosmeticLogin: "You must be logged in to customize your BirdBot profile.",
            cosmeticValue: "Provide a value or use /{{command}} clear.",
            cosmeticTooLong: "That value must be {{maxLength}} characters or fewer.",
            cosmeticTier: "This customization requires VIP.",
            cosmeticCleared: "Customization cleared.",
            cosmeticSaved: "Customization saved.",
            pictureCopied: "Your BirdBot's profile picture was changed!",
            pictureUnavailable: "Could not read your current jklm.fun profile picture.",
            noNews: "There is no published BirdBot news.",
            moderationUsage: "Usage: /{{command}} [add|remove|show] [player].",
            moderationState: "{{player}}: trust {{trust}}, blacklist {{blacklist}}.",
            yesWithReason: "yes ({{reason}})",
            yes: "yes",
            no: "no",
            noReason: "no reason",
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
            alreadySet: "Room language is already {{language}}.",
            setting: "Setting language to {{language}}.",
        },
        train: {
            description:
                "Activates a training mode where you have to place as many words from your training list as possible. Usage: /train [RegExps...] or /train [record]",
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
                "You must be connected to jklm.fun to check your own profile. If you want to check the profile of someone else, use the /p [username] syntax.",
            result: "[{{languageFlag}}] {{playerUsername}}: Rank #{{rank}} with {{pp}}pp, {{currentLevelXp}}/{{totalLevelXp}}xp, level {{level}}. Top 5 performances: {{topPerformances}}. {{profileLink}}",
        },
        playerRecords: {
            description: "Shows a player's records for a language and game mode.",
            noUsernameNotConnected:
                "You must be connected to jklm.fun to check your own records. To check someone else's records, use /pr [username].",
            result: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: {{records}}. {{profileLink}}",
            noRecords: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: Player has no records in this category",
        },
        xp: {
            description: "Shows the XP and level of a given player.",
            noUsernameNotConnected:
                "You must be connected to jklm.fun to check your own XP. If you want to check someone else's XP, use the /xp [username] syntax.",
            result: "{{playerUsername}}: level {{level}} — {{currentLevelXp}}/{{totalLevelXp}}xp ({{totalXp}} total)",
        },
        showTime: {
            description: "Shows how long the current game has been going.",
            result: "Game time: {{time}}",
        },
        changeBonusAlphabet: {
            description:
                "Changes the bonus alphabet. Use /bonusalphabet default to restore language defaults, /bonusalphabet reset to clear then set letters, or /bonusalphabet a:1 b:0 to override letters.",
            setting: "Changing bonus letters...",
            invalidFormat:
                "$t(error.intro) Invalid format. Examples: /bonusalphabet default — /bonusalphabet a:1 z:0 — /bonusalphabet reset q:1",
            invalidRange: "$t(error.intro) Letter counts must be between 0 and 99.",
        },
        destroyRoom: {
            description: "Destroys the current room.",
            destroying: "Destroying room...",
        },
        getBomb: {
            description: "Boom.",
            result: "💥",
        },
        getDefinition: {
            description: "Looks up the definition of a word (French and English).",
            result: "{{word}} ({{source}}) [{{page}}/{{total}}]: {{definition}}",
            notFound: "$t(error.intro) No definition found.",
            notFoundSuggestion: "$t(error.intro) No definition found. Did you mean {{suggestion}}?",
            notSupported: "$t(error.intro) Definitions are not available for {{language}}.",
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
            roomCreated: `Room created: https://${jklmDomain}/{{roomCode}}`,
            roomBeingCreated: "$t(error.intro) Room is being created, please wait...",
            roomAlreadyExists: `$t(error.intro) You are already the owner of a room: https://${jklmDomain}/{{roomCode}}`,
            unknownError: "$t(error.intro) An unknown error occurred while creating the room. Please try again later.",
        },
        linkAccount: {
            description:
                "Links your Discord account to your jklm.fun account. This is useful if you want to use the website features (and the Discord bot which is coming soon).",
            tokenNotFound: "$t(error.intro) The token is invalid or expired.",
            success: "Your Discord account has been linked to your jklm.fun account. You can now use the website features.",
        },
        testWord: {
            description: "Queues one or more words for dictionary QA.",
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
        greet: `Welcome! Discord server: ${DISCORD_SERVER_LINK}. For more info, use /help or go to ${WEBSITE_LINK}`,
    },
    eventHandler: {
        chat: {
            commandNotFound: "Command not found: {{command}}",
            noCommandGiven: "You must provide a command after the prefix.",
            notRoomCreator:
                "You cannot use this command if you are not the room creator. /b to create your room will be available soon.",
            notAdmin: "You cannot use this command if you are not an admin.",
            notAccessibleInRound: "This command is unavailable while a round is in progress.",
            notAllowedFromWordInput: "This command cannot be used through word input.",
            cooldown: "Please wait before using that command again.",
        },
        moderation: {
            invalidNickname: "⛔ {{username}}: nickname blocked ({{reason}}).",
            bannedWord: "banned word",
            bannedCharacter: "banned character",
            blacklisted: "⛔ {{username}}: account is blacklisted.",
            spamTimeout: "⛔ {{username}}: chat spam timeout.",
            spamWarning: "⚠️ {{username}}: please slow down.",
        },
        submit: {
            turnCommentWithWord: "{{username}}: {{comments}} ({{word}})",
            turnCommentWithoutWord: "{{username}}: {{comments}}.",
            comments: {
                gainedLives: "gained {{count}} lives ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath: "reached {{count}} words without death",
                reachedMetaMilestone: "reached the {{milestone}} {{category}} speed and accuracy milestone",
                reachedSpeedMilestone: "reached the {{milestone}} {{category}} speed milestone",
                reachedAccuracyMilestone: "reached the {{milestone}} {{category}} accuracy milestone",
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
                food: "placed a food",
                slur: "placed a slur",
            } satisfies Record<ListedRecord, string>,
        },
    },
    periodic: {
        support: {
            star: `Hey! If you like BirdBot, please consider giving it a star on GitHub! It would help me a lot! ${GITHUB_REPO_LINK}`,
            donate: `Hey! If you like BirdBot, please consider donating to support the project! ${PAYPAL_DONATE_LINK}`,
        },
    },
    parity: {
        gameplay: {
            customMode: "Custom mode enabled; ranked score counting is disabled.",
            providePlaystyle: "Provide a playstyle.",
            unavailablePlaystyle: "That playstyle is not available for the current language.",
            playstyleEnabled: "Playstyle {{playstyle}} enabled.",
            tooManyTrainingMatches: "Error: Your /train parameters return more than {{max}} results. Please use more selective parameters.",
            noTrainingMatches: "Error: Your /train parameters have not returned any results.",
            trainingEnabled: "Train mode activated. You can now use /c in all circumstances.",
            trainingDisabled: "You are not training anymore.",
            trainingConfigured: "Your training list with {{count}} results has been applied. Sorting method: {{sort}}. List: {{list}}.",
            trainingSuccess: "[TRAIN ✅] ({{successes}}/{{attempts}}, {{percentage}}%)",
            trainingFail: "[TRAIN ❌] [{{prompt}}] You could have placed: {{suggestions}} ({{successes}}/{{attempts}}, {{percentage}}%)",
            regexTooExpensive: "Error: Your RegExps are too expensive.",
            notImplemented: "This feature is not implemented yet.",
            unrankedReason: "Scores are not currently counted. Reason: {{reason}}.",
            unrankedReasonCustom: "Custom mode activated",
            unrankedReasonTraining: "Train mode activated",
            scoresWillCountAfterGame: "Your scores will count after this game.",
            scoresNowCount: "Scores will now count again. ✅",
            invalidRegex: "Invalid or too-expensive regular expression.",
            unrankedScores: "{{username}}: {{scores}} (unranked room).",
            noScores: "no scores",
            scoresNotSaved: "{{username}}: scores were not saved ({{reason}}).",
            scoresNotSavedGuest: "player is not logged in",
            scoresNotSavedBlacklisted: "account is blacklisted",
            scoresNotSavedApi: "API unreachable after retries",
        },
        dictionary: {
            trustedReviewer: "This command is restricted to trusted dictionary reviewers.",
            trustedListReviewer: "This command is restricted to trusted list reviewers.",
            listUsage: "Usage: /cl [language] [listed record] [add|remove] [words...].",
            testWords: "Test words: {{words}}",
            unknownAdded: "Unknown word {{word}} is valid and was added to the dictionary.",
            unknownTested: "Unknown word {{word}} is valid and was added to the test list.",
            invalidRemoved: "Word {{word}} is invalid and was removed from the dictionary.",
            invalidTested: "Word {{word}} is invalid and was added to the test list for removal from the dictionary.",
        },
        room: {
            blacklisted: "This account is not allowed to create private BirdBot rooms.",
            verificationUnavailable: "Private-room eligibility could not be verified. Please try again later.",
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
            food: {
                recordName: "Foods",
                score_one: "{{count}} food",
                score_other: "{{count}} foods",
                score_specific_one: "{{count}} food",
                score_specific_other: "{{count}} foods",
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
