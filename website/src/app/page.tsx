import { Button } from "@/components/ui/button";
import { katibehFont } from "./font";
import LandingBird from "~/public/landingBird.svg";
import DiscordIcon from "~/public/discordIcon.svg";

export default function Home() {
    return (
        <div className="mx-20 mt-10">
            <div className="flex w-full items-center justify-center gap-10">
                <div>
                    <h1 className={`${katibehFont.className} text-6xl leading-14`}>
                        The Ultimate
                        <br />
                        BombParty Companion
                    </h1>
                    <p className="mt-5 text-neutral-700">Push Your Limits. Set New Records. Master BombParty.</p>
                    <div className="mt-10 flex gap-3">
                        <Button>
                            <DiscordIcon />
                            <span>Join us on Discord</span>
                        </Button>
                        <Button variant="primary-outline">Play with BirdBot</Button>
                    </div>
                </div>
                <div className="relative h-[25rem] w-[20rem]">
                    <div className="bg-primary-500 absolute top-1/2 left-1/2 h-40 w-[24rem] -translate-1/2 blur-[180px]"></div>
                    <LandingBird className="absolute top-0 left-0 w-[25rem]" />
                </div>
            </div>
            <div className="mt-40">
                <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>BirdBot's Features</h1>
                <p className="mt-5 text-center text-neutral-700">
                    Whether you want to improve at the game or enhance your
                    <br />
                    BombParty experience, BirdBot has you covered.
                </p>
                <div className="mt-10 flex flex-wrap">{}</div>
            </div>
        </div>
    );
}
