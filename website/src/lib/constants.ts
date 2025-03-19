export const DISCORD_SERVER_LINK = "/";

type ILink = {
    href: string;
    label: string;
    children?: ILink[];
    hideHeader?: true;
};

export const ABOUT_LINKS: ILink = {
    href: "/about",
    label: "About",
    children: [
        { href: "/about", label: "About" },
        { href: "/about/faq", label: "FAQ" },
        { href: "/about/commands", label: "Commands" },
        { href: "/about/support", label: "Support us" },
    ],
};

export const LINKS: ILink[] = [
    { href: "/", label: "Home", hideHeader: true },
    { href: "/play", label: "Play" },
    { href: "/players", label: "Players" },
    { href: "/records", label: "Records" },
    ABOUT_LINKS,
];
