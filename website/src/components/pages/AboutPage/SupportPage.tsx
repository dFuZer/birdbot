import { buttonVariants } from "@/components/ui/button";
import { DISCORD_SERVER_LINK, GITHUB_REPO_LINK, PAYPAL_DONATE_LINK } from "@/lib/links";
import { SiDiscord, SiGithub, SiPaypal } from "@icons-pack/react-simple-icons";
import Link from "next/link";

export default function SupportPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold">Support</h1>
            <p className="mt-2 text-sm font-medium">
                First of all, thank you so much for considering ways to support me and the project.
            </p>
            <h2 className="mt-10 text-xl font-semibold">1. Donations</h2>
            <p className="mt-2">
                If you want to support the project financially, you can do so by <strong>donating to the project</strong>. This
                helps me cover the server costs of the project.
            </p>
            <Link target="_blank" href={PAYPAL_DONATE_LINK} className={buttonVariants({ variant: "primary", className: "mt-4" })}>
                <SiPaypal className="fill-white" />
                <span>Donate to BirdBot</span>
            </Link>
            <h2 className="mt-10 text-xl font-semibold">2. Join the Discord server</h2>
            <p className="mt-2">
                A simple thing you can do to support BirdBot is to <strong>join our Discord server</strong>. This gives the
                project more credibility, which may result in more opportunities for me.
            </p>
            <Link
                target="_blank"
                href={DISCORD_SERVER_LINK}
                className={buttonVariants({ variant: "primary", className: "mt-4" })}
            >
                <SiDiscord className="fill-white" />
                <span>Join us on Discord</span>
            </Link>
            <h2 className="mt-10 text-xl font-semibold">3. Star us on GitHub</h2>
            <p className="mt-2">
                To support us you can also <strong>star the repository on GitHub</strong>. Similar to joining the Discord server,
                this gives the project more credibility.
            </p>
            <Link target="_blank" href={GITHUB_REPO_LINK} className={buttonVariants({ variant: "primary", className: "mt-4" })}>
                <SiGithub className="fill-white" />
                <span>Star us on GitHub</span>
            </Link>
        </div>
    );
}
