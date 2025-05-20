"use client";

import LanguageSelect from "@/components/pages/common/LanguageSelect";
import ModeSelect from "@/components/pages/common/ModeSelect";
import RecordSelect from "@/components/pages/common/RecordSelect";
import useChangeSearchParam from "@/lib/hooks/useChangeSearchParam";
import { type LanguageEnum, type ModesEnum, type RecordsEnum } from "@/lib/records";

type RecordsPageProps = {
    language: LanguageEnum;
    mode: ModesEnum;
    record: RecordsEnum;
};

export default function RecordsPageSelectors({ language, mode, record }: RecordsPageProps) {
    const changeSearchParam = useChangeSearchParam();

    return (
        <>
            <div>
                <p className="mb-1 text-sm font-medium">Language</p>
                <LanguageSelect language={language} onChangeLanguage={(value) => changeSearchParam({ l: value, page: null })} />
            </div>
            <div>
                <p className="mb-1 text-sm font-medium">Mode</p>
                <ModeSelect mode={mode} onChangeMode={(value) => changeSearchParam({ m: value, page: null })} />
            </div>
            <div>
                <p className="mb-1 text-sm font-medium">Record</p>
                <RecordSelect record={record} onChangeRecord={(value) => changeSearchParam({ r: value, page: null })} />
            </div>
        </>
    );
}
