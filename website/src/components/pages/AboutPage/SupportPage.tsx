import { buttonVariants } from "@/components/ui/button";
import { DISCORD_SERVER_LINK } from "@/constants";
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
                If you want to support the project financially, you can do so by <strong>donating to the project</strong>.
            </p>
            <p className="mt-1 text-xs text-neutral-600">This helps me cover the server costs of the project.</p>
            <Link href={DISCORD_SERVER_LINK} className={buttonVariants({ variant: "primary", className: "mt-4" })}>
                <SiPaypal className="fill-white" />
                <span>Donate to BirdBot</span>
            </Link>
            <h2 className="mt-10 text-xl font-semibold">2. Join the Discord server</h2>
            <p className="mt-2">
                A simple thing you can do to support BirdBot is to <strong>join our Discord server</strong>.
            </p>
            <p className="mt-1 text-xs text-neutral-600">
                This gives the project more credibility, which may result in more opportunities for me.
            </p>
            <Link href={DISCORD_SERVER_LINK} className={buttonVariants({ variant: "primary", className: "mt-4" })}>
                <SiDiscord className="fill-white" />
                <span>Join us on Discord</span>
            </Link>
            <h2 className="mt-10 text-xl font-semibold">3. Star us on GitHub</h2>
            <p className="mt-2">
                If you like BirdBot, you can <strong>star the repository on GitHub</strong>.
            </p>
            <p className="mt-1 text-xs text-neutral-600">
                Similar to joining the Discord server, this gives the project more credibility.
            </p>
            <Link href={""} className={buttonVariants({ variant: "primary", className: "mt-4" })}>
                <SiGithub className="fill-white" />
                <span>Star us on GitHub</span>
            </Link>
        </div>
    );
}
