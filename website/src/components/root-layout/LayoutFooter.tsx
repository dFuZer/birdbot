import { katibehFont } from "@/app/fonts";
import { ABOUT_LINKS, DISCORD_SERVER_LINK, GITHUB_REPO_LINK, LINKS, PAYPAL_DONATE_LINK } from "@/lib/links";
import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import FooterBlob from "~/public/footerBlob.svg";

export default function LayoutFooter() {
    return (
        <footer className="bg-primary-900 relative mx-2 mb-2 overflow-hidden rounded-xl pt-10 text-neutral-100">
            <FooterBlob className="absolute -top-20 -right-20 z-20 size-50 sm:right-auto sm:-left-20" />
            <FooterBlob className="absolute top-1/2 -right-20 z-20 hidden size-50 -translate-y-1/2 sm:block" />
            <div className="adaptivePadding relative z-30 grid grid-cols-2 gap-5 text-nowrap sm:grid-cols-3">
                <div className="flex justify-center">
                    <div className="w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>BirdBot</h3>
                        <div className="flex flex-col">
                            {LINKS.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="relative order-1 sm:hidden">
                    <FooterBlob className="absolute top-1/2 left-1/2 z-20 size-30 -translate-1/2 rotate-45" />
                </div>
                <div className="order-1 flex justify-center sm:order-none">
                    <div className="w-[12rem] sm:w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>Support us</h3>
                        <div className="flex flex-col">
                            <Link target="_blank" href={GITHUB_REPO_LINK}>
                                Star the project on GitHub
                            </Link>
                            <Link target="_blank" href={DISCORD_SERVER_LINK}>
                                Join our Discord Server
                            </Link>
                            <Link target="_blank" href={PAYPAL_DONATE_LINK}>
                                Donate on PayPal
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="w-[12rem] sm:w-fit">
                        <h3 className={`${katibehFont.className} mb-4 text-4xl`}>Help</h3>
                        <div className="flex flex-col">
                            {ABOUT_LINKS.children!.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <hr className="border-primary-700 z-30 mx-10 my-8 px-20" />
            <div className="relative z-30 mb-8 px-15 text-sm">
                <div className="mb-4 flex items-center gap-1.5">
                    <p>Made with</p>
                    <HeartIcon className="size-5 text-red-500" />
                    <p>by Enzo “dFuZer”</p>
                </div>
                <p>
                    BirdBot and all of its services are licensed under the{" "}
                    <Link
                        target="_blank"
                        className="underline underline-offset-2"
                        href="https://creativecommons.org/licenses/by-nc/4.0/"
                    >
                        Creative Commons CC BY-NC 4.0
                    </Link>
                    . You are free to use, share, and modify the materials for non-commercial purposes only.
                </p>
            </div>
        </footer>
    );
}
