import { jklmDomain } from "../../../lib/constants/gameConstants";
import { DISCORD_SERVER_LINK, GITHUB_REPO_LINK, PAYPAL_DONATE_LINK, WEBSITE_LINK } from "../BirdBotConstants";
import { ResourceText } from "./englishTexts";
export const frenchTexts = {
    error: {
        intro: "Erreur:",
        missing_text: "Le texte traduit est manquant. Ça ne devrait jamais arriver. Pouvez-vous signaler ça sur le serveur Discord ?",
        unspecific: "$t(error.intro) Une erreur est survenue.",
        api: {
            inaccessible: "$t(error.intro) L'API est inaccessible. Réessayez plus tard !",
            conflict: "$t(error.intro) Cette opération est incompatible avec l'état actuel du compte.",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) Aucune game n'est en train d'être jouée.",
            notInPregame: "$t(error.intro) Aucune partie n'est en phase de préparation.",
            notEnoughPlayers: "$t(error.intro) Il y'a besoin d'un joueur pour lancer la partie.",
            cannotSetMode: "$t(error.intro) Impossible de changer le mode en dehors de la phase de préparation.",
            cannotSetLanguage: "$t(error.intro) Impossible de changer la langue en dehors de la phase de préparation.",
            cannotSetBonusAlphabet:
                "$t(error.intro) Impossible de changer les lettres bonus en dehors de la phase de préparation.",
        },
        invalid: {
            regex: "$t(error.intro) RegExp invalide: {{regex}}.",
            language: "$t(error.intro) Cette langue n'existe pas ou n'est pas supportée par le bot.",
            gameMode: "$t(error.intro) Ce mode n'existe pas.",
        },
        notSupported: {
            language: '$t(error.intro) La langue "{{language}}" n\'existe pas ou n\'est pas supportée par le bot.',
            listedRecordNotExistsInLanguage: "$t(error.intro) Ce record n'existe pas.",
        },
        "404": {
            word: "$t(error.intro) Ce mot n'est pas dans le dictionnaire.",
            player: "$t(error.intro) Ce joueur n'a pas été trouvé.",
            gamer: "$t(error.intro) Joueur introuvable dans la room. Ceci ne devrait jamais arriver.",
            dictionaryResource:
                "$t(error.intro) Impossible de trouver la ressource du dictionnaire pour cette langue. Ceci ne devrait jamais arriver.",
            playerStats: "$t(error.intro) Scores introuvables pour ce joueur. Ceci ne devrait jamais arriver.",
            currentPlayer: "$t(error.intro) Aucun joueur actuel.",
            syllableNotExists: "$t(error.intro) Cette syllabe n'existe dans aucun mot du dictionnaire demandé.",
        },
        searchWords: {
            nonsensicalRecordSearch: "$t(error.intro) Impossible de trier les mots par record(s): {{records}}.",
            multipleRecords: "$t(error.intro) Vous ne pouvez trier que par un seul record à la fois.",
            mustProvideOneSyllable:
                "$t(error.intro) Vous ne pouvez trier par multi-syllabes que si vous fournissez exactement une syllabe.",
            noArguments: "$t(error.intro) Aucune syllabe en jeu détectée et aucune RegExp donnée.",
        },
        invalidParams: {
            noUsername: "$t(error.intro) Vous devez fournir un nom d'utilisateur pour utiliser cette commande.",
            mustProvideWord: "$t(error.intro) Vous devez fournir un mot pour utiliser cette commande.",
        },
        platform: {
            mustBeLoggedIn: `$t(error.intro) Vous devez être connecté pour utiliser cette commande. Pour se connecter à JKLM.fun, aller sur la page principale du site sur https://${jklmDomain}/, puis cliquez sur votre pseudo en haut à droite et sélectionnez Twitch ou Discord.`,
        },
    },
    command: {
        help: {
            description:
                "Donne la liste des commandes et explique comment les utiliser. Usage: /help pour avoir la liste de toutes les commandes. /help [commande] pour avoir des informations sur une commande.",
            list: `Documentation: ${WEBSITE_LINK} - Liste des commandes: {{commandList}}. Utilisez /help [commande] pour avoir des informations sur une commande.`,
            details: "/{{commandName}}: {{description}} — Usage: {{usage}} — Exemple: {{example}}",
        },
        speedRecords: {
            description: "Affiche les temps les plus rapides pour atteindre les paliers de chaque catégorie.",
        },
        accuracyRecords: {
            description: "Affiche le moins de mots utilisés pour atteindre les paliers de chaque catégorie.",
        },
        feathers: { description: "Affiche votre solde de plumes BirdBot." },
        economy: { description: "Affiche les plumes, le statut VIP et les achats d'un joueur." },
        buy: { description: "Achète VIP avec des plumes BirdBot." },
        setName: {
            description:
                "Utilisez cette commande pour choisir votre nom de profil, pour pouvoir apparaître dans le classement. Usage: /setname [pseudo]",
        },
        welcomeMessage: { description: "Change votre message de bienvenue." },
        roomName: { description: "Change le nom de votre room BirdBot." },
        botName: { description: "Change le nom de votre BirdBot." },
        picture: { description: "Copie votre photo de profil jklm.fun actuelle sur BirdBot pour les rooms que vous créez." },
        news: { description: "Donne les actualités les plus récentes du bot." },
        trust: { description: "Permet d'administrer la trust list via l'API." },
        blacklist: { description: "Permet d'administrer la blacklist via l'API." },
        loginHelp: {
            description: "Explique comment se connecter à JKLM.fun.",
            result: "Pour se connecter à JKLM.fun, aller sur la page principale du site sur jklm.fun, puis cliquez sur votre pseudo en haut à droite et sélectionnez Twitch ou Discord.",
        },
        reconnectBot: { description: "Reconnecte BirdBot à la room actuelle." },
        playerId: { description: "Affiche les identifiants de compte, de profil et internes d'un joueur." },
        dictionaryQueue: { description: "Affiche les mots en attente de diagnostic du dictionnaire français." },
        admin: {
            creatorId: "Auth id du créateur de la room: {{id}}",
            reconnecting: "Reconnexion de cette room...",
            playerId: "Correspondance: {{account}} / {{username}} ({{playerId}})",
            suppressUsage: "Usage: /suppress [joueur] [raison ?]",
            suppressResult: "Suppression de {{player}}: {{suppressed}}",
            giveFeathersUsage: "Usage: /givefeathers [joueur] [montant]",
            giveFeathersResult: "{{player}} ajusté de {{amount}} plumes. Solde: {{balance}}.",
            giveXpUsage: "Usage: /givexp [joueur] [montant]",
            giveXpResult: "{{player}} ajusté de {{amount}} XP. Total XP: {{xp}}.",
            setXpUsage: "Usage: /setxp [joueur] [montant]",
            setXpResult: "XP de {{player}} définie à {{xp}}.",
            health: "Santé — rooms {{rooms}} (connectés {{connected}}), API {{api}}, uptime {{uptime}}",
            staffUsage: "Usage: /staff [add|remove|show] [admin|automod] [joueur]",
            staffShow: "Admins: {{admins}} — Automods: {{automods}}",
            staffUpdated: "Staff mis à jour. Admins: {{admins}} — Automods: {{automods}}",
            staffEmpty: "(aucun)",
        },
        parity: {
            accuracyValue: "{{value}} mots",
            recordDoesNotExist: "$t(error.intro) La catégorie « {{record}} » n'existe pas pour cette langue.",
            noRecordsForCategory: "Il n'y a pas encore de record pour {{category}}.",
            pageDoesNotExist: "Le palier {{page}} n'existe pas encore pour {{category}}.",
            categoryRecords: "{{category}}, palier {{milestone}} — {{records}}",
            globalRecords: "Records en mode {{mode}} — {{records}}",
            noRecordsYet: "Il n'y a pas encore de record en mode {{mode}}.",
            feathers: "Vous avez {{count}} plumes.",
            economy: "{{player}}: {{feathers}} plumes — {{tier}} — {{purchases}} achat(s).",
            purchaseLogin: "Vous devez être connecté pour effectuer un achat.",
            availableSkus: "Item inconnu. Voici la liste des items que vous pouvez acheter avec des plumes: VIP.",
            alreadyVip: "Vous possédez déjà VIP.",
            purchasedVip: "Félicitations, vous êtes désormais VIP !",
            insufficientFeathers: "Vous n'avez pas assez de plumes pour acheter VIP.",
            setNameLogin: "Vous devez être connecté pour définir un nom de profil.",
            invalidName: "Erreur: Votre nom doit avoir entre 2 et 20 caractères.",
            nameSet: 'Votre nom de profil a été changé en: "{{name}}".',
            nameClaimed:
                "Erreur: Ce nom de profil est déjà utilisé. Si quelqu'un usurpe votre identité, formulez une demande sur le serveur discord BirdBot. /discord",
            nameCooldown:
                "Vous ne pouvez pas modifier votre nom de profil pour l'instant. Vous ne pouvez changer de nom qu'une fois tous les 30 jours. Rejoignez le serveur discord BirdBot si vous pensez qu'il s'agit d'une erreur ou pour formuler une demande. /discord",
            cosmeticLogin: "Vous devez être connecté pour personnaliser votre profil BirdBot.",
            cosmeticValue: "Indiquez une valeur ou utilisez /{{command}} clear.",
            cosmeticTooLong: "Cette valeur est trop longue. ({{maxLength}} caractères maximum)",
            cosmeticTier: "Vous devez être VIP pour utiliser cette personnalisation.",
            cosmeticCleared: "Votre personnalisation a été supprimée.",
            cosmeticSaved: "Votre personnalisation a été changée!",
            pictureCopied: "La photo de profil de votre BirdBot a été changé!",
            pictureUnavailable: "Impossible de lire votre photo de profil jklm.fun actuelle.",
            noNews: "Aucune actualité BirdBot n'est publiée.",
            moderationUsage: "Usage: /{{command}} [add|remove|show] [joueur].",
            moderationState: "{{player}}: trust {{trust}}, blacklist {{blacklist}}.",
            yesWithReason: "oui ({{reason}})",
            yes: "oui",
            no: "non",
            noReason: "aucune raison",
        },
        records: {
            description:
                "Affiche les records globaux pour une catégorie. Si aucune catégorie n'est spécifiée, affiche les records pour toutes les catégories. Usage: /r [catégorie]",
            specificRecord: "[{{languageFlag}} {{gameMode}} {{recordType}}] {{records}}",
            allRecords: "[{{languageFlag}} {{gameMode}}] {{records}}",
        },
        currentGameScore: {
            description:
                "Montre les scores d'un joueur actuellement en jeu. Si aucun joueur n'est spécifié, affiche vos scores à la place. Usage: /j [nom]",
            result: "Stats de {{username}}: {{scores}}",
            noScores: "{{username}}: Aucun score disponible",
        },
        startGame: {
            description: "Commence la partie instantanément.",
            starting: "Commencement de la partie.",
        },
        setGameMode: {
            description:
                "Change le mode actuel de la partie. Utilisable seulement si vous êtes le créateur de la room. Usage: /mode [mode]. Liste des modes: REGULAR, SUB500, SUB50, BLITZ, EASY, FREEPLAY.",
            alreadySet: "Le mode de jeu est déjà {{gameMode}}.",
            setting: "Changement des règles...",
        },
        setRoomLanguage: {
            description: "Change la langue de la room. Usage: /lang [lang]. Langues disponibles: FR, EN, ES, DE, BRPT, IT.",
            alreadySet: "La room est déjà en {{language}}.",
            setting: "La room est maintenant en {{language}}.",
        },
        train: {
            description:
                "Active un mode d'entraînement où vous devez placer un maximum de mots de votre liste d'entraînement. Usage: /train [RegExps...] ou /train [record]",
        },
        searchWords: {
            description:
                "Donne la liste des mots contenant la/les syllabe(s) spécifiée(s). Si aucune syllabe n'est spécifiée, utilise la syllabe en jeu. Usage: /c [syllabe].",
            result: "[{{recordTypes}}{{resultCount}} solution(s) ({{hiddenCount}} cachés)] {{wordsList}}",
            noResults: "[{{recordTypes}}{{resultCount}} solution(s) ({{hiddenCount}} cachés)] Aucun résultat disponible",
            previousSyllableHint:
                "Au lieu de filtrer les mots pour le record {{recordType}}, vous pouvez fournir plusieurs regex. Exemple: /c ER FA, si ER est la syllabe actuelle et FA la syllabe précédente.",
            alphaHint:
                "Au lieu de filtrer les mots pour le record {{recordType}}, vous pouvez fournir plusieurs regex. Exemple: /c ^E FA, si E est la lettre alpha actuelle et FA est la syllabe actuelle.",
        },
        playerProfile: {
            noUsernameNotConnected:
                "Vous devez être connecté à JKLM.fun pour regarder votre propre profil. Si vous voulez regarder le profil d'un autre joueur, utilisez la syntaxe /p [nom d'utilisateur].",
            description: "Montre le profil d'un joueur. Si aucun joueur n'est spécifié, affiche votre propre profil.",
            result: "[{{languageFlag}}] {{playerUsername}}: Rang #{{rank}} avec {{pp}}pp, {{currentLevelXp}}/{{totalLevelXp}}xp, niveau {{level}}. Top 5 performances: {{topPerformances}}. {{profileLink}}",
        },
        playerRecords: {
            description: "Montre les records d'un joueur pour une langue et un mode de jeu.",
            noUsernameNotConnected:
                "Vous devez être connecté à JKLM.fun pour regarder vos propres records. Pour regarder ceux d'un autre joueur, utilisez /pr [nom d'utilisateur].",
            result: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: {{records}}. {{profileLink}}",
            noRecords: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: Ce joueur n'a pas de records dans cette catégorie.",
        },
        xp: {
            description: "Affiche l'XP et le niveau d'un joueur.",
            noUsernameNotConnected:
                "Vous devez être connecté à JKLM.fun pour voir votre XP. Pour voir l'XP d'un autre joueur, utilisez /xp [nom d'utilisateur].",
            result: "{{playerUsername}}: Niveau: {{level}}. XP: {{currentLevelXp}} / {{totalLevelXp}} ({{totalXp}} total)",
        },
        showTime: {
            description: "Affiche le temps écoulé depuis le début de la partie.",
            result: "La partie dure depuis: {{time}}.",
        },
        changeBonusAlphabet: {
            description:
                "Change l'alphabet bonus. /bonusalphabet default pour les valeurs par défaut, /bonusalphabet reset pour tout remettre à 0 puis définir, ou /bonusalphabet a:1 b:0 pour modifier des lettres.",
            setting: "Changement des règles...",
            invalidFormat:
                "$t(error.intro) Format invalide. Usage (exemple): /bonusalphabet a:1 b:2 c:3 d:4   -   Usage (exemple 2): /bonusalphabet reset a:10   -   /bonusalphabet default",
            invalidRange: "$t(error.intro) La valeur pour chaque lettre doit être inférieure à 100 et supérieure ou égale à 0.",
        },
        destroyRoom: {
            description: "Détruit votre room BirdBot.",
            destroying: "Destruction de la room...",
        },
        getBomb: {
            description: "Boom.",
            result: "💥",
        },
        getDefinition: {
            description: "Donne la définition du mot spécifié. Usage: /d [mot]",
            result: 'Définition du mot "{{word}}" sur {{source}} ({{page}}/{{total}}): {{definition}}',
            notFound: "$t(error.intro) Aucune définition trouvée.",
            notFoundSuggestion: "$t(error.intro) Aucune définition trouvée. Vouliez-vous dire: {{suggestion}} ?",
            notSupported: "$t(error.intro) Les définitions ne sont pas disponibles pour {{language}}.",
        },
        rareSyllables: {
            description: "Affiche les syllabes rares d'un mot. Usage: /rs [mot]",
            result: "[{{languageFlag}}] Syllabes rares dans {{word}}: {{rareSyllables}}",
            noneFound: "[{{languageFlag}}] Syllabes rares dans {{word}}: Aucune",
            errorSyllableNotInDictionary:
                "$t(error.intro) Une des syllabes du mot donné n'est pas dans le dictionnaire. Ça ne devrait jamais arriver. Pouvez-vous signaler ça sur le serveur Discord ?",
        },
        broadcast: {
            description: "Envoie un message dans toutes les rooms. Usage: /bc [message]",
            message: "Broadcast: {{message}}",
        },
        discord: {
            description: "Donne le lien du serveur Discord.",
            result: "Serveur Discord: {{link}} - Rejoignez le serveur pour avoir les dernières news et mises à jour !",
        },
        github: {
            description: "Donne le lien du repo GitHub.",
            result: "Repo GitHub: {{link}} - Laissez une étoile si vous aimez le projet et que vous voulez nous soutenir !",
        },
        donate: {
            description: "Donne le lien de donation PayPal.",
            result: "Lien de donation PayPal: {{link}} - Merci beaucoup pour votre soutien !",
        },
        website: {
            description: "Donne le lien du site web.",
            result: "Site web: {{link}} - Sur le site, vous trouverez tous les records des joueurs, la doc des commandes, et plein d'autres trucs !",
        },
        uptime: {
            description: "Montre depuis quand le bot est actif.",
            result: "Le bot est en marche depuis: {{uptime}}",
        },
        modUser: {
            description: "Donne les droits de modérateur à un joueur.",
            modding: "{{username}} est désormais modérateur.",
        },
        unmodUser: {
            description: "Retire les droits de modérateur d'un joueur.",
            unmodding: "{{username}} n'est plus modérateur.",
        },
        privateRoom: {
            description: "Rend votre room privée.",
            setting: "Votre room est maintenant privée.",
        },
        publicRoom: {
            description: "Rend votre room BirdBot accessible à tous.",
            setting: "Votre room est maintenant publique.",
        },
        destroyAllRooms: {
            description: "Détruit toutes les rooms.",
            message: "Destruction de toutes les rooms, probablement pour maintenance. BirdBot reviendra bientôt !",
        },
        showAllRooms: {
            description: "Affiche toutes les rooms.",
            result: "Rooms: {{roomsList}}",
        },
        createRoom: {
            description: "Crée une room BirdBot pour vous.",
            roomCreated: `Votre room a été créée: https://${jklmDomain}/{{roomCode}}`,
            roomAlreadyExists: `Vous avez déjà une room: https://${jklmDomain}/{{roomCode}}`,
            roomBeingCreated: "Votre room est déjà en train d'être créée.",
            unknownError: "$t(error.intro) Votre room n'a pas pu être créée. Merci de réessayer plus tard.",
        },
        linkAccount: {
            description:
                "Relie votre compte Discord à votre compte jklm.fun. C'est utile si vous voulez utiliser les fonctionnalités du site web (et du bot Discord qui arrive bientôt).",
            tokenNotFound: "Le token est invalide ou expiré.",
            success:
                "Votre compte Discord a été relié à votre compte jklm.fun. Vous pouvez maintenant utiliser les fonctionnalités du site.",
        },
        testWord: {
            description: "Ajoute un ou plusieurs mots à la file de contrôle qualité du dictionnaire.",
        },
    },
    general: {
        playerStats: {
            diedNoWords: "{{username}} est mort sans placer aucun mot cette partie. Bonne chance pour la prochaine fois !",
            diedLevelUp:
                "{{username}} est mort à {{time}} — +{{gainedXp}} XP, {{oldCurrentLevelXp}}/{{oldTotalLevelXp}}xp niveau {{oldLevel}} -> {{newCurrentLevelXp}}/{{newTotalLevelXp}}xp niveau {{newLevel}} — Scores: {{scores}}",
            died: "{{username}} est mort à {{time}} — +{{gainedXp}} XP — Scores: {{scores}}",
        },
        roomState: {
            gameModeSet: "Mode {{gameMode}} activé.",
        },
        scorePresentation: "{{username}} avec {{score}}",
        greet: `Hey! Utilise /help pour avoir la liste des commandes. Site officiel: ${WEBSITE_LINK}. Discord de BirdBot: ${DISCORD_SERVER_LINK}`,
    },
    periodic: {
        support: {
            star: `Hey! Si vous aimez BirdBot et que vous voulez soutenir le projet, vous pouvez donner une étoile sur GitHub! Merci beaucoup! ${GITHUB_REPO_LINK}`,
            donate: `Hey! Si vous aimez BirdBot et que vous voulez soutenir le projet, vous pouvez faire un don sur PayPal! Merci beaucoup! ${PAYPAL_DONATE_LINK}`,
        },
    },
    eventHandler: {
        chat: {
            commandNotFound: "Commande inconnue: {{command}}",
            noCommandGiven: "Veuillez indiquer un nom de commande.",
            notRoomCreator: "Vous devez avoir créé la room pour utiliser cette commande. Utilisez /b pour créer une room.",
            notAdmin: "Permissions insuffisantes.",
            notAccessibleInRound: "Vous ne pouvez pas utiliser cette commande pendant qu'une partie est en cours.",
            notAllowedFromWordInput:
                "Vous ne pouvez pas utiliser cette commande dans la barre d'entrée des mots quand les records comptent. Utilisez /train.",
            cooldown: "Doucement! Attends un peu avant d'utiliser ta prochaine commande.",
        },
        moderation: {
            invalidNickname: "⛔ {{username}}: pseudo bloqué ({{reason}}).",
            bannedWord: "mot interdit",
            bannedCharacter: "caractère interdit",
            blacklisted: "⛔ {{username}}: ce compte est blacklisté.",
            spamTimeout: "⛔ {{username}}: exclusion temporaire pour spam.",
            spamWarning: "⚠️ {{username}}: le spam est interdit. Vous serez banni si vous continuez.",
        },
        submit: {
            turnCommentWithWord: "{{username}}: {{comments}} ({{word}})",
            turnCommentWithoutWord: "{{username}}: {{comments}}.",
            comments: {
                gainedLives: "a gagné {{count}} vie(s) ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath: "a atteint {{count}} mots sans mourir",
                reachedMetaMilestone: "a atteint le palier {{milestone}} {{category}} de vitesse et précision",
                reachedSpeedMilestone: "a atteint le palier {{milestone}} {{category}} de vitesse",
                reachedAccuracyMilestone: "a atteint le palier {{milestone}} {{category}} de précision",
                placedLongWord: "a placé un mot long ({{playerTotal}}/{{globalTotal}})",
                placedHyphenatedWord: "a placé un mot composé ({{playerTotal}}/{{globalTotal}})",
                completedAlpha: "a complété un alpha: {{alphaString}}",
                placedPreviousSyllable: "a placé une syllabe précédente: {{syllable}} ({{playerTotal}}/{{globalTotal}})",
                gainedMultiSyllables: "a gagné {{count}} MS ({{prompt}} x {{multiplier}}) ({{playerTotal}}/{{globalTotal}})",
                depletedSyllables: "a niqué {{count}} syllabe(s): {{syllables}} ({{playerTotal}}/{{globalTotal}})",
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
            customMode: "Mode custom activé; les scores classés sont désactivés.",
            providePlaystyle: "Indiquez un playstyle.",
            unavailablePlaystyle: "Ce playstyle n'existe pas ou n'est pas supporté par le bot.",
            playstyleEnabled: "Playstyle activé: {{playstyle}}",
            tooManyTrainingMatches:
                "Erreur: Vos paramètres /train ont renvoyé plus de {{max}} résultats. Veuillez utiliser des paramètres plus sélectifs.",
            noTrainingMatches: "Erreur: Vos paramètres /train n'ont renvoyé aucun résultat.",
            trainingEnabled: "Mode Train activé. Vous pouvez désormais utiliser /c en toutes circonstances.",
            trainingDisabled: "Vous ne vous entraînez plus.",
            trainingConfigured:
                "Votre liste d'entraînement avec {{count}} résultats vient d'être appliquée. Méthode de tri: {{sort}}. Liste: {{list}}.",
            trainingSuccess: "[TRAIN ✅] ({{successes}}/{{attempts}}, {{percentage}}%)",
            trainingFail:
                "[TRAIN ❌] [{{prompt}}] Vous auriez pu placer: {{suggestions}} ({{successes}}/{{attempts}}, {{percentage}}%)",
            regexTooExpensive: "Erreur: Vos RegExps sont trop coûteuses.",
            notImplemented: "Cette fonctionnalité n'est pas encore implémentée.",
            unrankedReason: "Les scores ne sont actuellement pas comptés. Raison: {{reason}}.",
            unrankedReasonCustom: 'Mode "custom" activé',
            unrankedReasonTraining: "Mode train activé",
            scoresWillCountAfterGame: "Vos scores compteront après cette partie.",
            scoresNowCount: "Les scores seront maintenant comptés. ✅",
            invalidRegex: "RegExp invalide ou trop coûteuse.",
            unrankedScores: "{{username}}: {{scores}} (room non classée).",
            noScores: "aucun score",
            scoresNotSaved: "{{username}}: vos scores n'ont pas été comptés. Raison: {{reason}}.",
            scoresNotSavedGuest: "Vous n'êtes pas connecté. Connectez-vous à Discord ou Twitch pour que vos scores soient sauvegardés",
            scoresNotSavedBlacklisted: "Vous avez été blacklisté du classement",
            scoresNotSavedApi: "API inaccessible après nouvelles tentatives",
        },
        dictionary: {
            trustedReviewer: "Vous n'êtes pas dans la trust list.",
            trustedListReviewer: "Vous n'êtes pas dans la trust list.",
            listUsage: "Permet de modifier une liste à record. Usage: /cl [lang] [liste] [add|remove] [mots].",
            testWords: "Mots de test: {{words}}",
            unknownAdded: "Le mot {{word}} a fonctionné et a été ajouté au dictionnaire.",
            unknownTested: "Le mot {{word}} était inconnu et a été ajouté à la liste de test.",
            invalidRemoved: "Le mot {{word}} n'a pas fonctionné et a été supprimé du dictionnaire.",
            invalidTested: "Le mot {{word}} n'a pas fonctionné et a été ajouté à la liste de test.",
        },
        room: {
            blacklisted: "Vous ne pouvez pas créer de room privée car vous avez été blacklisté.",
            verificationUnavailable: "Impossible de vérifier l'accès à la room privée. Réessayez plus tard.",
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
                score_specific_one: "{{count}} mot long",
                score_specific_other: "{{count}} mots longs",
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
