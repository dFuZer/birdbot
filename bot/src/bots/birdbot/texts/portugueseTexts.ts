import { ResourceText } from "./englishTexts";

export const portugueseTexts = {
    error: {
        intro: "Erro:",
        missing_text:
            "O texto traduzido está faltando. Isso não deveria acontecer. Pode reportar isso no servidor do Discord?",
        unspecific: "$t(error.intro) Ocorreu um erro desconhecido.",
        api: {
            inaccessible:
                "$t(error.intro) A API não está acessível. Tenta de novo mais tarde!",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) Não há partida em andamento.",
            notInPregame:
                "$t(error.intro) Não há partida em fase de preparação.",
            notEnoughPlayers:
                "$t(error.intro) Não há jogadores suficientes para começar a partida.",
            cannotSetMode:
                "$t(error.intro) Não é possível mudar o modo fora da fase de preparação.",
            cannotSetLanguage:
                "$t(error.intro) Não é possível mudar o idioma fora da fase de preparação.",
        },
        invalid: {
            regex: "$t(error.intro) Regex inválida: {{regex}}",
            language: "$t(error.intro) Idioma inválido.",
            gameMode: "$t(error.intro) Modo de jogo inválido.",
        },
        notSupported: {
            language: '$t(intro) O idioma "{{language}}" não é suportado.',
        },
        "404": {
            word: "$t(error.intro) A palavra não está no dicionário.",
            player: "$t(error.intro) Jogador não encontrado.",
            gamer: "$t(error.intro) Jogador não encontrado na sala. Isso não deveria acontecer.",
            dictionaryResource:
                "$t(error.intro) Não foi possível encontrar o recurso do dicionário para este idioma. Isso não deveria acontecer.",
            playerStats:
                "$t(error.intro) Não foram encontradas pontuações para este jogador. Isso não deveria acontecer.",
            currentPlayer: "$t(error.intro) Não há jogador atual.",
            syllableNotExists:
                "$t(error.intro) Esta sílaba não existe em nenhuma palavra do dicionário solicitado.",
        },
        searchWords: {
            nonsensicalRecordSearch:
                "$t(error.intro) Não faz sentido ordenar palavras por record(s): {{records}}.",
            multipleSortRecords:
                "$t(error.intro) Você só pode ordenar por um record de ordenação por vez. Os records de ordenação são: {{sortRecords}}. Você ainda pode filtrar por vários records de filtro. Os records de filtro são: {{filterRecords}}.",
            mustProvideOneSyllable:
                "$t(error.intro) Você só pode ordenar por palavras multissilábicas se fornecer exatamente uma sílaba.",
        },
        invalidParams: {
            noUsername:
                "$t(error.intro) Você precisa fornecer um nome de usuário para usar este comando.",
            mustProvideWord:
                "$t(error.intro) Você precisa fornecer uma palavra para usar este comando.",
        },
        platform: {
            mustBeLoggedIn:
                '$t(intro) Você precisa estar logado no Croco.games para usar este comando. Para fazer login, vá para a página inicial https://croco.games/ e clique em "Entrar" se você tem uma conta ou "Nova conta" se não tem.',
        },
    },
    command: {
        help: {
            description:
                "Mostra a lista de comandos. Se você indicar um comando, mostra sua descrição.",
            list: "{{commandList}} — Para mais info sobre um comando, use /help [comando]",
            details:
                "/{{commandName}}: {{description}} — Uso: {{usage}} — Ex. {{example}}",
        },
        records: {
            description: "Mostra a lista de records.",
            specificRecord:
                "[{{languageFlag}} {{gameMode}} {{recordType}}] {{records}}",
            allRecords: "[{{languageFlag}} {{gameMode}}] {{records}}",
        },
        currentGameScore: {
            description:
                "Mostra as pontuações atuais da partida para um jogador. Se você não indicar um jogador, mostra as pontuações do jogador atual.",
            result: "{{username}}: {{scores}}",
            noScores: "{{username}}: Não há pontuações disponíveis",
        },
        startGame: {
            description: "Inicia a partida.",
            starting: "Iniciando partida...",
        },
        setGameMode: {
            description: "Muda o modo de jogo.",
            alreadySet: "O modo de jogo já está em {{gameMode}}.",
            setting: "Mudando modo para {{gameMode}}...",
        },
        setRoomLanguage: {
            description: "Muda o idioma da sala.",
            setting: "A sala agora está em {{language}}.",
        },
        searchWords: {
            description:
                "Procura palavras no dicionário. Você pode dar quantas sílabas ou regex quiser. O comando vai te dar as palavras que correspondem a cada regex.",
            result: "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} ocultos)] {{wordsList}}",
            noResults:
                "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} ocultos)] Não há resultados disponíveis",
            previousSyllableHint:
                "Em vez de filtrar palavras para o record {{recordType}}, você pode fornecer várias regex. Exemplo: /c ER FA, se ER é a sílaba atual e FA a sílaba anterior.",
            alphaHint:
                "Em vez de filtrar palavras para o record {{recordType}}, você pode fornecer várias regex. Exemplo: /c ^E FA, se E é a letra alpha atual e FA é a sílaba atual.",
        },
        playerProfile: {
            description: "Mostra o perfil de um jogador.",
            result: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: {{records}}",
            noRecords:
                "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: Não há records nesta categoria",
        },
        rareSyllables: {
            description: "Mostra as sílabas raras no dicionário.",
            result: "[{{languageFlag}}] Sílabas raras em {{word}}: {{rareSyllables}}",
            noneFound: "[{{languageFlag}}] Sílabas raras em {{word}}: Nenhuma",
            errorSyllableNotInDictionary:
                "$t(error.intro) Uma das sílabas da palavra fornecida não está no dicionário. Isso não deveria acontecer. Pode reportar isso no servidor do Discord?",
        },
        broadcast: {
            description:
                "Envia uma mensagem para todos os jogadores em todas as salas.",
            message: "Difusão: {{message}}",
        },
        discord: {
            description: "Fornece o link do servidor Discord.",
            result: "Servidor Discord: {{link}} - Entre no servidor para ter as últimas novidades e atualizações!",
        },
        github: {
            description: "Fornece o link do repo GitHub.",
            result: "Repo GitHub: {{link}} - Dê uma estrela se você curte o projeto e quer nos apoiar!",
        },
        donate: {
            description: "Fornece o link de doação PayPal.",
            result: "Link de doação PayPal: {{link}} - Muito obrigado pelo seu apoio!",
        },
        website: {
            description: "Fornece o link do site.",
            result: "Site: {{link}} - No site você vai encontrar todos os records dos jogadores, a doc dos comandos, e muito mais!",
        },
        uptime: {
            description: "Mostra o tempo de funcionamento do bot.",
            result: "Tempo de funcionamento: {{uptime}}",
        },
        modUser: {
            description: "Dá permissões de moderador para um jogador.",
            modding: "Moderando {{username}}...",
        },
        unmodUser: {
            description: "Remove as permissões de moderador de um jogador.",
            unmodding: "Removendo moderação de {{username}}...",
        },
        privateRoom: {
            description: "Cria uma sala privada.",
            setting: "A sala agora é privada...",
        },
        publicRoom: {
            description: "Cria uma sala pública.",
            setting: "A sala agora é pública...",
        },
        destroyAllRooms: {
            description: "Destrói todas as salas.",
            message:
                "Destruindo todas as salas, provavelmente para manutenção. BirdBot voltará em breve!",
        },
        showAllRooms: {
            description: "Mostra todas as salas.",
            result: "Salas: {{roomsList}}",
        },
        createRoom: {
            description: "Cria uma sala.",
            roomCreated: "Sala criada: https://croco.games/{{roomCode}}",
            roomAlreadyExists:
                "Você já é o proprietário de uma sala: https://croco.games/{{code}}",
            roomBeingCreated:
                "A sala está sendo criada, por favor, aguarde um pouco...",
            unknownError:
                "$t(error.intro) Um erro desconhecido ocorreu ao criar a sala. Por favor, tente novamente mais tarde.",
        },
        test: {
            description: "Comando de teste para admins.",
        },
    },
    general: {
        playerStats: {
            diedNoWords:
                "Ah não, {{username}} morreu sem colocar nenhuma palavra nesta partida. Boa sorte na próxima!",
            died: "{{username}} morreu às {{time}} depois de colocar: {{scores}}",
        },
        roomState: {
            gameModeSet: "Modo de jogo mudado para {{gameMode}}.",
        },
        scorePresentation: "{{username}} com {{score}}",
    },
    eventHandler: {
        chat: {
            commandNotFound: "Comando não encontrado: {{command}}",
            notRoomCreator:
                "Você não pode usar este comando se não for o criador da sala. /b para criar sua sala estará disponível em breve.",
        },
        submit: {
            turnCommentWithWord: "{{username}}: ({{word}}) {{comments}}.",
            turnCommentWithoutWord: "{{username}}: {{comments}}.",
            comments: {
                gainedLives:
                    "ganhou {{count}} vidas ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath: "alcançou {{count}} palavras sem morrer",
                placedLongWord:
                    "colocou uma palavra longa ({{playerTotal}}/{{globalTotal}})",
                placedHyphenatedWord:
                    "colocou uma palavra composta ({{playerTotal}}/{{globalTotal}})",
                completedAlpha: "completou um alpha: {{alphaString}}",
                placedPreviousSyllable:
                    "colocou uma sílaba anterior: {{syllable}} ({{playerTotal}}/{{globalTotal}})",
                gainedMultiSyllables:
                    "ganhou {{count}} MS ({{prompt}} x {{multiplier}}) ({{playerTotal}}/{{globalTotal}})",
                depletedSyllables:
                    "esgotou {{count}} sílaba(s): {{syllables}} ({{playerTotal}}/{{globalTotal}})",
            },
        },
    },
    lib: {
        mode: {
            easy: "Fácil",
            blitz: "Blitz",
            regular: "Normal",
            sub500: "Sub500",
            sub50: "Sub50",
            freeplay: "Freeplay",
        },
        language: {
            en: { flag: "🇺🇸", name: "Inglês" },
            fr: { flag: "🇫🇷", name: "Francês" },
            es: { flag: "🇪🇸", name: "Espanhol" },
            de: { flag: "🇩🇪", name: "Alemão" },
            it: { flag: "🇮🇹", name: "Italiano" },
            brpt: { flag: "🇧🇷", name: "Português brasileiro" },
        },
        recordType: {
            word: {
                recordName: "Palavras",
                score_one: "{{count}} palavra",
                score_other: "{{count}} palavras",
                score_specific_one: "{{count}} palavra",
                score_specific_other: "{{count}} palavras",
            },
            flips: {
                recordName: "Vidas",
                score_one: "{{count}} vida",
                score_other: "{{count}} vidas",
                score_specific_one: "{{count}} vida",
                score_specific_other: "{{count}} vidas",
            },
            alpha: {
                recordName: "Alpha",
                score: "{{formattedScore}}",
            },
            time: {
                recordName: "Tempo",
                score: "{{formattedScore}}",
            },
            depleted_syllables: {
                recordName: "Sílabas esgotadas",
                score_one: "{{count}} sílaba",
                score_other: "{{count}} sílabas",
                score_specific_one: "{{count}} sílaba esgotada",
                score_specific_other: "{{count}} sílabas esgotadas",
            },
            multi_syllable: {
                recordName: "Multi-sílabas",
                score_one: "{{count}} MS",
                score_other: "{{count}} MS",
                score_specific_one: "{{count}} MS",
                score_specific_other: "{{count}} MS",
            },
            previous_syllable: {
                recordName: "Sílabas anteriores",
                score_one: "{{count}} sílaba",
                score_other: "{{count}} sílabas",
                score_specific_one: "{{count}} sílaba anterior",
                score_specific_other: "{{count}} sílabas anteriores",
            },
            no_death: {
                recordName: "Sem morte",
                score_one: "{{count}} palavra",
                score_other: "{{count}} palavras",
                score_specific_one: "{{count}} palavra sem morrer",
                score_specific_other: "{{count}} palavras sem morrer",
            },
            hyphen: {
                recordName: "Palavras compostas",
                score_one: "{{count}} palavra",
                score_other: "{{count}} palavras",
                score_specific_one: "{{count}} palavra composta",
                score_specific_other: "{{count}} palavras compostas",
            },
            more_than_20_letters: {
                recordName: "Palavras longas",
                score_one: "{{count}} palavra",
                score_other: "{{count}} palavras",
                score_specific_one: "{{count}} palavra longa",
                score_specific_other: "{{count}} palavras longas",
            },
        },
    },
} satisfies ResourceText;
