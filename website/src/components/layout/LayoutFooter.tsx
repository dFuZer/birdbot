import { katibehFont } from "@/app/font";
import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
export default function LayoutFooter() {
    return (
        <footer className="bg-primary-900 mx-2 mb-2 rounded-xl pt-10 text-neutral-100">
            <div className="grid grid-cols-3 px-20">
                <div className="flex justify-center">
                    <div className="w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>BirdBot</h3>
                        <div className="flex flex-col">
                            <Link href="/">Play</Link>
                            <Link href="/">Players</Link>
                            <Link href="/">Records</Link>
                            <Link href="/">About</Link>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>Support us</h3>
                        <div className="flex flex-col">
                            <Link href="/">Join our Discord Server</Link>
                            <Link href="/">Support us on PayPal</Link>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>Help</h3>
                        <div className="flex flex-col">
                            <Link href="/">About</Link>
                            <Link href="/">FAQ</Link>
                            <Link href="/">Commands</Link>
                            <Link href="/">Support us</Link>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="border-primary-700 mx-10 my-8" />
            <div className="mb-8 px-20">
                <div className="mb-4 flex items-center gap-1.5">
                    <p>Made with</p>
                    <HeartIcon className="h-5 w-5 text-red-500" />
                    <p>by Enzo “dFuZer”</p>
                </div>
                <p>
                    BirdBot and all of its services are licensed under the Creative Commons CC BY-NC 4.0. You are free to use,
                    share, and modify the materials for non-commercial purposes only. See the full license details here.
                </p>
            </div>
        </footer>
    );
}
