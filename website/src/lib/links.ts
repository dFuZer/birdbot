import { DISCORD_REDIRECT_URI } from "./env";

export const DISCORD_SERVER_LINK = "https://discord.gg/SqGEM64bCF";
export const GITHUB_REPO_LINK = "https://github.com/dFuZer/birdbot";
export const PAYPAL_DONATE_LINK = "https://www.paypal.com/paypalme/enzotomassi";
export const DISCORD_LOGIN_LINK = `https://discord.com/oauth2/authorize?client_id=380791002958659594&response_type=code&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&scope=identify`;

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

export const LINKS: ILink[] = [
    { href: "/", label: "Home", hideHeader: true },
    { href: "/play", label: "Play" },
    { href: "/players", label: "Players" },
    { href: "/records", label: "Records" },
    ABOUT_LINKS,
];
