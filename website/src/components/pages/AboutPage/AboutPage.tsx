import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function AboutPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold">What is BirdBot?</h1>
            <p className="mt-1 text-sm text-neutral-600">
                <QuestionMarkCircleIcon className="mr-0.5 inline size-4 -translate-y-[0.1rem]" />
                JKLM.fun is an web game platform. BombParty is a game on the JKLM platform where players must, turn by turn, place
                a word that contains a given syllable.
            </p>
            <p className="mt-4">
                <strong>BirdBot is an automated player that plays BombParty.</strong>
            </p>
            <p className="mt-4">While it looks like pointless cheating, playing against BirdBot has several advantages.</p>
            <ul className="mt-4 list-disc space-y-2 md:ml-4">
                <li>
                    First of all, playing against BirdBot is a great way to <strong>practice your skills</strong>. BirdBot will
                    never lose, so you can <strong>focus on your own gameplay</strong>.
                </li>
                <li>
                    BirdBot will save all your games, so you can watch your progress and{" "}
                    <strong>keep track of your personal records</strong>.
                </li>
                <li>
                    BirdBot offers multiple tools to <strong>research words</strong>. This can help you achieve better scores in
                    certain record categories.
                </li>
                <li>
                    BirdBot offers <strong>fun and innovative game modes</strong> and record categories to extend the classic
                    BombParty experience.
                </li>
            </ul>
        </div>
    );
}
