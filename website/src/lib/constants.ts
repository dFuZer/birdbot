export const DISCORD_SERVER_LINK = "/";

export const LINKS = [
    { href: "/play", label: "Play" },
    { href: "/players", label: "Players" },
    { href: "/records", label: "Records" },
    {
        href: "/about",
        label: "About",
        children: [
            { href: "/about", label: "About" },
            { href: "/about/faq", label: "FAQ" },
            { href: "/about/commands", label: "Commands" },
            { href: "/about/support", label: "Support us" },
        ],
    },
];
