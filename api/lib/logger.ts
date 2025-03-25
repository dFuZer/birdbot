import type { ZodError } from "zod";

type Log = {
    message: string;
    path: string;
};

type ErrorLog = Log & ErrorFields;
type ErrorFields =
    | {
          errorType: "unknown";
          error: unknown;
      }
    | {
          errorType: "zod";
          error: ZodError;
      };

type LogType = "log" | "error" | "warn";

type TypedLog = {
    type: LogType;
    log: Log | ErrorLog;
};

export default class Logger {
    static readonly LOG_COLOR = "\x1b[32m";
    static readonly ERROR_COLOR = "\x1b[31m";
    static readonly WARN_COLOR = "\x1b[33m";

    static readonly LOG_TEXT = "[🔎]:";
    static readonly ERROR_TEXT = "[❌]:";
    static readonly WARN_TEXT = "[⚠️]:";

    public static log(log: Log) {
        Logger.displayLog({ type: "log", log });
    }

    public static error(log: ErrorLog) {
        Logger.displayLog({ type: "error", log });
    }

    public static warn(log: Log) {
        Logger.displayLog({ type: "warn", log });
    }

    static displayLog(log: TypedLog) {
        const { type, log: logData } = log;
        const color = type === "log" ? Logger.LOG_COLOR : type === "error" ? Logger.ERROR_COLOR : Logger.WARN_COLOR;
        const text = type === "log" ? Logger.LOG_TEXT : type === "error" ? Logger.ERROR_TEXT : Logger.WARN_TEXT;
        console.info(`${color}${text} ${logData.message}\x1b[0m`);

        if (type === "error" && "error" in logData) {
            if (logData.errorType === "zod") {
                console.error(logData.error.errors.map((error) => `(${error.code}: ${error.fatal ? "fatal" : "non-fatal"}) (${error.path.join(".")}): ${error.message}`).join(", "));
            } else {
                console.error(logData.error);
            }
        }
    }
}
