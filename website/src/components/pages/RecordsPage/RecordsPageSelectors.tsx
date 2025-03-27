"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    GAME_MODES_DATA,
    LANGUAGES_DATA,
    RECORDS_DATA,
    type LanguageEnum,
    type ModesEnum,
    type RecordsEnum,
} from "@/lib/records";
import { useRouter, useSearchParams } from "next/navigation";

type RecordsPageProps = {
    language: LanguageEnum;
    mode: ModesEnum;
    record: RecordsEnum;
};

export default function RecordsPageSelectors({ language, mode, record }: RecordsPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function onChangeLanguage(value: LanguageEnum) {
        const currentMode = searchParams.get("m") || mode;
        const currentRecord = searchParams.get("r") || record;
        router.push(`/records?l=${value}&m=${currentMode}&r=${currentRecord}`);
    }

    function onChangeMode(value: ModesEnum) {
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
            <div>
                <p className="mb-1 text-sm font-medium">Language</p>
                <Select value={language} onValueChange={onChangeLanguage}>
                    <SelectTrigger className="w-full md:w-[12rem]">
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
            </div>
            <div>
                <p className="mb-1 text-sm font-medium">Mode</p>
                <Select value={mode} onValueChange={onChangeMode}>
                    <SelectTrigger className="w-full md:w-[12rem]">
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
            </div>
            <div>
                <p className="mb-1 text-sm font-medium">Record</p>
                <Select value={record} onValueChange={onChangeRecord}>
                    <SelectTrigger className="w-full md:w-[12rem]">
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
            </div>
        </>
    );
}
