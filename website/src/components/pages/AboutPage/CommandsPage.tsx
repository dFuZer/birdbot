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
        explanation: "Use this command to search for words in the dictionary.",
        id: "searchwords",
        shorthand: "/c",
        uses: [
            "/c [prompt]",
            "/c [...regexps]",
            "/c (-lang) [prompt]",
            "/c (-sortByRecord) [prompt]",
            "/c (-filterByRecord) [prompt]",
        ],
        exampleUses: [
            { use: "/c test", useDescription: `Search for words containing "test"` },
            { use: "/c ^test", useDescription: `Search for words starting with "test"` },
            { use: "/c test$", useDescription: `Search for words ending with "test"` },
            { use: "/c -fr test", useDescription: `Search for French words containing "test"` },
            {
                use: "/c -sn en",
                useDescription: `Search for words containing "en" and perform well for the SN category (depleted syllables)`,
            },
            { use: "/c -flip .", useDescription: `Search for the best words containing any prompt to flip (gain a life)` },
            {
                use: "/c -ms an",
                useDescription: `Search for the best MS words for the prompt "an", which means the word that contain an a maximum number of times`,
            },
            {
                use: "/c -hyphen -long .",
                useDescription: `Search for words containing any prompt that are hyphenated and are longer than 20 characters`,
            },
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
        shorthand: "/s",
        uses: ["/score", "/score [player]"],
        exampleUses: [
            { use: "/score", useDescription: "Shows your current game scores" },
            { use: "/score dfuzer", useDescription: "Shows dfuzer's current game scores" },
        ],
    },
    {
        trigger: "/profile",
        explanation: "Shows the player profile of a given player, including their records and statistics.",
        id: "profile",
        shorthand: "/p",
        uses: ["/profile [username]", "/profile [username] (-language -mode)"],
        exampleUses: [
            { use: "/profile dfuzer", useDescription: "Shows dfuzer's profile" },
            { use: "/profile -fr dfuzer", useDescription: "Shows dfuzer's profile for French language" },
            { use: "/profile -fr -regular dfuzer", useDescription: "Shows dfuzer's profile for French language in regular mode" },
        ],
    },
    {
        trigger: "/startnow",
        explanation: "Starts the game immediately if there are enough players.",
        id: "startnow",
        shorthand: "/sn",
        condition: "room-owner",
        uses: ["/startnow"],
        exampleUses: [{ use: "/startnow", useDescription: "Starts the game immediately" }],
    },
    {
        trigger: "/mode",
        explanation: "Sets the game mode for the room.",
        id: "mode",
        shorthand: "/m",
        condition: "room-owner",
        uses: ["/mode [gameMode]"],
        exampleUses: [
            { use: "/mode regular", useDescription: "Sets the game mode to regular" },
            { use: "/mode blitz", useDescription: "Sets the game mode to blitz" },
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
        trigger: "/createroom",
        explanation: "Creates a new room with specified language and mode.",
        id: "createroom",
        shorthand: "/b",
        condition: "logged-in",
        uses: ["/createroom", "/createroom (-language -mode)"],
        exampleUses: [
            { use: "/createroom", useDescription: "Creates a new room with default settings" },
            { use: "/createroom fr regular", useDescription: "Creates a new room with French language and regular mode" },
        ],
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
