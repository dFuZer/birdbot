import Fastify from "fastify";
import Logger from "./lib/logger";
import { authMiddleware } from "./middleware/auth";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";
import { getBestScoresForCategoryRouteHandler } from "./routes/getBestScoresForCategory.route";
import { healthRouteHandler } from "./routes/health.route";

const app = Fastify();
const PORT = 4000;

// -- API Routes --

// POST
app.post("/add-word", { preHandler: authMiddleware }, addWordRouteHandler);
app.post("/add-player", { preHandler: authMiddleware }, addPlayersRouteHandler);
app.post("/add-game-recap", { preHandler: authMiddleware }, addGameRecapRouteHandler);

// GET
app.get("/get-records", { preHandler: authMiddleware }, getBestScoresForCategoryRouteHandler);
app.get("/health", healthRouteHandler);

// Start the API
app.listen({ port: PORT, host: process.env.ENVIRONMENT === "development" ? undefined : "0.0.0.0" }, (err, address) => {
    if (err) throw err;
    Logger.log({ message: `API now running on ${address}`, path: "index.ts" });
});
