import { BookOpenIcon, ChatBubbleLeftIcon, CodeBracketIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import AboutPageMobileNavLinks from "./AboutPageMobileNavLinks";

type Link = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

export const ABOUT_PAGE_LINKS: Link[] = [
    {
        href: "/about",
        label: "What is BirdBot?",
        icon: <QuestionMarkCircleIcon className="size-5 min-h-max min-w-max stroke-2" />,
    },
    {
        href: "/about/faq",
        label: "FAQ",
        icon: <ChatBubbleLeftIcon className="size-5 min-h-max min-w-max stroke-2" />,
    },
    {
        href: "/about/commands",
        label: "Commands",
        icon: <CodeBracketIcon className="size-5 min-h-max min-w-max stroke-2" />,
    },
    {
        href: "/about/history",
        label: "History",
        icon: <BookOpenIcon className="size-5 min-h-max min-w-max stroke-2" />,
    },
    {
        href: "/about/support",
        label: "Support us",
        icon: <HeartIcon className="size-5 min-h-max min-w-max stroke-2 text-red-500" />,
    },
];

export default function AboutLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen justify-center px-4 py-10">
            <div className="flex max-w-4xl flex-1 gap-4 rounded-xl bg-white/70 p-4 pb-6 shadow-xl">
                <div className="hidden h-full w-[15rem] rounded-xl bg-neutral-50 p-4 md:block">
                    <h2 className="text-base font-semibold">About</h2>
                    <p className="text-sm text-neutral-600">Here you can learn all there is to know about BirdBot.</p>
                    <nav className="mt-4 flex flex-col gap-1 font-semibold">
                        {ABOUT_PAGE_LINKS.map((link) => (
                            <Link className="flex items-center gap-2" href={link.href} key={link.href}>
                                {link.icon}
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <nav className="mb-4 grid grid-cols-1 gap-2 rounded-md bg-neutral-50 p-2 font-semibold sm:grid-cols-2 md:hidden">
                        <AboutPageMobileNavLinks />
                    </nav>
                    {children}
                </div>
            </div>
        </div>
    );
}
