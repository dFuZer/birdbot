import { DISCORD_SERVER_LINK } from "@/lib/links";
import Link from "next/link";

export default function HistoryPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="mt-4">
                Hi, my name is <strong>Enzo</strong>. I am the creator of BirdBot. I started working on BirdBot in{" "}
                <strong>2018</strong> as a side-project. I liked the game and wanted to create something around it.
            </p>
            <p className="mt-4">
                BirdBot is what started my interested in web development, and I now work full-time as a software engineer.
            </p>
            <p className="mt-4">As I gained more experience, I rewrote the bot and its website several times.</p>
            <p className="mt-4">
                The website you are watching is the third iteration of the BirdBot website, made in <strong>2025</strong>.
            </p>
            <p className="mt-4">
                I hope you enjoy using BirdBot as much as I enjoyed creating it.
                <br />
                If you have any feedback, you can contact me through the official{" "}
                <Link className="text-primary-800 font-semibold underline underline-offset-2" href={DISCORD_SERVER_LINK}>
                    Discord server
                </Link>
                .
            </p>
            <p className="mt-4">
                Whether you use BirdBot or landed on this page by accident, I hope you enjoy my work and{" "}
                <strong>I wish you an amazing life!</strong>
            </p>
        </div>
    );
}
