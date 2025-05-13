import { ResourceText } from "./englishTexts";

export const spanishTexts = {
    error: {
        intro: "Error:",
        missing_text:
            "Falta el texto traducido. Esto no debería pasar. ¿Podrías reportarlo en el servidor de Discord?",
        unspecific: "$t(error.intro) Ha ocurrido un error desconocido.",
        api: {
            inaccessible:
                "$t(error.intro) La API no está accesible. ¡Inténtalo más tarde!",
        },
        roomState: {
            noGameInProgress: "$t(error.intro) No hay partida en curso.",
            notInPregame:
                "$t(error.intro) No hay partida en fase de preparación.",
            notEnoughPlayers:
                "$t(error.intro) No hay suficientes jugadores para empezar la partida.",
            cannotSetMode:
                "$t(error.intro) No se puede cambiar el modo fuera de la fase de preparación.",
            cannotSetLanguage:
                "$t(error.intro) No se puede cambiar el idioma fuera de la fase de preparación.",
        },
        invalid: {
            regex: "$t(error.intro) Regex inválida: {{regex}}",
            language: "$t(error.intro) Idioma inválido.",
            gameMode: "$t(error.intro) Modo de juego inválido.",
        },
        notSupported: {
            language: '$t(intro) El idioma "{{language}}" no está soportado.',
        },
        "404": {
            word: "$t(error.intro) La palabra no está en el diccionario.",
            player: "$t(error.intro) Jugador no encontrado.",
            gamer: "$t(error.intro) Jugador no encontrado en la sala. Esto no debería pasar.",
            dictionaryResource:
                "$t(error.intro) No se puede encontrar el recurso del diccionario para este idioma. Esto no debería pasar.",
            playerStats:
                "$t(error.intro) No se encuentran puntuaciones para este jugador. Esto no debería pasar.",
            currentPlayer: "$t(error.intro) No hay jugador actual.",
            syllableNotExists:
                "$t(error.intro) Esta sílaba no existe en ninguna palabra del diccionario solicitado.",
        },
        searchWords: {
            nonsensicalRecordSearch:
                "$t(error.intro) No tiene sentido ordenar palabras por record(s): {{records}}.",
            multipleSortRecords:
                "$t(error.intro) Solo puedes ordenar por un record de orden a la vez. Los records de orden son: {{sortRecords}}. Puedes seguir filtrando por varios records de filtrado. Los records de filtrado son: {{filterRecords}}.",
            mustProvideOneSyllable:
                "$t(error.intro) Solo puedes ordenar por palabras multisilábicas si proporcionas exactamente una sílaba.",
        },
        invalidParams: {
            noUsername:
                "$t(error.intro) Tienes que proporcionar un nombre de usuario para usar este comando.",
            mustProvideWord:
                "$t(error.intro) Tienes que proporcionar una palabra para usar este comando.",
        },
        platform: {
            mustBeLoggedIn:
                '$t(intro) Tienes que estar conectado a Croco.games para usar este comando. Para conectarte, ve a la página principal https://croco.games/ y haz clic en "Iniciar sesión" si tienes una cuenta o "Nueva cuenta" si no tienes.',
        },
    },
    command: {
        help: {
            description:
                "Muestra la lista de comandos. Si indicas un comando, muestra su descripción.",
            list: "{{commandList}} — Para más info sobre un comando, usa /help [comando]",
            details:
                "/{{commandName}}: {{description}} — Uso: {{usage}} — Ej. {{example}}",
        },
        records: {
            description: "Muestra la lista de records.",
            specificRecord:
                "[{{languageFlag}} {{gameMode}} {{recordType}}] {{records}}",
            allRecords: "[{{languageFlag}} {{gameMode}}] {{records}}",
        },
        currentGameScore: {
            description:
                "Muestra las puntuaciones actuales de la partida para un jugador. Si no indicas jugador, muestra las puntuaciones del jugador actual.",
            result: "{{username}}: {{scores}}",
            noScores: "{{username}}: No hay puntuaciones disponibles",
        },
        startGame: {
            description: "Inicia la partida.",
            starting: "Iniciando partida...",
        },
        setGameMode: {
            description: "Cambia el modo de juego.",
            alreadySet: "El modo de juego ya está en {{gameMode}}.",
            setting: "Cambiando modo a {{gameMode}}...",
        },
        setRoomLanguage: {
            description: "Cambia el idioma de la sala.",
            setting: "La sala ahora está en {{language}}.",
        },
        searchWords: {
            description:
                "Busca palabras en el diccionario. Puedes dar tantas sílabas o regex como quieras. El comando te dará las palabras que coincidan con cada regex.",
            result: "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} ocultos)] {{wordsList}}",
            noResults:
                "[{{recordTypes}}{{resultCount}} res. ({{hiddenCount}} ocultos)] No hay resultados disponibles",
            previousSyllableHint:
                "En lugar de filtrar palabras para el record {{recordType}}, puedes proporcionar varias regex. Ejemplo: /c ER FA, si ER es la sílaba actual y FA la sílaba anterior.",
            alphaHint:
                "En lugar de filtrar palabras para el record {{recordType}}, puedes proporcionar varias regex. Ejemplo: /c ^E FA, si E es la letra alpha actual y FA es la sílaba actual.",
        },
        playerProfile: {
            description: "Muestra el perfil de un jugador.",
            result: "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: {{records}}",
            noRecords:
                "[{{languageFlag}} {{gameMode}}] {{playerUsername}}: No hay records en esta categoría",
        },
        rareSyllables: {
            description: "Muestra las sílabas raras en el diccionario.",
            result: "[{{languageFlag}}] Sílabas raras en {{word}}: {{rareSyllables}}",
            noneFound: "[{{languageFlag}}] Sílabas raras en {{word}}: Ninguna",
            errorSyllableNotInDictionary:
                "$t(error.intro) Una de las sílabas de la palabra dada no está en el diccionario. Esto no debería pasar. ¿Podrías reportarlo en el servidor de Discord?",
        },
        broadcast: {
            description:
                "Envía un mensaje a todos los jugadores en todas las salas.",
            message: "Difusión: {{message}}",
        },
        discord: {
            description: "Da el enlace del servidor de Discord.",
            result: "Servidor de Discord: {{link}} - ¡Únete al servidor para tener las últimas noticias y actualizaciones!",
        },
        github: {
            description: "Da el enlace del repo de GitHub.",
            result: "Repo de GitHub: {{link}} - ¡Dale una estrella si te mola el proyecto y quieres apoyarnos!",
        },
        donate: {
            description: "Da el enlace de donación de PayPal.",
            result: "Enlace de donación PayPal: {{link}} - ¡Muchas gracias por tu apoyo!",
        },
        website: {
            description: "Da el enlace de la web.",
            result: "Web: {{link}} - ¡En la web encontrarás todos los records de los jugadores, la doc de los comandos, y muchas más cosas!",
        },
        uptime: {
            description: "Da el tiempo de funcionamiento del bot.",
            result: "Tiempo de funcionamiento: {{uptime}}",
        },
        modUser: {
            description: "Da permisos de moderador a un jugador.",
            modding: "Moderando a {{username}}...",
        },
        unmodUser: {
            description: "Quita los permisos de moderador a un jugador.",
            unmodding: "Quitando moderación a {{username}}...",
        },
        privateRoom: {
            description: "Crea una sala privada.",
            setting: "La sala ahora es privada...",
        },
        publicRoom: {
            description: "Crea una sala pública.",
            setting: "La sala ahora es pública...",
        },
        destroyAllRooms: {
            description: "Destruye todas las salas.",
            message:
                "Destruyendo todas las salas, probablemente por mantenimiento. ¡BirdBot volverá pronto!",
        },
        showAllRooms: {
            description: "Muestra todas las salas.",
            result: "Salas: {{roomsList}}",
        },
        createRoom: {
            description: "Crea una sala.",
            roomCreated: "Sala creada: https://croco.games/{{roomCode}}",
            roomAlreadyExists:
                "Ya eres el propietario de una sala: https://croco.games/{{roomCode}}",
            roomBeingCreated:
                "La sala está siendo creada, por favor, espera un poco...",
            unknownError:
                "$t(error.intro) Un error desconocido ocurrió al crear la sala. Por favor, inténtalo de nuevo más tarde.",
        },
        test: {
            description: "Comando de prueba para admins.",
        },
    },
    general: {
        playerStats: {
            diedNoWords:
                "¡Oh no, {{username}} ha muerto sin colocar ninguna palabra en esta partida. ¡Buena suerte la próxima vez!",
            died: "{{username}} ha muerto a las {{time}} después de colocar: {{scores}}",
        },
        roomState: {
            gameModeSet: "Modo de juego cambiado a {{gameMode}}.",
        },
        scorePresentation: "{{username}} con {{score}}",
    },
    eventHandler: {
        chat: {
            commandNotFound: "Comando no encontrado: {{command}}",
            notRoomCreator:
                "No puedes usar este comando si no eres el creador de la sala. /b para crear tu sala estará disponible pronto.",
        },
        submit: {
            turnCommentWithWord: "{{username}}: ({{word}}) {{comments}}.",
            turnCommentWithoutWord: "{{username}}: {{comments}}.",
            comments: {
                gainedLives:
                    "ha ganado {{count}} vidas ({{playerTotal}}/{{globalTotal}})",
                reachedWordsNoDeath:
                    "ha alcanzado {{count}} palabras sin morir",
                placedLongWord:
                    "ha colocado una palabra larga ({{playerTotal}}/{{globalTotal}})",
                placedHyphenatedWord:
                    "ha colocado una palabra compuesta ({{playerTotal}}/{{globalTotal}})",
                completedAlpha: "ha completado un alpha: {{alphaString}}",
                placedPreviousSyllable:
                    "ha colocado una sílaba anterior: {{syllable}} ({{playerTotal}}/{{globalTotal}})",
                gainedMultiSyllables:
                    "ha ganado {{count}} MS ({{prompt}} x {{multiplier}}) ({{playerTotal}}/{{globalTotal}})",
                depletedSyllables:
                    "ha agotado {{count}} sílaba(s): {{syllables}} ({{playerTotal}}/{{globalTotal}})",
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
            en: { flag: "🇺🇸", name: "Inglés" },
            fr: { flag: "🇫🇷", name: "Francés" },
            es: { flag: "🇪🇸", name: "Español" },
            de: { flag: "🇩🇪", name: "Alemán" },
            it: { flag: "🇮🇹", name: "Italiano" },
            brpt: { flag: "🇧🇷", name: "Portugués brasileño" },
        },
        recordType: {
            word: {
                recordName: "Palabras",
                score_one: "{{count}} palabra",
                score_other: "{{count}} palabras",
                score_specific_one: "{{count}} palabra",
                score_specific_other: "{{count}} palabras",
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
                recordName: "Tiempo",
                score: "{{formattedScore}}",
            },
            depleted_syllables: {
                recordName: "Sílabas agotadas",
                score_one: "{{count}} sílaba",
                score_other: "{{count}} sílabas",
                score_specific_one: "{{count}} sílaba agotada",
                score_specific_other: "{{count}} sílabas agotadas",
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
                recordName: "Sin muerte",
                score_one: "{{count}} palabra",
                score_other: "{{count}} palabras",
                score_specific_one: "{{count}} palabra sin morir",
                score_specific_other: "{{count}} palabras sin morir",
            },
            hyphen: {
                recordName: "Palabras compuestas",
                score_one: "{{count}} palabra",
                score_other: "{{count}} palabras",
                score_specific_one: "{{count}} palabra compuesta",
                score_specific_other: "{{count}} palabras compuestas",
            },
            more_than_20_letters: {
                recordName: "Palabras largas",
                score_one: "{{count}} palabra",
                score_other: "{{count}} palabras",
                score_specific_one: "{{count}} palabra larga",
                score_specific_other: "{{count}} palabras largas",
            },
        },
    },
} satisfies ResourceText;
