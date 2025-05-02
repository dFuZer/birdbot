import Fastify from "fastify";
import { authMiddleware } from "./middleware/auth";
import { addGameRouteHandler } from "./routes/addGame.route";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";
import { getBestScoresForCategoryRouteHandler } from "./routes/getBestScoresForCategory.route";
import { getDiscordUserIdRouteHandler } from "./routes/getDiscordUserId.route";
import { getPlayerRecordsRouteHandler } from "./routes/getPlayerRecords.route";
import { healthRouteHandler } from "./routes/health.route";

const app = Fastify();

// -- API Routes --

// PUT
app.put("/word", { preHandler: authMiddleware }, addWordRouteHandler);
app.put("/players", { preHandler: authMiddleware }, addPlayersRouteHandler);
app.put("/game", { preHandler: authMiddleware }, addGameRouteHandler);
app.put("/game-recap", { preHandler: authMiddleware }, addGameRecapRouteHandler);

// POST
app.post("/auth-code", { preHandler: authMiddleware }, getDiscordUserIdRouteHandler);

// GET
app.get("/records", { preHandler: authMiddleware }, getBestScoresForCategoryRouteHandler);
app.get("/health", healthRouteHandler);
app.get("/player-records", { preHandler: authMiddleware }, getPlayerRecordsRouteHandler);

export default app;
