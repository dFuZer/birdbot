"use client";

import useChangeSearchParam from "@/components/hooks/useChangeSearchParam";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { LanguageEnum, LANGUAGES_DATA } from "@/lib/records";
import { Trigger } from "@radix-ui/react-select";
import FrenchFlag from "~/public/frenchFlag.svg";

export default function PlayerProfilePageLanguageSelector({
    language,
    ppPerLanguage,
}: {
    language: LanguageEnum;
    ppPerLanguage: Record<LanguageEnum, number>;
}) {
    const changeSearchParam = useChangeSearchParam({ scroll: false });

    return (
        <Select value={language} onValueChange={(value) => changeSearchParam("l", value)}>
            <Trigger asChild>
                <button className="flex w-fit items-center rounded-full border border-neutral-300 bg-white px-3">
                    <FrenchFlag className="my-1 h-4 w-4" />
                    <span className="ml-2 text-sm font-bold">{LANGUAGES_DATA[language].shortDisplayName}</span>
                    {ppPerLanguage[language] && (
                        <>
                            <div className="mx-2 h-full w-[1px] bg-neutral-300" />
                            <span className="text-sm font-bold">{ppPerLanguage[language]} pp</span>
                        </>
                    )}
                </button>
            </Trigger>
            <SelectContent>
                {Object.keys(ppPerLanguage).map((key) => (
                    <SelectItem key={key} value={key}>
                        {LANGUAGES_DATA[key as LanguageEnum].displayName}
                        {ppPerLanguage[key as LanguageEnum] ? ` - ${ppPerLanguage[key as LanguageEnum]} pp` : ""}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
