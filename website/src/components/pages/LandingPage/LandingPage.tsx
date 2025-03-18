import { Button } from "@/components/ui/button";
import { katibehFont } from "@/app/fonts";
import LandingBird from "~/public/landingBird.svg";
import DiscordIcon from "~/public/discordIcon.svg";
import LandingInstructionsSection from "./LandingInstructionsSection";
import LandingPageFeaturesSection from "./LandingPageFeaturesSection";
import Link from "next/link";
import { DISCORD_SERVER_LINK } from "@/lib/constants";

export default function LandingPage() {
    return (
        <div className="adaptivePadding">
            <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col-reverse items-center justify-center gap-10 px-10 md:flex-row">
                <div className="relative">
                    <div className="bg-primary-500/80 absolute top-1/2 left-1/2 -z-10 size-60 -translate-x-1/2 -translate-y-1/2 blur-[200px] md:left-10 md:hidden md:translate-x-0"></div>
                    <h1 className={`${katibehFont.className} text-center text-6xl leading-14 md:text-left`}>
                        The Ultimate
                        <br />
                        BombParty Companion
                    </h1>
                    <p className="mt-5 text-center text-neutral-700 md:text-left">
                        Push Your Limits. Set New Records. Master BombParty.
                    </p>
                    <div className="mt-10 flex justify-center gap-3 md:justify-start">
                        <Link href="/play">
                            <Button>Play with BirdBot</Button>
                        </Link>
                        <Link href={DISCORD_SERVER_LINK}>
                            <Button variant="primary-outline">
                                <DiscordIcon className="fill-primary-700" />
                                <span>Join us on Discord</span>
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="relative -z-10 hidden size-[20rem] h-[10rem] md:block">
                    <div className="bg-primary-500 absolute top-1/2 left-1/2 h-40 w-[25rem] -translate-x-1/2 -translate-y-1/2 blur-[180px] lg:left-10 lg:translate-x-0"></div>
                    <LandingBird className="absolute top-1/2 left-1/2 size-[20rem] -translate-x-1/2 -translate-y-1/2 lg:left-10 lg:size-[25rem] lg:translate-x-0" />
                </div>
            </div>
            <LandingPageFeaturesSection />
            <LandingInstructionsSection />
            <div className="mt-30 mb-70 flex flex-col items-center justify-center text-center">
                <h2 className={`${katibehFont.className} text-center text-6xl leading-14`}>Got it. Now let’s play!</h2>
                <p className="mt-5 text-center text-neutral-700">Thank you so much for being awesome and using BirdBot.</p>
                <div className="mt-10 flex gap-3">
                    <Link href="/play">
                        <Button>Play with BirdBot</Button>
                    </Link>
                    <Link href={DISCORD_SERVER_LINK}>
                        <Button variant="primary-outline">
                            <DiscordIcon className="fill-primary-700" />
                            <span>Join us on Discord</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
