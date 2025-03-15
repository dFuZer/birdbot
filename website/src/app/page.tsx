import { Button } from "@/components/ui/button";
import { katibehFont } from "./font";
import LandingBird from "~/public/landingBird.svg";
import DiscordIcon from "~/public/discordIcon.svg";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

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
                        <Button>Play with BirdBot</Button>
                        <Button variant="primary-outline">
                            <DiscordIcon className="fill-primary-700" />
                            <span>Join us on Discord</span>
                        </Button>
                    </div>
                </div>
                <div className="relative h-[25rem] w-[20rem]">
                    <div className="bg-primary-500 absolute top-1/2 left-10 h-40 w-[25rem] -translate-y-1/2 blur-[180px]"></div>
                    <LandingBird className="absolute top-1/2 left-10 w-[25rem] -translate-y-1/2" />
                </div>
            </div>
            <div className="mt-[8rem]">
                <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>BirdBot's Features</h1>
                <p className="mt-5 text-center text-neutral-700">
                    Whether you want to improve at the game or enhance your
                    <br />
                    BombParty experience, BirdBot has you covered.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-10">
                    {Array.from({ length: 5 }).map((x, i) => {
                        return (
                            <div
                                key={i}
                                className="w-[calc(33.332%-2.5rem)] rounded-xl border border-neutral-100 bg-white/60 p-6 shadow backdrop-blur-md"
                            >
                                <div className="flex items-center justify-center gap-4">
                                    <h3 className="text-center text-xl font-semibold">Feature Name</h3>
                                    <AcademicCapIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />
                                </div>
                                <p className="mt-2 text-center text-sm text-neutral-800">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                    <br />
                                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="mt-[12rem] text-center">
                <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>How it works</h1>
                <p className="mt-5 text-center text-neutral-700">Here how you can get started with BirdBot.</p>
                <div className="mt-10 flex">
                    <div className="w-1/3">
                        <div className="flex h-12 items-center justify-center">
                            <h3 className="text-center text-2xl leading-7 font-semibold">
                                Create a BombParty Room
                                <br />
                                <span className="text-base font-medium text-neutral-700">(Optional)</span>
                            </h3>
                        </div>
                        <div className="blackGradientStart relative mt-10 h-[0.33rem] w-full">
                            <div className="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950"></div>
                            <div className="absolute top-1/2 left-1/2 h-[1.15rem] w-[1.15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                        </div>
                        <div className="mx-10">
                            <p className="mt-10 text-neutral-800">
                                By using /b in a BombParty room where BirdBot is present in the Play tab, it will create a room
                                for you. Note that you must be connected to use the /b command.
                            </p>
                        </div>
                    </div>
                    <div className="w-1/3">
                        <div className="flex h-12 items-center justify-center">
                            <h3 className="text-center text-2xl leading-7 font-semibold">Join the room</h3>
                        </div>
                        <div className="blackGradientEnd relative mt-10 h-[0.33rem] w-full">
                            <div className="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200"></div>
                            <div className="absolute top-1/2 left-1/2 h-[1.15rem] w-[1.15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                        </div>
                        <div className="mx-10">
                            <p className="mt-10 text-neutral-800">
                                Join the room that the bot created for you or that you found in the Play tab
                                <br />
                                <br />
                                <span className="text-sm text-neutral-700">
                                    (While it is possible to use BirdBot without creating your own room, creating one will allow
                                    you to customize it)
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="w-1/3">
                        <div className="flex h-12 items-center justify-center">
                            <h3 className="text-center text-2xl leading-7 font-semibold">
                                Play and Level Up
                                <br />
                                your Gameplay
                            </h3>
                        </div>
                        <div className="relative mt-10 h-[0.33rem] w-full bg-neutral-200">
                            <div className="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200"></div>
                            <div className="absolute top-1/2 left-1/2 h-[1.15rem] w-[1.15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                        </div>
                        <div className="mx-10">
                            <p className="mt-10 text-neutral-800">
                                Once you are in a room with BirdBot, you can play against it, and use its full power and commands.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-[14rem] mb-60 flex flex-col items-center text-center">
                <h1 className={`${katibehFont.className} text-center text-6xl leading-14`}>Got it. Now let’s play!</h1>
                <p className="mt-5 text-center text-neutral-700">Thank you so much for being awesome and using BirdBot.</p>
                <div className="mt-10 flex gap-3">
                    <Button>Play with BirdBot</Button>
                    <Button variant="primary-outline">
                        <DiscordIcon className="fill-primary-700" />
                        <span>Join us on Discord</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
