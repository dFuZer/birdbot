import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAME_MODES_DATA, ModesEnum } from "@/lib/records";

export default function ModeSelect({ mode, onChangeMode }: { mode: ModesEnum; onChangeMode: (mode: ModesEnum) => void }) {
    return (
        <Select value={mode} onValueChange={onChangeMode}>
            <SelectTrigger className="w-full bg-white md:w-[12rem]">
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
    );
}
