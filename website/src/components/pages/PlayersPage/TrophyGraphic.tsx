import { cn } from "@/lib/utils";

export function getTrophyGraphicByRank(rank: number, props?: React.SVGProps<SVGSVGElement>) {
    if (rank === 1) {
        return <GoldenTrophyGraphic {...props} />;
    } else if (rank === 2) {
        return <SilverTrophyGraphic {...props} />;
    } else if (rank === 3) {
        return <BronzeTrophyGraphic {...props} />;
    } else {
        return (
            <TrophyGraphic
                {...props}
                basecolorrgb="#D6D6D6"
                startcolorrgb="#A7A7A7"
                className="size-12 min-h-max min-w-max md:size-8 lg:size-12"
            />
        );
    }
}

export function GoldenTrophyGraphic(props: React.SVGProps<SVGSVGElement>) {
    return (
        <TrophyGraphic
            {...props}
            basecolorrgb="#FFC54D"
            startcolorrgb="#EDB248"
            className="size-12 min-h-max min-w-max md:size-8 lg:size-12"
        />
    );
}

export function SilverTrophyGraphic(props: React.SVGProps<SVGSVGElement>) {
    return (
        <TrophyGraphic
            {...props}
            basecolorrgb="#D6D6D6"
            startcolorrgb="#A7A7A7"
            className="size-12 min-h-max min-w-max md:size-8 lg:size-12"
        />
    );
}

export function BronzeTrophyGraphic(props: React.SVGProps<SVGSVGElement>) {
    return (
        <TrophyGraphic
            {...props}
            basecolorrgb="#D79B20"
            startcolorrgb="#9C6C15"
            className="size-12 min-h-max min-w-max md:size-8 lg:size-12"
        />
    );
}

export default function TrophyGraphic(props: React.SVGProps<SVGSVGElement> & { startcolorrgb: string; basecolorrgb: string }) {
    return (
        <svg
            {...props}
            className={cn("size-17", props.className)}
            viewBox="0 0 60 53"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M44.9802 27.0108C49.3862 26.3723 52.8983 24.6482 55.3886 21.7747C60.3694 15.9639 59.4754 7.85422 59.4754 7.47108L59.3477 6.38554H50.1525C50.0886 4.21446 49.8971 2.04337 49.5139 0H9.98744C9.66816 2.04337 9.4766 4.21446 9.34889 6.38554H0.217561L0.0898504 7.47108C0.025995 7.79036 -0.804126 15.9639 4.1766 21.7747C6.66696 24.6482 10.179 26.3723 14.585 27.0108C17.7778 32.6301 21.9284 36.9084 25.3766 39.0795V44.3795H14.8405C13.3079 44.3795 12.0947 45.5928 12.0947 47.1253V53H47.5983V47.1253C47.5983 45.5928 46.385 44.3795 44.8525 44.3795H34.1886V39.1434C37.6368 36.9084 41.7874 32.6301 44.9802 27.0108ZM53.473 20.1783C51.7489 22.1578 49.3862 23.4988 46.4489 24.2012C48.62 19.6675 50.0886 14.4313 50.2164 8.87591H57.0489C57.1127 11.1747 56.7935 16.347 53.473 20.1783ZM6.09226 20.1783C2.83563 16.347 2.51636 11.1747 2.51636 8.93976H9.34889C9.4766 14.4952 10.9453 19.7313 13.1164 24.2651C10.179 23.4988 7.81636 22.1578 6.09226 20.1783Z"
                fill={props.basecolorrgb}
            />
            <path
                d="M30.1017 10.2807L31.9535 13.9844C32.0174 14.1121 32.0812 14.1759 32.2728 14.1759L36.3595 14.7506C36.6788 14.8145 36.7427 15.1338 36.5511 15.3892L33.5499 18.1988C33.4222 18.3265 33.4222 18.3904 33.4222 18.5181L34.1246 22.6048C34.1884 22.9241 33.8692 23.1157 33.6137 22.988L29.974 21.0723C29.8463 21.0085 29.7186 21.0085 29.6547 21.0723L26.0149 22.988C25.7595 23.1157 25.4402 22.8603 25.5041 22.6048L26.2065 18.5181C26.2065 18.3904 26.2065 18.2627 26.0788 18.1988L23.1414 15.3253C22.9499 15.1338 23.0137 14.7506 23.333 14.6868L27.4198 14.1121C27.5475 14.1121 27.6113 13.9844 27.739 13.9205L29.5908 10.2169C29.5908 9.96147 29.974 9.96147 30.1017 10.2807Z"
                fill={props.startcolorrgb}
            />
            <path d="M3.66577 41.7614L6.41155 38.3771L9.15734 41.7614V6.38554H3.66577V41.7614Z" fill="#04C8B4" />
            <path d="M50.408 6.38554V41.7614L53.1537 38.3771L55.8995 41.7614V6.38554H50.408Z" fill="#04C8B4" />
        </svg>
    );
}
