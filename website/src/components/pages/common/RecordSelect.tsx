import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageEnum, listedRecords, listedRecordsPerLanguage, RECORDS_DATA, RecordsEnum } from "@/lib/records";

export default function RecordSelect({
    record,
    language,
    onChangeRecord,
}: {
    record: RecordsEnum;
    language: LanguageEnum;
    onChangeRecord: (record: RecordsEnum) => void;
}) {
    return (
        <Select value={record} onValueChange={onChangeRecord}>
            <SelectTrigger className="w-full bg-white md:w-[12rem]">
                <SelectValue placeholder="Select record" />
            </SelectTrigger>
            <SelectContent className="max-h-[20rem] overflow-y-auto">
                {Object.entries(RECORDS_DATA)
                    .filter((entry) => {
                        return !(
                            listedRecords.includes(entry[0] as any) &&
                            !listedRecordsPerLanguage[language].includes(entry[0] as any)
                        );
                    })
                    .map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value.displayName}
                        </SelectItem>
                    ))}
            </SelectContent>
        </Select>
    );
}
