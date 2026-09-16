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
        const result = this.compileDetailed(sources, false);
        return result.ok ? result.regexes : null;
    }

    public static compileDetailed(
        sources: readonly string[],
        truncate = false,
    ):
        | { ok: true; regexes: RegExp[] }
        | { ok: false; reason: "invalid"; source: string }
        | { ok: false; reason: "expensive" } {
        const regexes: RegExp[] = [];
        for (const source of sources) {
            if (!truncate && source.length > this.MAX_SOURCE_LENGTH) {
                return { ok: false, reason: "invalid", source };
            }
            try {
                regexes.push(new RegExp(truncate ? source.slice(0, this.MAX_SOURCE_LENGTH) : source));
            } catch {
                return { ok: false, reason: "invalid", source };
            }
        }
        return this.cost(regexes) >= this.MAX_COST_MS ? { ok: false, reason: "expensive" } : { ok: true, regexes };
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
