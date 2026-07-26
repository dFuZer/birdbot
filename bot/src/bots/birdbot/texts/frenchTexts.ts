import { jklmDomain } from "../../../lib/constants/gameConstants";
import { DISCORD_SERVER_LINK, GITHUB_REPO_LINK, PAYPAL_DONATE_LINK, WEBSITE_LINK } from "../BirdBotConstants";
import { ResourceText } from "./englishTexts";
export const frenchTexts = {
    error: {
        intro: "Erreur :",
        missing_text: "Le texte traduit est manquant. Ça ne devrait jamais arriver. Peux-tu signaler ça sur le serveur Discord ?",
        unspecific: "$t(error.intro) Une erreur inconnue s'est produite.",
        api: {
            inaccessible: "$t(error.intro) L'API est inaccessible. Réessaie plus tard !",
            conflict: "$t(error.intro) Cette opération est incompatible avec l'état actuel du compte.",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) Aucune partie en cours.",
            notInPregame: "$t(error.intro) Aucune partie en phase de préparation.",
            notEnoughPlayers: "$t(error.intro) Pas assez de joueurs pour démarrer la partie.",
            cannotSetMode: "$t(error.intro) Impossible de changer le mode en dehors de la phase de préparation.",
            cannotSetLanguage: "$t(error.intro) Impossible de changer la langue en dehors de la phase de préparation.",
            cannotSetBonusAlphabet:
                "$t(error.intro) Impossible de changer les lettres bonus en dehors de la phase de préparation.",
        },
        invalid: {
            regex: "$t(error.intro) Regex invalide : {{regex}}",
            language: "$t(error.intro) Langue invalide.",
            gameMode: "$t(error.intro) Mode de jeu invalide.",
        },
        notSupported: {
            language: '$t(error.intro) La langue "{{language}}" n\'est pas supportée.',
            listedRecordNotExistsInLanguage: "$t(error.intro) Le record à liste demandé n'existe pas dans la langue demandée.",
        },
        "404": {
            word: "$t(error.intro) Le mot n'est pas dans le dictionnaire.",
            player: "$t(error.intro) Joueur introuvable.",
            gamer: "$t(error.intro) Joueur introuvable dans le salon. Ceci ne devrait jamais arriver.",
            dictionaryResource:
                "$t(error.intro) Impossible de trouver la ressource du dictionnaire pour cette langue. Ceci ne devrait jamais arriver.",
            playerStats: "$t(error.intro) Scores introuvables pour ce joueur. Ceci ne devrait jamais arriver.",
            currentPlayer: "$t(error.intro) Aucun joueur actuel.",
            syllableNotExists: "$t(error.intro) Cette syllabe n'existe dans aucun mot du dictionnaire demandé.",
        },
        searchWords: {
            nonsensicalRecordSearch: "$t(error.intro) Impossible de trier les mots par record(s) : {{records}}.",
            multipleRecords: "$t(error.intro) Tu ne peux trier que par un seul record à la fois.",
            mustProvideOneSyllable:
                "$t(error.intro) Tu ne peux trier par multisyllabes que si tu fournis exactement une syllabe.",
            noArguments: "$t(error.intro) Tu dois fournir au moins une syllabe ou un regex.",
        },
        invalidParams: {
            noUsername: "$t(error.intro) Tu dois fournir un nom d'utilisateur pour utiliser cette commande.",
            mustProvideWord: "$t(error.intro) Tu dois fournir un mot pour utiliser cette commande.",
        },
        platform: {
            mustBeLoggedIn: `$t(error.intro) Tu dois être connecté à jklm.fun pour utiliser cette commande. Pour te connecter, va sur la page d\'accueil https://${jklmDomain}/ et clique sur "Se connecter" si tu as un compte ou "Nouveau compte" si tu n\'en as pas.`,
        },
    },
    command: {
        help: {
            description: "Affiche la liste des commandes. Si tu indiques une commande, affiche sa description.",
            list: "{{commandList}} — Pour plus d'infos sur une commande, utilise /help [commande]",
            details: "/{{commandName}} : {{description}} — Utilisation : {{usage}} — Ex. {{example}}",
        },
        speedRecords: { description: "Affiche les jalons de vitesse globaux ou d'un joueur depuis l'API." },
        accuracyRecords: { description: "Affiche les séries de mots valides globales ou d'un joueur." },
        credits: { description: "Affiche ton solde de crédits BirdBot." },
        economy: { description: "Affiche les crédits, le niveau VIP et les achats d'un joueur." },
        buy: { description: "Achète un niveau VIP avec des crédits BirdBot." },
        setName: { description: "Modifie le nom de ton profil BirdBot." },
        welcomeMessage: { description: "Définit ton message de bienvenue." },
        roomName: { description: "Définit le nom des salons que tu crées." },
        botName: { description: "Définit le nom de BirdBot dans tes salons." },
        picture: { description: "Définit l'image de BirdBot dans tes salons. Fournis une URL d'image." },
        news: { description: "Affiche les dernières nouvelles publiées." },
        trust: { description: "Administre la confiance des réviseurs via l'API." },
        blacklist: { description: "Administre la liste noire des salons via l'API." },
        connect: {
            description: "Explique comment se connecter à jklm.fun.",
            result: "Pour te connecter à jklm.fun, ouvre https://jklm.fun, clique sur ton pseudo en haut à droite, puis choisis Twitch ou Discord.",
        },
        admin: {
            creatorId: "Auth id du créateur du salon : {{id}}",
            reconnecting: "Reconnexion de ce salon...",
            getId: "Correspondance : {{account}} / {{username}} ({{playerId}})",
            suppressUsage: "Utilisation : /suppress [joueur] [raison ?]",
            suppressResult: "Suppression de {{player}} : {{suppressed}}",
            giveCreditsUsage: "Utilisation : /givecredits [joueur] [montant]",
            giveCreditsResult: "{{player}} ajusté de {{amount}} crédits. Solde : {{balance}}.",
            giveXpUsage: "Utilisation : /givexp [joueur] [montant]",
            giveXpResult: "{{player}} ajusté de {{amount}} XP. Total XP : {{xp}}.",
            setXpUsage: "Utilisation : /setxp [joueur] [montant]",
            setXpResult: "XP de {{player}} définie à {{xp}}.",
            health: "Santé — salons {{rooms}} (connectés {{connected}}), API {{api}}, uptime {{uptime}}",
        },
        parity: {
            loginOrPlayer: "Connecte-toi ou indique un joueur.",
            milestones: "{{player}} — jalons de {{type}} : {{records}}",
            noMilestones: "{{player}} n'a pas encore de jalons de {{type}}.",
            globalMilestones: "Jalons {{type}} globaux : {{records}}",
            noGlobalMilestones: "Aucun jalon {{type}} global pour le moment.",
            milestoneSpeed: "{{value}} ms",
            milestoneAccuracy: "{{value}} mots valides",
            credits: "Tu as {{count}} crédits.",
            economy: "{{player}} : {{credits}} crédits — niveau {{tier}} — {{purchases}} achat(s).",
            purchaseLogin: "Tu dois être connecté pour effectuer un achat.",
            availableSkus: "Offres disponibles : VIP (500 crédits), VIP+ (1000 crédits).",
            alreadyVip: "Tu as déjà {{tier}}.",
            purchasedVip: "{{tier}} acheté.",
            insufficientCredits: "Tu n'as pas assez de crédits.",
            setNameLogin: "Tu dois être connecté pour définir un nom de profil.",
            invalidName: "Le nom de profil doit contenir entre 2 et 20 caractères.",
            nameSet: "Ton nom de profil BirdBot est maintenant {{name}}.",
            nameClaimed: "Ce nom de profil est déjà pris.",
            nameCooldown: "Tu ne peux changer de nom que tous les 30 jours.",
            cosmeticLogin: "Tu dois être connecté pour personnaliser ton profil BirdBot.",
            cosmeticValue: "Indique une valeur ou utilise /{{command}} clear.",
            cosmeticTooLong: "Cette valeur doit contenir au maximum {{maxLength}} caractères.",
            cosmeticTier: "Cette personnalisation nécessite {{tier}}.",
            cosmeticCleared: "Personnalisation supprimée.",
            cosmeticSaved: "Personnalisation enregistrée.",
            noNews: "Aucune actualité BirdBot n'est publiée.",
            moderationUsage: "Utilisation : /{{command}} [add|remove|show] [joueur].",
            moderationState: "{{player}} : confiance {{trust}}, liste noire {{blacklist}}.",
            yesWithReason: "oui ({{reason}})",
            yes: "oui",
            no: "non",
            noReason: "aucune raison",
        },
        records: {
            description: "Affiche la liste des records.",
            specificRecord: "[{{languageFlag}} {{gameMode}} {{recordType}}] {{records}}",
            allRecords: "[{{languageFlag}} {{gameMode}}] {{records}}",
        },
        currentGameScore: {
            description:
                "Affiche les scores actuels de la partie pour un joueur. Si tu ne donnes pas de joueur, ça affiche les scores du joueur actuel.",
            result: "{{username}} : {{scores}}",
            noScores: "{{username}} : Aucun score disponible",
        },
        startGame: {
            description: "Démarre la partie.",
            starting: "Démarrage de la partie...",
        },
        setGameMode: {
            description: "Change le mode de jeu.",
            alreadySet: "Le mode de jeu est déjà {{gameMode}}.",
            setting: "Changement du mode à {{gameMode}}...",
        },
        setRoomLanguage: {
            description: "Change la langue du salon.",
            alreadySet: "Le salon est déjà en {{language}}.",
            setting: "Le salon est maintenant en {{language}}.",
        },
        searchWords: {
            description:
                "Cherche des mots dans le dictionnaire. Tu peux donner autant de syllabes ou de regex que tu veux. La commande te donnera les mots qui correspondent à chaque regex.",
            result: "[{{recordTypes}}{{resultCount}} rés. ({{hiddenCount}} cachés)] {{wordsList}}",
            noResults: "[{{recordTypes}}{{resultCount}} rés. ({{hiddenCount}} cachés)] Aucun résultat disponible",
            previousSyllableHint:
                "Au lieu de filtrer les mots pour le record {{recordType}}, tu peux fournir plusieurs regex. Exemple : /c ER FA, si ER est la syllabe actuelle et FA la syllabe précédente.",
            alphaHint:
                "Au lieu de filtrer les mots pour le record {{recordType}}, tu peux fournir plusieurs regex. Exemple : /c ^E FA, si E est la lettre alpha actuelle et FA est la syllabe actuelle.",
        },
        playerProfile: {
            noUsernameNotConnected:
                "Tu dois être connecté à jklm.fun pour regarder ton propre profil. Si tu veux regarder le profil d'un autre joueur, utilise la syntaxe /p [nom d'utilisateur].",
            description: "Affiche le profil d'un joueur.",
            resultMode: "[{{languageFlag}} {{gameMode}}] {{playerUsername}} : {{records}}. {{profileLink}}",
            result: "[{{languageFlag}}] {{playerUsername}} : Rang #{{rank}} avec {{pp}}pp, {{currentLevelXp}}/{{totalLevelXp}}xp, niveau {{level}}. Top 5 performances : {{topPerformances}}. {{profileLink}}",
            noRecords: "[{{languageFlag}} {{gameMode}}] {{playerUsername}} : Pas de records dans cette catégorie",
        },
        xp: {
            description: "Affiche l'XP et le niveau d'un joueur.",
            noUsernameNotConnected:
                "Tu dois être connecté à jklm.fun pour voir ton XP. Pour voir l'XP d'un autre joueur, utilise /xp [nom d'utilisateur].",
            result: "{{playerUsername}} : niveau {{level}} — {{currentLevelXp}}/{{totalLevelXp}}xp ({{totalXp}} total)",
        },
        showTime: {
            description: "Affiche la durée de la partie en cours.",
            result: "Temps de partie : {{time}}",
        },
        changeBonusAlphabet: {
            description:
                "Change l'alphabet bonus. /bl default pour les valeurs par défaut, /bl reset pour tout remettre à 0 puis définir, ou /bl a:1 b:0 pour modifier des lettres.",
            setting: "Changement des lettres bonus...",
            invalidFormat:
                "$t(error.intro) Format invalide. Exemples : /bl default — /bl a:1 z:0 — /bl reset q:1",
            invalidRange: "$t(error.intro) Les comptes de lettres doivent être entre 0 et 99.",
        },
        destroyRoom: {
            description: "Détruit le salon actuel.",
            destroying: "Destruction du salon...",
        },
        getBomb: {
            description: "Boom.",
            result: "💥",
        },
        getDefinition: {
            description: "Cherche la définition d'un mot (français et anglais).",
            result: "{{word}} ({{source}}) [{{page}}/{{total}}] : {{definition}}",
            notFound: "$t(error.intro) Aucune définition trouvée.",
            notFoundSuggestion: "$t(error.intro) Aucune définition trouvée. Tu voulais dire {{suggestion}} ?",
            notSupported: "$t(error.intro) Les définitions ne sont pas disponibles pour {{language}}.",
        },
        rareSyllables: {
            description: "Affiche les syllabes rares dans le dictionnaire.",
            result: "[{{languageFlag}}] Syllabes rares dans {{word}} : {{rareSyllables}}",
            noneFound: "[{{languageFlag}}] Syllabes rares dans {{word}} : Aucune",
            errorSyllableNotInDictionary:
                "$t(error.intro) Une des syllabes du mot donné n'est pas dans le dictionnaire. Ça ne devrait jamais arriver. Peux-tu signaler ça sur le serveur Discord ?",
        },
        broadcast: {
            description: "Envoie un message à tous les joueurs dans tous les salons.",
            message: "Diffusion : {{message}}",
        },
        discord: {
            description: "Donne le lien du serveur Discord.",
            result: "Serveur Discord : {{link}} - Rejoins le serveur pour avoir les dernières news et mises à jour !",
        },
        github: {
            description: "Donne le lien du repo GitHub.",
            result: "Repo GitHub : {{link}} - Laisse une étoile si tu aimes le projet et que tu veux nous soutenir !",
        },
        donate: {
            description: "Donne le lien de donation PayPal.",
            result: "Lien de donation PayPal : {{link}} - Merci beaucoup pour ton soutien !",
        },
        website: {
            description: "Donne le lien du site web.",
            result: "Site web : {{link}} - Sur le site, tu trouveras tous les records des joueurs, la doc des commandes, et plein d'autres trucs !",
        },
        uptime: {
            description: "Donne le temps de fonctionnement du bot.",
            result: "Temps de fonctionnement : {{uptime}}",
        },
        modUser: {
            description: "Donne les droits de modérateur à un joueur.",
            modding: "Modération de {{username}}...",
        },
        unmodUser: {
            description: "Retire les droits de modérateur d'un joueur.",
            unmodding: "Retrait de la modération de {{username}}...",
        },
        privateRoom: {
            description: "Crée un salon privé.",
            setting: "Le salon est maintenant privé...",
        },
        publicRoom: {
            description: "Crée un salon public.",
            setting: "Le salon est maintenant public...",
        },
        destroyAllRooms: {
            description: "Détruit tous les salons.",
            message: "Destruction de tous les salons, probablement pour maintenance. BirdBot reviendra bientôt !",
        },
        showAllRooms: {
            description: "Affiche tous les salons.",
            result: "Salons : {{roomsList}}",
        },
        createRoom: {
            description: "Crée un salon.",
            roomCreated: `Salon créé : https://${jklmDomain}/{{roomCode}}`,
            roomAlreadyExists: `Tu es déjà le propriétaire d'un salon : https://${jklmDomain}/{{roomCode}}`,
            roomBeingCreated: "Le salon est en cours de création, merci d'attendre un peu...",
            unknownError:
                "$t(error.intro) Une erreur inconnue est survenue lors de la création du salon. Merci de réessayer plus tard.",
        },
        linkAccount: {
            description:
                "Relie ton compte Discord à ton compte jklm.fun. C'est utile si tu veux utiliser les fonctionnalités du site web (et du bot Discord qui arrive bientôt).",
            tokenNotFound: "Le token est invalide ou expiré.",
            success:
                "Ton compte Discord a été relié à ton compte jklm.fun. Tu peux maintenant utiliser les fonctionnalités du site.",
        },
        test: {
            description: "Commande de test pour les admins.",
        },
    },
    general: {
        playerStats: {
            diedNoWords: "{{username}} est mort sans placer aucun mot cette partie. Bonne chance pour la prochaine fois !",
            diedLevelUp:
                "{{username}} est mort à {{time}} — +{{gainedXp}}xp, {{oldCurrentLevelXp}}/{{oldTotalLevelXp}}xp niveau {{oldLevel}} -> {{newCurrentLevelXp}}/{{newTotalLevelXp}}xp niveau {{newLevel}} — Scores: {{scores}}",
            died: "{{username}} est mort à {{time}} — +{{gainedXp}}xp — Scores: {{scores}}",
        },
        roomState: {
            gameModeSet: "Le mode de jeu est maintenant {{gameMode}}.",
        },
        scorePresentation: "{{username}} avec {{score}}",
        greet: `Bienvenue ! Serveur Discord: ${DISCORD_SERVER_LINK}. Pour plus d'infos tape /help ou va sur ${WEBSITE_LINK}`,
    },
    periodic: {
        support: {
            star: `Hey! Si tu aimes BirdBot et que tu veux soutenir le projet, tu peux donner une étoile sur GitHub! Merci beaucoup! ${GITHUB_REPO_LINK}`,
            donate: `Hey! Si tu aimes BirdBot et que tu veux soutenir le projet, tu peux faire un don sur PayPal! Merci beaucoup! ${PAYPAL_DONATE_LINK}`,
        },
    },
    eventHandler: {
        chat: {
            commandNotFound: "Commande introuvable : {{command}}",
            noCommandGiven: "Tu dois indiquer une commande après le préfixe.",
            notRoomCreator:
                "Tu ne peux pas utiliser cette commande si tu n'es pas le créateur du salon. /b pour créer ton salon sera bientôt disponible.",
            notAdmin: "Tu ne peux pas utiliser cette commande si tu n'es pas un admin.",
            notAccessibleInRound: "Cette commande est indisponible pendant une manche.",
            notAllowedFromWordInput: "Cette commande ne peut pas être utilisée dans la saisie des mots.",
            cooldown: "Attends avant de réutiliser cette commande.",
        },
        moderation: {
            invalidNickname: "⛔ {{username}} : pseudo bloqué ({{reason}}).",
            bannedWord: "mot interdit",
            bannedCharacter: "caractère interdit",
            blacklisted: "⛔ {{username}} : ce compte est sur liste noire.",
            spamTimeout: "⛔ {{username}} : exclusion temporaire pour spam.",
            spamWarning: "⚠️ {{username}} : ralentis, s'il te plaît.",
        },
        submit: {
            turnCommentWithWord: "{{username}} : {{comments}} ({{word}})",
            turnCommentWithoutWord: "{{username}} : {{comments}}.",
            comments: {
                gainedLives: "a gagné {{count}} vies ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath: "a atteint {{count}} mots sans mourir",
                placedLongWord: "a placé un long mot ({{playerTotal}}/{{globalTotal}})",
                placedHyphenatedWord: "a placé un mot composé ({{playerTotal}}/{{globalTotal}})",
                completedAlpha: "a complété un alpha : {{alphaString}}",
                placedPreviousSyllable: "a placé une syllabe précédente : {{syllable}} ({{playerTotal}}/{{globalTotal}})",
                gainedMultiSyllables: "a gagné {{count}} MS ({{prompt}} x {{multiplier}}) ({{playerTotal}}/{{globalTotal}})",
                depletedSyllables: "a niqué {{count}} syllabe(s) : {{syllables}} ({{playerTotal}}/{{globalTotal}})",
                listedRecord: "{{commentIntroduction}} ({{playerTotal}}/{{globalTotal}})",
            },
            listedRecordCommentIntroductions: {
                adverb: "a placé un adverbe",
                chemical: "a placé un élément chimique",
                creature: "a placé une créature",
                ethnonym: "a placé un gentilé",
                plant: "a placé une plante",
                slur: "a placé une insulte",
                food: "a placé un aliment",
            },
        },
    },
    parity: {
        gameplay: {
            customMode: "Mode personnalisé activé ; les scores classés sont désactivés.",
            providePlaystyle: "Indique un style de jeu.",
            unavailablePlaystyle: "Ce style de jeu n'est pas disponible dans la langue actuelle.",
            playstyleEnabled: "Style de jeu {{playstyle}} activé.",
            trainingLogin: "L'entraînement nécessite un créateur de salon connecté.",
            invalidTrainingRegex: "Expression régulière d'entraînement invalide ou trop coûteuse.",
            tooManyTrainingMatches: "L'entraînement correspond à plus de 30000 mots.",
            noTrainingMatches: "Aucun mot ne correspond à l'entraînement.",
            trainingEnabled: "Entraînement activé ; les scores classés sont désactivés.",
            trainingDisabled: "Entraînement désactivé ; les scores sont de nouveau admissibles.",
            trainingConfigured: "Entraînement activé avec {{count}} mots ({{sort}}) ; les scores classés sont désactivés.",
            humanEnabled: "Mode humain activé ; BirdBot ne jouera pas et les scores classés sont désactivés.",
            humanDisabled: "Mode humain désactivé ; les scores sont de nouveau admissibles.",
            invalidRegex: "Expression régulière invalide ou trop coûteuse.",
            unrankedScores: "{{username}} : {{scores}} (salon non classé).",
            noScores: "aucun score",
        },
        dictionary: {
            trustedReviewer: "Cette commande est réservée aux réviseurs de dictionnaire de confiance.",
            trustedListReviewer: "Cette commande est réservée aux réviseurs de listes de confiance.",
            listUsage: "Utilisation : /cl [langue] [record à liste] [add|remove] [mots...].",
            testWords: "Mots de test : {{words}}",
            unknownAdded: "Le mot inconnu {{word}} est valide et a été ajouté au dictionnaire.",
            unknownTested: "Le mot inconnu {{word}} est valide et a été ajouté à la liste de test.",
            invalidRemoved: "Le mot {{word}} est invalide et a été retiré du dictionnaire.",
            invalidTested: "Le mot {{word}} est invalide et a été ajouté à la liste de test pour être retiré du dictionnaire.",
        },
        room: {
            blacklisted: "Ce compte n'est pas autorisé à créer des salons BirdBot privés.",
            verificationUnavailable: "Impossible de vérifier l'accès au salon privé. Réessaie plus tard.",
        },
    },
    lib: {
        mode: {
            easy: "Facile",
            blitz: "Blitz",
            regular: "Regular",
            sub500: "Sub500",
            sub50: "Sub50",
            freeplay: "Freeplay",
        },
        language: {
            en: { flag: "🇺🇸", name: "Anglais" },
            fr: { flag: "🇫🇷", name: "Français" },
            es: { flag: "🇪🇸", name: "Espagnol" },
            de: { flag: "🇩🇪", name: "Allemand" },
            it: { flag: "🇮🇹", name: "Italien" },
            brpt: { flag: "🇧🇷", name: "Portugais brésilien" },
        },
        recordType: {
            word: {
                recordName: "Mots",
                score_one: "{{count}} mot",
                score_other: "{{count}} mots",
                score_specific_one: "{{count}} mot",
                score_specific_other: "{{count}} mots",
            },
            flips: {
                recordName: "Vies",
                score_one: "{{count}} vie",
                score_other: "{{count}} vies",
                score_specific_one: "{{count}} vie",
                score_specific_other: "{{count}} vies",
            },
            alpha: {
                recordName: "Alpha",
                score: "{{formattedScore}}",
            },
            time: {
                recordName: "Temps",
                score: "{{formattedScore}}",
            },
            depleted_syllables: {
                recordName: "Syllabes niquées",
                score_one: "{{count}} syllabe",
                score_other: "{{count}} syllabes",
                score_specific_one: "{{count}} syllabe niquée",
                score_specific_other: "{{count}} syllabes niquées",
            },
            multi_syllable: {
                recordName: "Multi-syllabes",
                score_one: "{{count}} MS",
                score_other: "{{count}} MS",
                score_specific_one: "{{count}} MS",
                score_specific_other: "{{count}} MS",
            },
            previous_syllable: {
                recordName: "Syllabes précédentes",
                score_one: "{{count}} syllabe",
                score_other: "{{count}} syllabes",
                score_specific_one: "{{count}} syllabe précédente",
                score_specific_other: "{{count}} syllabes précédentes",
            },
            no_death: {
                recordName: "Sans mort",
                score_one: "{{count}} mot",
                score_other: "{{count}} mots",
                score_specific_one: "{{count}} mot sans mort",
                score_specific_other: "{{count}} mots sans mort",
            },
            hyphen: {
                recordName: "Mots composés",
                score_one: "{{count}} mot",
                score_other: "{{count}} mots",
                score_specific_one: "{{count}} mot composé",
                score_specific_other: "{{count}} mots composés",
            },
            more_than_20_letters: {
                recordName: "Longs mots",
                score_one: "{{count}} mot",
                score_other: "{{count}} mots",
                score_specific_one: "{{count}} long mot",
                score_specific_other: "{{count}} longs mots",
            },
            adverb: {
                recordName: "Adverbes",
                score_one: "{{count}} adverbe",
                score_other: "{{count}} adverbes",
                score_specific_one: "{{count}} adverbe",
                score_specific_other: "{{count}} adverbes",
            },
            chemical: {
                recordName: "Éléments chimiques",
                score_one: "{{count}} élément chimique",
                score_other: "{{count}} éléments chimiques",
                score_specific_one: "{{count}} élément chimique",
                score_specific_other: "{{count}} éléments chimiques",
            },
            creature: {
                recordName: "Créatures",
                score_one: "{{count}} créature",
                score_other: "{{count}} créatures",
                score_specific_one: "{{count}} créature",
                score_specific_other: "{{count}} créatures",
            },
            ethnonym: {
                recordName: "Gentilés",
                score_one: "{{count}} gentilé",
                score_other: "{{count}} gentilés",
                score_specific_one: "{{count}} gentilé",
                score_specific_other: "{{count}} gentilés",
            },
            plant: {
                recordName: "Plantes",
                score_one: "{{count}} plante",
                score_other: "{{count}} plantes",
                score_specific_one: "{{count}} plante",
                score_specific_other: "{{count}} plantes",
            },
            food: {
                recordName: "Aliments",
                score_one: "{{count}} aliment",
                score_other: "{{count}} aliments",
                score_specific_one: "{{count}} aliment",
                score_specific_other: "{{count}} aliments",
            },
            slur: {
                recordName: "Insultes",
                score_one: "{{count}} insulte",
                score_other: "{{count}} insultes",
                score_specific_one: "{{count}} insulte",
                score_specific_other: "{{count}} insultes",
            },
        },
    },
} satisfies ResourceText;
