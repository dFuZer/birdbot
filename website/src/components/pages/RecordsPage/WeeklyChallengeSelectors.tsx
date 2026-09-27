"use client";

import LanguageSelect from "@/components/pages/common/LanguageSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useChangeSearchParam from "@/lib/hooks/useChangeSearchParam";
import { type LanguageEnum } from "@/lib/records";

type WeeklyChallengeSelectorsProps = {
    language: LanguageEnum;
    periodId: string | null;
    weekOptions: { id: string; label: string }[];
};

export default function WeeklyChallengeSelectors({ language, periodId, weekOptions }: WeeklyChallengeSelectorsProps) {
    const changeSearchParam = useChangeSearchParam();

    return (
        <>
            <div>
                <p className="mb-1 text-sm font-medium">Language</p>
                <LanguageSelect language={language} onChangeLanguage={(value) => changeSearchParam({ l: value, page: null })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
                <p className="mb-1 text-sm font-medium">Week</p>
                <Select
                    value={periodId ?? undefined}
                    onValueChange={(value) => changeSearchParam({ cotw: value, page: null })}
                    disabled={weekOptions.length === 0}
                >
                    <SelectTrigger className="w-full bg-white md:w-[20rem]">
                        <SelectValue placeholder="No weeks available" />
                    </SelectTrigger>
                    <SelectContent>
                        {weekOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end md:ml-auto">
                <button
                    type="button"
                    onClick={() => changeSearchParam({ cotw: null, page: null })}
                    className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium hover:bg-neutral-100 md:w-auto"
                >
                    All records
                </button>
            </div>
        </>
    );
}
