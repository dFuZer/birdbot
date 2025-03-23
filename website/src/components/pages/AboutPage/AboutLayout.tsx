import {
    BookOpenIcon,
    ChatBubbleLeftIcon,
    CodeBracketIcon,
    HeartIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AboutLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="flex max-w-4xl flex-1 gap-4 rounded-xl bg-white/70 p-4 pb-6 shadow-xl">
                <div className="h-full w-[15rem] rounded-xl bg-neutral-50 p-4">
                    <h2 className="text-base font-semibold">About</h2>
                    <p className="text-sm text-neutral-600">Here you can learn all there is to know about BirdBot.</p>
                    <nav className="mt-4 flex flex-col gap-1 font-semibold">
                        <Link className="flex items-center gap-2" href="/about">
                            <span className="flex w-6 justify-center">
                                <QuestionMarkCircleIcon className="size-5 stroke-2" />
                            </span>
                            <span>What is BirdBot?</span>
                        </Link>
                        <Link className="flex items-center gap-2" href="/about/faq">
                            <span className="flex w-6 justify-center">
                                <ChatBubbleLeftIcon className="size-5 stroke-2" />
                            </span>
                            <span>FAQ</span>
                        </Link>
                        <Link className="flex items-center gap-2" href="/about/commands">
                            <span className="flex w-6 justify-center">
                                <CodeBracketIcon className="size-5 stroke-2" />
                            </span>
                            <span>Commands</span>
                        </Link>
                        <Link className="flex items-center gap-2" href="/about/history">
                            <span className="flex w-6 justify-center">
                                <BookOpenIcon className="size-5 stroke-2" />
                            </span>
                            <span>History</span>
                        </Link>
                        <Link className="flex items-center gap-2" href="/about/support">
                            <span className="flex w-6 justify-center">
                                <HeartIcon className="size-5 stroke-2 text-red-500" />
                            </span>
                            <span className="">Support us</span>
                        </Link>
                    </nav>
                </div>
                <div className="flex-1 p-4">{children}</div>
            </div>
        </div>
    );
}
