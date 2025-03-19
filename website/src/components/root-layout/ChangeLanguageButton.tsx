import FrenchFlag from "~/public/frenchFlag.svg";
import { Button } from "@/components/ui/button";
export default function ChangeLanguageButton() {
    return (
        <Button
            variant={"outline"}
            className="flex h-7 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3"
        >
            <span className="text-sm font-bold">FR</span>
            <FrenchFlag className="h-4 w-4" />
        </Button>
    );
}
