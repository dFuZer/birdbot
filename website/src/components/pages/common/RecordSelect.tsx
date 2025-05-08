import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RECORDS_DATA, RecordsEnum } from "@/lib/records";

export default function RecordSelect({
    record,
    onChangeRecord,
}: {
    record: RecordsEnum;
    onChangeRecord: (record: RecordsEnum) => void;
}) {
    return (
        <Select value={record} onValueChange={onChangeRecord}>
            <SelectTrigger className="w-full bg-white md:w-[12rem]">
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
    );
}
