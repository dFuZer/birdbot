export const DISCORD_SERVER_LINK = "https://discord.com/invite/J3yHjv4ZUd";
export const GITHUB_REPO_LINK = "https://github.com/dFuZer/birdbot";
export const PAYPAL_DONATE_LINK = "https://www.paypal.com/paypalme/enzotomassi";

interface ILink {
    href: string;
    label: string;
    children?: ILink[];
    hideHeader?: true;
}

export const ABOUT_LINKS: ILink = {
    href: "/about",
    label: "About",
    children: [
        { href: "/about", label: "About" },
        { href: "/about/faq", label: "FAQ" },
        { href: "/about/commands", label: "Commands" },
        { href: "/about/support", label: "Support us" },
        { href: "/about/history", label: "History" },
    ],
};

export const MAIN_LINKS: ILink[] = [
    { href: "/", label: "Home", hideHeader: true },
    { href: "/play", label: "Play" },
    { href: "/players", label: "Players" },
    { href: "/records", label: "Records" },
    ABOUT_LINKS,
];

export const MONITORING_LINKS: ILink[] = [{ href: "/open-monitoring", label: "Open monitoring" }];

export const HEADER_LINK_GROUPS: ILink[][] = [MAIN_LINKS.filter((link) => !link.hideHeader), MONITORING_LINKS];

export const LINKS: ILink[] = [...MAIN_LINKS, ...MONITORING_LINKS];
