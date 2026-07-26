import { performance } from "perf_hooks";

export default class BirdBotRegexService {
    public static readonly MAX_COST_MS = 1.5;
    public static readonly MAX_SOURCE_LENGTH = 30;
    private static readonly samples = [
        "antidisestablishmentarianisms",
        "anticonstitutionnellement",
        "counterimmunoelectrophoresis",
        "call-with-current-continuation",
        "dichlorodiphenyltrichloroethane",
        "desinstitutionnaliseraient",
        "arbeitslosenversicherungen",
        "contrarrevolucionariamente",
    ];

    public static compile(sources: readonly string[]): RegExp[] | null {
        const regexes: RegExp[] = [];
        try {
            for (const source of sources) {
                if (source.length > this.MAX_SOURCE_LENGTH) return null;
                regexes.push(new RegExp(source));
            }
        } catch {
            return null;
        }
        return this.cost(regexes) < this.MAX_COST_MS ? regexes : null;
    }

    public static cost(regexes: readonly RegExp[]): number {
        const started = performance.now();
        for (const regex of regexes) {
            for (const sample of this.samples) {
                regex.lastIndex = 0;
                regex.test(sample);
            }
        }
        return performance.now() - started;
    }
}
