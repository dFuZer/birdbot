import app from "./app";
import { ENVIRONMENT } from "./env";
import Logger from "./lib/logger";

const PORT = 4000;

app.listen({ port: PORT, host: ENVIRONMENT === "development" ? undefined : "0.0.0.0" }, (err, address) => {
    if (err) throw err;
    Logger.log({ message: `API now running on ${address}`, path: "index.ts" });
});
