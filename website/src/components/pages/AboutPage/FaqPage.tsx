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
