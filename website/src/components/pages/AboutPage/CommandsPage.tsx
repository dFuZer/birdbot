import { robotoMonoFont } from "@/app/fonts";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

interface Command {
    trigger: string;
    explanation: string;
    id: string;
    condition?: Condition;
    uses?: string[];
    exampleUses?: { use: string; useDescription: string }[];
    shorthand?: string;
}

const commands: Command[] = [
    {
        trigger: "/help",
        explanation: "Shows the list of commands. If a command is provided, it will show the description of that command.",
        id: "help",
        shorthand: "/h",
        uses: ["/help", "/help [command]"],
        exampleUses: [
            { use: "/help", useDescription: "Shows the list of all available commands" },
            { use: "/help records", useDescription: "Shows detailed information about the records command" },
        ],
    },
    {
        trigger: "/searchwords",
        explanation: "Use this command to search for words in the dictionary. You can pass syllables or regexes, and optionally filter or sort by a record type.",
        id: "searchwords",
        shorthand: "/c",
        uses: ["/c [prompt]", "/c [...regexes]", "/c (-record) [...syllables|regexes]"],
        exampleUses: [
            { use: "/c test", useDescription: `Search for words containing "test"` },
            { use: "/c ^test", useDescription: `Search for words starting with "test"` },
            { use: "/c test$", useDescription: `Search for words ending with "test"` },
            { use: "/c -fr test", useDescription: `Search for French words containing "test"` },
            {
                use: "/c -sn en",
                useDescription: `Search for words containing "en" that perform well for the SN category (depleted syllables)`,
            },
            { use: "/c -flip .", useDescription: `Search for the best words containing any prompt to flip (gain a life)` },
            {
                use: "/c -ms an",
                useDescription: `Search for the best MS words for the prompt "an" (words that contain "an" the most times)`,
            },
            {
                use: "/c -hyphen .",
                useDescription: `Search for hyphenated words containing any prompt`,
            },
            { use: "/c -life syll", useDescription: `Search for words containing "syll" that perform well for flips` },
            { use: "/c a b c d e f", useDescription: `Search for words containing A, B, C, D, E, and F` },
        ],
    },
    {
        trigger: "/records",
        explanation: "Shows the list of records for a specific language and game mode.",
        id: "records",
        shorthand: "/r",
        uses: ["/records", "/records [recordType]", "/records (-language) (-mode)"],
        exampleUses: [
            { use: "/records", useDescription: "Shows all records for the current language and mode" },
            { use: "/records words", useDescription: "Shows the words record" },
            { use: "/records fr regular", useDescription: "Shows all records for French language in regular mode" },
        ],
    },
    {
        trigger: "/score",
        explanation:
            "Shows the current game scores for a given player. If no player is provided, it will show the scores for the current player.",
        id: "score",
        shorthand: "/j",
        uses: ["/score", "/score [player]", "/stats", "/j"],
        exampleUses: [
            { use: "/score", useDescription: "Shows your current game scores" },
            { use: "/score dfuzer", useDescription: "Shows dfuzer's current game scores" },
        ],
    },
    {
        trigger: "/xp",
        explanation: "Shows the XP and level of a given player. If no player is provided, it will show your own XP.",
        id: "xp",
        shorthand: "/x",
        uses: ["/xp", "/xp [username]"],
        exampleUses: [
            { use: "/xp", useDescription: "Shows your XP and level" },
            { use: "/xp dfuzer", useDescription: "Shows dfuzer's XP and level" },
        ],
    },
    {
        trigger: "/showtime",
        explanation: "Shows how long the current game has been going.",
        id: "showtime",
        shorthand: "/t",
        uses: ["/showtime", "/time", "/t"],
        exampleUses: [{ use: "/t", useDescription: "Shows the elapsed time of the current game" }],
    },
    {
        trigger: "/speed",
        explanation:
            "Shows global speed milestones, or a specific player's milestones when a name is provided. Alias: /s.",
        id: "speed",
        shorthand: "/s",
        uses: ["/speed", "/speed [player]", "/s"],
        exampleUses: [
            { use: "/s", useDescription: "Shows the global speed milestone board" },
            { use: "/s dfuzer", useDescription: "Shows dfuzer's speed milestones" },
        ],
    },
    {
        trigger: "/accuracy",
        explanation: "Shows global accuracy streak milestones, or a specific player's milestones.",
        id: "accuracy",
        shorthand: "/acc",
        uses: ["/accuracy", "/accuracy [player]", "/acc"],
        exampleUses: [
            { use: "/acc", useDescription: "Shows the global accuracy milestone board" },
            { use: "/acc dfuzer", useDescription: "Shows dfuzer's accuracy milestones" },
        ],
    },
    {
        trigger: "/credits",
        explanation: "Shows your BirdBot credit balance. Credits are earned from scored games and can buy VIP.",
        id: "credits",
        uses: ["/credits"],
        exampleUses: [{ use: "/credits", useDescription: "Shows your credit balance" }],
    },
    {
        trigger: "/economy",
        explanation: "Shows credits, VIP tier, and recent purchases for you or another player.",
        id: "economy",
        uses: ["/economy", "/economy [player]", "/vip"],
        exampleUses: [
            { use: "/economy", useDescription: "Shows your economy profile" },
            { use: "/vip dfuzer", useDescription: "Shows dfuzer's VIP/economy profile" },
        ],
    },
    {
        trigger: "/buy",
        explanation: "Purchases VIP (500 credits) or VIP+ (1000 credits).",
        id: "buy",
        condition: "logged-in",
        uses: ["/buy vip", "/buy vip+"],
        exampleUses: [{ use: "/buy vip", useDescription: "Buys VIP if you have enough credits" }],
    },
    {
        trigger: "/setname",
        explanation: "Sets your BirdBot profile name (limited to once every 30 days).",
        id: "setname",
        condition: "logged-in",
        uses: ["/setname [name]"],
        exampleUses: [{ use: "/setname dfuzer", useDescription: "Claims the profile name dfuzer" }],
    },
    {
        trigger: "/cwm",
        explanation: "Sets the welcome message used when you join a room. Requires VIP. Use clear to remove it.",
        id: "cwm",
        condition: "logged-in",
        uses: ["/cwm [value]", "/cwm clear"],
        exampleUses: [
            { use: "/cwm hello everyone", useDescription: "Sets your welcome message" },
            { use: "/cwm clear", useDescription: "Removes your welcome message" },
        ],
    },
    {
        trigger: "/cbbn",
        explanation: "Sets the BirdBot name used in rooms you create. Requires VIP. Use clear to remove it.",
        id: "cbbn",
        shorthand: "/cn",
        condition: "logged-in",
        uses: ["/cbbn [value]", "/cbbn clear"],
        exampleUses: [
            { use: "/cn Birdie", useDescription: "Sets the bot name used in your rooms" },
            { use: "/cn clear", useDescription: "Resets the bot name" },
        ],
    },
    {
        trigger: "/crn",
        explanation: "Sets the name used for rooms you create. Requires VIP+. Use clear to remove it.",
        id: "crn",
        condition: "logged-in",
        uses: ["/crn [value]", "/crn clear"],
        exampleUses: [
            { use: "/crn Night Owl", useDescription: "Sets the room name used when you create a room" },
            { use: "/crn clear", useDescription: "Resets the room name" },
        ],
    },
    {
        trigger: "/cpp",
        explanation: "Copies your current jklm.fun profile picture onto BirdBot for rooms you create. Requires VIP+.",
        id: "cpp",
        condition: "logged-in",
        uses: ["/cpp"],
        exampleUses: [{ use: "/cpp", useDescription: "Copies your current profile picture onto BirdBot" }],
    },
    {
        trigger: "/link",
        explanation:
            "Links your Discord account to your jklm.fun account using a token from the website. This unlocks website features.",
        id: "link",
        condition: "logged-in",
        uses: ["/link [token]"],
        exampleUses: [{ use: "/link abc123", useDescription: "Links your account with the given token" }],
    },
    {
        trigger: "/connect",
        explanation: "Explains how to log in to jklm.fun.",
        id: "connect",
        uses: ["/connect"],
        exampleUses: [{ use: "/connect", useDescription: "Shows login instructions" }],
    },
    {
        trigger: "/profile",
        explanation: "Shows the player profile of a given player, including their records and statistics.",
        id: "profile",
        shorthand: "/p",
        uses: ["/p", "/p [username]", "/p [username] (-language -mode)"],
        exampleUses: [
            { use: "/p", useDescription: "Shows your own profile if you are logged in" },
            { use: "/p dfuzer", useDescription: "Shows dfuzer's profile" },
            { use: "/p -fr dfuzer", useDescription: "Shows dfuzer's profile for French language" },
            { use: "/p -fr -regular dfuzer", useDescription: "Shows dfuzer's profile for French language in regular mode" },
        ],
    },
    {
        trigger: "/definition",
        explanation: "Looks up the definition of a word (French and English). You can pass a page number and a language flag.",
        id: "definition",
        shorthand: "/d",
        uses: ["/d [word]", "/d [word] [page]", "/d (-language) [word] [page]"],
        exampleUses: [
            { use: "/d test", useDescription: `Shows the first definition of "test"` },
            { use: "/d test 2", useDescription: `Shows the second definition of "test"` },
            { use: "/d -fr maison 1", useDescription: `Shows the first French definition of "maison"` },
        ],
    },
    {
        trigger: "/startnow",
        explanation: "Starts the game immediately if there are enough players.",
        id: "startnow",
        shorthand: "/sn",
        condition: "room-owner",
        uses: ["/startnow", "/start", "/sn"],
        exampleUses: [{ use: "/sn", useDescription: "Starts the game immediately" }],
    },
    {
        trigger: "/mode",
        explanation:
            "Sets the game mode for the room. Available modes: regular, easy, blitz, sub500, sub50, freeplay, and custom.",
        id: "mode",
        shorthand: "/m",
        condition: "room-owner",
        uses: [
            "/mode [gameMode]",
            "/mode custom [difficulty] [turn] [age] [startingLives] [maxLives]",
        ],
        exampleUses: [
            { use: "/mode regular", useDescription: "Sets the game mode to regular" },
            { use: "/mode blitz", useDescription: "Sets the game mode to blitz" },
            { use: "/mode easy", useDescription: "Sets the game mode to easy" },
            {
                use: "/mode custom 0 5 8 2 3",
                useDescription: "Custom mode: difficulty 0, 5s turn, prompt age 8, 2 starting lives, 3 max lives",
            },
        ],
    },
    {
        trigger: "/playstyle",
        explanation:
            "Sets how BirdBot chooses words. Playstyles: regular, alpha, previous, life (flips), sn (depleted syllables), ms (multi-syllable), or a listed record such as plant or food.",
        id: "playstyle",
        shorthand: "/ps",
        condition: "room-owner",
        uses: ["/playstyle [regular|alpha|previous|life|sn|ms|record]", "/ps [playstyle]"],
        exampleUses: [
            { use: "/ps alpha", useDescription: "BirdBot prioritizes alpha words" },
            { use: "/ps sn", useDescription: "BirdBot prioritizes depleted-syllable words" },
            { use: "/ps plant", useDescription: "BirdBot prioritizes words from the plant list" },
            { use: "/ps regular", useDescription: "Resets BirdBot to the default playstyle" },
        ],
    },
    {
        trigger: "/train",
        explanation:
            "Activates a training mode where you have to place as many words from a training list as possible. Call /train with no arguments to toggle training on or off. You can train on a record list, or on regex matches with optional sort flags (-l longest, -s shortest, -sn depleted syllables).",
        id: "train",
        condition: "room-owner",
        uses: ["/train", "/train [record]", "/train [regexes] (-record -l -s -sn)"],
        exampleUses: [
            { use: "/train", useDescription: "Toggles training mode on or off" },
            { use: "/train food", useDescription: "Trains on the food word list" },
            { use: "/train ^pre -l", useDescription: `Trains on words starting with "pre", sorted by longest first` },
            { use: "/train -hyphen .", useDescription: "Trains on hyphenated words" },
            { use: "/train -sn", useDescription: "Trains on low-substitution words, sorted for depleted syllables" },
        ],
    },
    {
        trigger: "/language",
        explanation: "Sets the language of the room.",
        id: "language",
        shorthand: "/l",
        condition: "room-owner",
        uses: ["/language [language]"],
        exampleUses: [
            { use: "/language fr", useDescription: "Sets the room language to French" },
            { use: "/language en", useDescription: "Sets the room language to English" },
        ],
    },
    {
        trigger: "/bl",
        explanation:
            "Changes the bonus alphabet. Use default to restore language defaults, reset to clear then set letters, or letter:count pairs to override specific letters.",
        id: "bl",
        condition: "room-owner",
        uses: ["/bl default", "/bl reset", "/bl a:1 b:0", "/bl reset x:1"],
        exampleUses: [
            { use: "/bl default", useDescription: "Restores the language default bonus letters" },
            { use: "/bl a:2 z:1", useDescription: "Sets A to 2 and Z to 1, keeping other language defaults" },
            { use: "/bl reset q:1", useDescription: "Clears all bonus letters, then sets Q to 1" },
        ],
    },
    {
        trigger: "/raresyllables",
        explanation: "Shows the rare syllables in a given word.",
        id: "raresyllables",
        shorthand: "/rs",
        uses: ["/raresyllables [word]", "/raresyllables [word] (-language)"],
        exampleUses: [
            { use: "/rs test", useDescription: `Shows rare syllables in the word "test"` },
            { use: "/rs -fr test", useDescription: `Shows rare syllables in the word "test" in the French dictionary` },
        ],
    },
    {
        trigger: "/news",
        explanation: "Shows the latest published BirdBot news.",
        id: "news",
        uses: ["/news"],
        exampleUses: [{ use: "/news", useDescription: "Shows the latest BirdBot news" }],
    },
    {
        trigger: "/createroom",
        explanation: "Creates a new room with specified language and mode. Add private to create a private room.",
        id: "createroom",
        shorthand: "/b",
        condition: "logged-in",
        uses: ["/createroom", "/createroom (-language -mode)", "/createroom private"],
        exampleUses: [
            { use: "/createroom", useDescription: "Creates a new room with default settings" },
            { use: "/createroom fr regular", useDescription: "Creates a new room with French language and regular mode" },
            { use: "/b private en blitz", useDescription: "Creates a private English blitz room" },
        ],
    },
    {
        trigger: "/destroy",
        explanation: "Destroys the current room.",
        id: "destroy",
        shorthand: "/dr",
        condition: "room-owner",
        uses: ["/destroy"],
        exampleUses: [{ use: "/destroy", useDescription: "Destroys the current room" }],
    },
    {
        trigger: "/mod",
        explanation: "Gives moderator capabilities to a user.",
        id: "mod",
        condition: "room-owner",
        uses: ["/mod [username]"],
        exampleUses: [{ use: "/mod dfuzer", useDescription: "Makes dfuzer a moderator in the room" }],
    },
    {
        trigger: "/unmod",
        explanation: "Removes moderator capabilities from a user.",
        id: "unmod",
        condition: "room-owner",
        uses: ["/unmod [username]"],
        exampleUses: [{ use: "/unmod dfuzer", useDescription: "Removes dfuzer's moderator status" }],
    },
    {
        trigger: "/donate",
        explanation: "Shows the donation link.",
        id: "donate",
    },
    {
        trigger: "/github",
        explanation: "Shows the GitHub repository link.",
        id: "github",
    },
    {
        trigger: "/website",
        explanation: "Shows the website link.",
        id: "website",
    },
    {
        trigger: "/discord",
        explanation: "Shows the Discord server link.",
        id: "discord",
    },
    {
        trigger: "/uptime",
        explanation: "Shows the uptime of the bot.",
        id: "uptime",
    },
    {
        trigger: "/boom",
        explanation: "Boom.",
        id: "boom",
        uses: ["/boom"],
        exampleUses: [{ use: "/boom", useDescription: "💥" }],
    },
];

type Condition = "logged-in" | "room-owner";

function ConditionBadge({ condition }: { condition: Condition }) {
    const color = condition === "logged-in" ? "bg-green-200/40 text-green-700/60" : "bg-red-200/40 text-red-600/60";
    const badgeStr = condition === "logged-in" ? "logged in" : "room owner";
    return (
        <div className={`w-[5.4rem] min-w-[5.4rem] rounded-lg py-1 text-center text-xs font-semibold text-nowrap ${color}`}>
            {badgeStr}
        </div>
    );
}

export default function CommandsPage() {
    const items = commands.map((command) => (
        <AccordionItem value={command.id} className="rounded-xl bg-neutral-50 shadow-sm" key={command.id}>
            <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger asChild>
                    <button className="flex w-full gap-4 border-neutral-100 px-6 py-3 font-semibold [&[data-state=closed]_.openIcon]:hidden [&[data-state=open]]:border-b [&[data-state=open]_.closeIcon]:hidden">
                        <div className="flex items-center gap-2">
                            <PlusCircleIcon className="closeIcon size-5" />
                            <MinusCircleIcon className="openIcon size-5" />
                            <div className={robotoMonoFont.className}>{command.trigger}</div>
                        </div>
                        <div className="flex flex-1 justify-end gap-2">
                            {command.condition && <ConditionBadge condition={command.condition} />}
                            <div>
                                <p className={`${robotoMonoFont.className} text-neutral-600`}>{command.shorthand}</p>
                            </div>
                        </div>
                    </button>
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-6 py-3 text-sm">
                <p>{command.explanation}</p>
                {command.uses && command.uses.length > 0 && (
                    <div className="mt-4 mb-4 flex flex-col gap-2">
                        <p className="mb-2 text-lg font-semibold">Uses:</p>
                        {command.uses?.map((use) => (
                            <p className={`${robotoMonoFont.className} text-base font-semibold text-neutral-950`} key={use}>
                                {use}
                            </p>
                        ))}
                    </div>
                )}
                {command.exampleUses && command.exampleUses.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <p className="mb-2 text-lg font-semibold">Example Uses:</p>
                        {command.exampleUses?.map((exampleUse) => (
                            <p key={exampleUse.use}>
                                <span className={`${robotoMonoFont.className} text-base font-semibold text-neutral-950`}>
                                    {exampleUse.use}
                                </span>
                                <span className="text-sm">&nbsp;&nbsp;&nbsp;&nbsp;{exampleUse.useDescription}</span>
                            </p>
                        ))}
                    </div>
                )}
            </AccordionPrimitive.Content>
        </AccordionItem>
    ));

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Commands</h1>
            <p className="text-sm text-neutral-500">Updated 16 Sept 2026</p>
            <p className="text-sm text-neutral-600">You can find all of the commands available on BirdBot below.</p>
            <div className="my-2 space-y-2">
                <div className="flex items-center gap-4">
                    <ConditionBadge condition="logged-in" />
                    <p className="text-sm text-neutral-600">To use this command, you need to be logged in to Croco.games</p>
                </div>
                <div className="flex items-center gap-4">
                    <ConditionBadge condition="room-owner" />
                    <p className="text-sm text-neutral-600">
                        To use this command, you need to be logged in and the owner of the room you are in
                    </p>
                </div>
            </div>
            {items.length ? (
                <Accordion type="single" className="space-y-2" collapsible>
                    {items}
                </Accordion>
            ) : (
                <p className="mt-10 text-center text-sm text-neutral-500">No commands available yet</p>
            )}
        </div>
    );
}
