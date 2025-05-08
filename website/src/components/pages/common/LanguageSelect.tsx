import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageEnum, LANGUAGES_DATA } from "@/lib/records";

export default function LanguageSelect({
    language,
    onChangeLanguage,
}: {
    language: LanguageEnum;
    onChangeLanguage: (language: LanguageEnum) => void;
}) {
    return (
        <Select value={language} onValueChange={onChangeLanguage}>
            <SelectTrigger className="w-full bg-white md:w-[12rem]">
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
    );
}
