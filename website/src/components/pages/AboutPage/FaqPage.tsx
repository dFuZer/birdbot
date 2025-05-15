import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { DISCORD_SERVER_LINK, GITHUB_REPO_LINK, PAYPAL_DONATE_LINK } from "@/lib/links";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import Link from "next/link";

interface Question {
    trigger: string;
    answer: React.ReactNode;
    id: string;
}

const questions: Question[] = [
    {
        trigger: "How do I log in to BirdBot ?",
        answer: `You cannot really log in to BirdBot. To use certain BirdBot commands, you must be connected to the Croco.games platform. To connect to Croco.games, go to the home page and click "Log in" if you have an account or "New account" if you don't.`,
        id: "log-in",
    },
    {
        trigger: "How do I create a room with BirdBot ?",
        answer: "Use /b in a room where BirdBot is present to create a room with BirdBot. If you want to create your room in a specific mode or language, just give the parameters to the command. Example: /b english blitz - You must be connected to the Croco.games platform to use this command.",
        id: "create-room",
    },
    {
        trigger: "Can I make BirdBot join my room ?",
        answer: "No, BirdBot cannot join your room. It can only create a room for you and give you the link so that you can join.",
        id: "join-room",
    },
    {
        trigger: "What are performance points (pp) ?",
        answer: (
            <div>
                <p>Performance points (pp) are a way to measure your skill in BombParty.</p>
                <p>The way performance points are calculated is inspired from the game osu!.</p>
                <p>It is quite complex, but here is the basic idea:</p>
                <p className="mt-2">
                    You get performance points for each record category, and only for your <b>best score</b> in each category.
                </p>
                <p className="mt-2">
                    Each performance has a <b>weight</b>, and it decreases based on the rank of that performance relative to your
                    other performances.
                </p>
                <p className="mt-2">
                    For example, your <b>best</b> performance will have a weight of <b>100%</b>, and your <b>second</b> best
                    performance will have a weight of <b>88%</b>, your <b>third</b> best performance will have a weight of{" "}
                    <b>76%</b>, and so on.
                </p>
                <p className="mt-2">
                    The PPs you gain from a performance is not <b>relative</b> to the performances or records of other players, it
                    is calculated in an <b>&quot;absolute&quot;</b> way.
                </p>
                <p className="mt-2">
                    Each record category has a score to pp ratio. For example, you get <b>500pp</b> if you achieve the following
                    scores:
                </p>
                <ul className="my-2 list-inside list-disc">
                    <li>
                        <b>5 hours</b> of game time
                    </li>
                    <li>
                        <b>7000</b> words
                    </li>
                    <li>
                        <b>350</b> flips
                    </li>
                    <li>
                        <b>1100</b> depleted syllables
                    </li>
                    <li>
                        <b>100</b> completed alphas
                    </li>
                    <li>
                        <b>2000</b> words without death
                    </li>
                    <li>
                        <b>1500</b> multi syllables
                    </li>
                    <li>
                        <b>1500</b> previous syllables
                    </li>
                    <li>
                        <b>1500</b> of any listed record (long, hyphen, etc)
                    </li>
                </ul>
                <p>Then, an additional weight is applied based on the mode you are playing in.</p>
                <p className="mt-2">The weight per mode is the following:</p>
                <ul className="my-2 list-inside list-disc">
                    <li>
                        Regular: <b>100%</b>
                    </li>
                    <li>
                        Easy: <b>70%</b>
                    </li>
                    <li>
                        Blitz: <b>220%</b>
                    </li>
                    <li>
                        Sub500: <b>150%</b>
                    </li>
                    <li>
                        Sub50: <b>220%</b>
                    </li>
                    <li>
                        Freeplay: <b>40%</b>
                    </li>
                </ul>
                <p>
                    For example, if you get the <b>5 hours</b> of game time in Blitz mode, you will get <b>500</b> * <b>220%</b> ={" "}
                    <b>1100pp</b>.
                </p>
            </div>
        ),
        id: "performance-points",
    },
    {
        trigger: "What is the Alpha record ?",
        answer: "The Alpha record represents the number of times you have looped around the alphabet with the first letter of your word. For example, if you place the word ANTIQUE at the start of the game, your alpha will go from 0 (A) to 0 (B) (because the first letter of the word is A) and then to 0 (C) and so on until you get to 0 (Z). When you get to Z, if you place a word that starts with Z, you will have completed an alpha and your score will become 1 (A).",
        id: "alpha",
    },
    {
        trigger: "What is the SN or the depleted syllables record ?",
        answer: "The SN or the depleted syllables record is the number of syllables you have depleted. You deplete a syllable when you place the last word that contains that syllable. For example imagine that there is only one word that contains the prompt XL and you place it, you will have depleted the XL syllable.",
        id: "depleted-syllables",
    },
    {
        trigger: "What is the MS or the multi syllables  ?",
        answer: "You gain an MS point when you use a word that contains the prompt more than one time. Imagine that you get the prompt EN and you place the word ENCASEMENT, you will gain one MS point because the word ENCASEMENT contains the prompt EN twice. Same reasonning and same prompt, you will gain 3 MS points if you place the word BENZENEAZOBENZENE.",
        id: "multi-syllables",
    },
    {
        trigger: "What is the flip or lives gained record ?",
        answer: "The flip or lives gained record is the number of lives you have gained. You gain a life when you have placed all the letters on the bottom of your screen when playing BombParty.",
        id: "lives-gained",
    },
    {
        trigger: "What is the PS or previous syllable record ?",
        answer: "The PS or previous syllable record is the number of words you have placed that contains the prompt you had on your previous turn. For example, if you get the prompt ON and had the prompt EN on your previous turn and you placed the word BENEDICTION, you will gain 1 PS point.",
        id: "previous-syllable",
    },
    {
        trigger: "What is the no death record ?",
        answer: `The no death record is the longest streak of words you have placed without dying. When you die, your "current" no death count is reset to 0, while your "maximum" no death count stays the same.`,
        id: "no-death",
    },
    {
        trigger: "Is BirdBot open source ?",
        answer: (
            <span>
                Yes, BirdBot is open source. You can find the source code on{" "}
                <Link target="_blank" className="text-primary-800 font-bold" href={GITHUB_REPO_LINK}>
                    GitHub
                </Link>
                .
            </span>
        ),
        id: "open-source",
    },
    {
        trigger: "Can I have access to the BirdBot word lists ?",
        answer: "No, these lists are private to prevent cheating. However, you can find words using the /c command.",
        id: "word-lists",
    },
    {
        trigger: "How can I support BirdBot ?",
        answer: (
            <span>
                You can: Join our{" "}
                <Link target="_blank" className="text-primary-800 font-bold" href={DISCORD_SERVER_LINK}>
                    Discord server
                </Link>
                , Star the project on{" "}
                <Link target="_blank" className="text-primary-800 font-bold" href={GITHUB_REPO_LINK}>
                    GitHub
                </Link>
                , or Donate on{" "}
                <Link target="_blank" className="text-primary-800 font-bold" href={PAYPAL_DONATE_LINK}>
                    PayPal
                </Link>
                .
            </span>
        ),
        id: "support",
    },
];
export default function FaqPage() {
    const items = questions.map((question) => (
        <AccordionItem value={question.id} className="rounded-xl bg-neutral-50 shadow-sm" key={question.id}>
            <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger asChild>
                    <button className="flex w-full items-center gap-2 border-neutral-100 px-6 py-3 font-semibold [&[data-state=closed]>.openIcon]:hidden [&[data-state=open]]:border-b [&[data-state=open]>.closeIcon]:hidden">
                        <PlusCircleIcon className="closeIcon size-5" />
                        <MinusCircleIcon className="openIcon size-5" />
                        <div>{question.trigger}</div>
                    </button>
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-6 py-3 text-sm text-neutral-900">
                {question.answer}
            </AccordionPrimitive.Content>
        </AccordionItem>
    ));

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
            {items.length ? (
                <Accordion type="single" className="space-y-2" collapsible>
                    {items}
                </Accordion>
            ) : (
                <p className="mt-10 text-center text-sm text-neutral-500">No questions available yet</p>
            )}
        </div>
    );
}
