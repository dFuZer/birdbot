import Fastify from "fastify";
import { authMiddleware } from "./middleware/auth";
import { addGameRouteHandler } from "./routes/addGame.route";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";
import { getBestScoresForCategoryRouteHandler } from "./routes/getBestScoresForCategory.route";
import { getDiscordUserIdRouteHandler } from "./routes/getDiscordUserId.route";
import { healthRouteHandler } from "./routes/health.route";

const app = Fastify();

// -- API Routes --

// POST
app.post("/add-word", { preHandler: authMiddleware }, addWordRouteHandler);
app.post("/add-player", { preHandler: authMiddleware }, addPlayersRouteHandler);
app.post("/add-game", { preHandler: authMiddleware }, addGameRouteHandler);
app.post("/add-game-recap", { preHandler: authMiddleware }, addGameRecapRouteHandler);
app.post("/get-session-cookie-discord", { preHandler: authMiddleware }, getDiscordUserIdRouteHandler);

// GET
app.get("/get-records", { preHandler: authMiddleware }, getBestScoresForCategoryRouteHandler);
app.get("/health", healthRouteHandler);

export default app;
