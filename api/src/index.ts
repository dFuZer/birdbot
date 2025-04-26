import cron from "node-cron";
import app from "./app";
import { ENVIRONMENT } from "./env";
import refreshMaterializedViews from "./helpers/refreshMaterializedViews";
import Logger from "./lib/logger";

const PORT = 4000;

// Start the API after refreshing the materialized views
refreshMaterializedViews().then(() => {
    app.listen({ port: PORT, host: ENVIRONMENT === "development" ? undefined : "0.0.0.0" }, (err, address) => {
        if (err) throw err;
        Logger.log({ message: `API now running on ${address}`, path: "index.ts" });
    });
    cron.schedule("*/10 * * * *", refreshMaterializedViews);
});
