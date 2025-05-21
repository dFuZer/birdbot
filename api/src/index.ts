import app from "./app";
import { ENVIRONMENT } from "./env";
import refreshMaterializedViews from "./helpers/refreshMaterializedViews";
import Logger from "./lib/logger";

const PORT = 4000;

const s1 = performance.now();
refreshMaterializedViews()
    .then(() => {
        const s2 = performance.now();
        Logger.log({ message: `Materialized views refreshed in ${s2 - s1}ms`, path: "index.ts" });
        app.listen({ port: PORT, host: ENVIRONMENT === "development" ? undefined : "0.0.0.0" }, (err, address) => {
            if (err) throw err;
            Logger.log({ message: `API now running on ${address}`, path: "index.ts" });
        });
    })
    .catch((err) => {
        Logger.error({ message: `Error refreshing materialized views`, path: "index.ts", errorType: "unknown", error: err });
        process.exit(1);
    });
