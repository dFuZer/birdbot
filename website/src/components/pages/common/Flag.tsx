import { LanguageEnum } from "@/lib/records";
import { SVGProps } from "react";
import BrazilianFlag from "~/public/brazilian-flag.svg";
import EnglishFlag from "~/public/english-flag.svg";
import FrenchFlag from "~/public/french-flag.svg";
import GermanFlag from "~/public/german-flag.svg";
import ItalianFlag from "~/public/italian-flag.svg";
import SpanishFlag from "~/public/spanish-flag.svg";

export default function Flag({ language, ...props }: { language: LanguageEnum | "UNKNOWN" } & SVGProps<SVGSVGElement>) {
    switch (language) {
        case "en":
            return <EnglishFlag {...props} />;
        case "fr":
            return <FrenchFlag {...props} />;
        case "de":
            return <GermanFlag {...props} />;
        case "it":
            return <ItalianFlag {...props} />;
        case "es":
            return <SpanishFlag {...props} />;
        case "brpt":
            return <BrazilianFlag {...props} />;
        default:
            return undefined;
    }
}
