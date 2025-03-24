import { cn } from "@/lib/tailwindUtils";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

type TPlaceHolderType = "user";

export default function OptionalImage({
    src,
    commonClasses,
    height,
    width,
    imageClasses,
    placeholderClasses,
    placeholderType = "user",
}: {
    src: string | undefined;
    commonClasses?: string;
    imageClasses?: string;
    placeholderClasses?: string;
    height: number;
    width: number;
    placeholderType?: TPlaceHolderType;
}) {
    if (src)
        return (
            <Image
                height={height}
                width={width}
                src={src}
                alt="avatar"
                className={cn("h-10 w-10 rounded-md", commonClasses, imageClasses)}
            />
        );

    if (placeholderType === "user")
        return (
            <UserCircleIcon
                className={cn("h-10 w-10 rounded-md bg-neutral-100 text-neutral-500", commonClasses, placeholderClasses)}
            />
        );

    return <div className={cn("bg-primary-500 h-10 w-10 rounded-md", commonClasses, placeholderClasses)}></div>;
}
