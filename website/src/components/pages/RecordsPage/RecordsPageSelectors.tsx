"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAME_MODES_DATA, GameModesEnum, LANGUAGES_DATA, LanguagesEnum, RECORDS_DATA, RecordsEnum } from "@/lib/records";
import { useRouter, useSearchParams } from "next/navigation";

type RecordsPageProps = {
    language: LanguagesEnum;
    mode: GameModesEnum;
    record: RecordsEnum;
};

export default function RecordsPageSelectors({ language, mode, record }: RecordsPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function onChangeLanguage(value: LanguagesEnum) {
        const currentMode = searchParams.get("m") || mode;
        const currentRecord = searchParams.get("r") || record;
        router.push(`/records?l=${value}&m=${currentMode}&r=${currentRecord}`);
    }

    function onChangeMode(value: GameModesEnum) {
        const currentLanguage = searchParams.get("l") || language;
        const currentRecord = searchParams.get("r") || record;
        router.push(`/records?l=${currentLanguage}&m=${value}&r=${currentRecord}`);
    }

    function onChangeRecord(value: RecordsEnum) {
        const currentLanguage = searchParams.get("l") || language;
        const currentMode = searchParams.get("m") || mode;
        router.push(`/records?l=${currentLanguage}&m=${currentMode}&r=${value}`);
    }

    return (
        <>
            <Select value={language} onValueChange={onChangeLanguage}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(LANGUAGES_DATA).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value.displayName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={mode} onValueChange={onChangeMode}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(GAME_MODES_DATA).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value.displayName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={record} onValueChange={onChangeRecord}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select record" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(RECORDS_DATA).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value.displayName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
