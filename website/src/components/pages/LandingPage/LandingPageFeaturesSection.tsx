import { AcademicCapIcon, CpuChipIcon, MagnifyingGlassIcon, TrophyIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { katibehFont } from "@/app/fonts";

type FeatureCardProps = {
    TitleElement: React.ReactNode;
    DescriptionElement: React.ReactNode;
    IconElement: React.ReactNode;
};

function FeatureCard({ TitleElement, DescriptionElement, IconElement }: FeatureCardProps) {
    return (
        <div className="flex w-full flex-col items-center justify-center rounded-xl border border-neutral-100 bg-white/60 p-6 shadow backdrop-blur-md md:w-[calc(50%-2.5rem)] xl:w-[calc(33.332%-2.5rem)]">
            {IconElement}
            <div className="mt-2 flex items-center justify-center gap-4">
                <h3 className="text-center text-xl font-semibold">{TitleElement}</h3>
            </div>
            <p className="mt-4 text-center text-sm text-neutral-800">{DescriptionElement}</p>
        </div>
    );
}

const featuresList: FeatureCardProps[] = [
    {
        TitleElement: "Track and Beat Records",
        DescriptionElement: "BirdBot has more than 10 records in 4 game modes that you can try to beat.",
        IconElement: <TrophyIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />,
    },
    {
        TitleElement: "Training Mode",
        DescriptionElement: "BirdBot gives live feedback and suggests words to optimize your gameplay.",
        IconElement: <AcademicCapIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />,
    },
    {
        TitleElement: "Advanced Word Search",
        DescriptionElement: "Instantly find words with specific syllables and optimized for certain records.",
        IconElement: <MagnifyingGlassIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />,
    },
    {
        TitleElement: "An Unbeatable Opponent",
        DescriptionElement: "Play endlessly without interruptions. Keep pushing your limits.",
        IconElement: <CpuChipIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />,
    },
    {
        TitleElement: "Strong Community",
        DescriptionElement:
            "Since 2021, we’ve had 20,000 unique players and 2,000 discord members. (Rebuilding our community – be part of it!)",
        IconElement: <UserGroupIcon className="h-8 w-8 stroke-[1.5px] text-neutral-950" />,
    },
];

export default function LandingPageFeaturesSection() {
    return (
        <div className="adaptivePadding">
            <h2 className={`${katibehFont.className} text-center text-6xl leading-14`}>BirdBot's Features</h2>
            <p className="mt-5 text-center text-neutral-700">
                Whether you want to improve at the game or enhance your
                <br />
                BombParty experience, BirdBot has you covered.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 px-3 md:gap-10">
                {featuresList.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                ))}
            </div>
        </div>
    );
}
