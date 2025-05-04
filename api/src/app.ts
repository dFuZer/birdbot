import Fastify from "fastify";
import { authMiddleware } from "./middleware/auth";
import { addGameRouteHandler } from "./routes/addGame.route";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";
import { getBestScoresForCategoryRouteHandler } from "./routes/getBestScoresForCategory.route";
import { getDiscordUserIdRouteHandler } from "./routes/getDiscordUserId.route";
import { getPlayerProfileRouteHandler } from "./routes/getPlayerProfile.route";
import { healthRouteHandler } from "./routes/health.route";

const app = Fastify();

// -- API Routes --

// --- PUT ---
// Insert a word
app.put("/word", { preHandler: authMiddleware }, addWordRouteHandler);
// Insert a player
app.put("/players", { preHandler: authMiddleware }, addPlayersRouteHandler);
// Insert a game
app.put("/game", { preHandler: authMiddleware }, addGameRouteHandler);
// Insert a game recap
app.put("/game-recap", { preHandler: authMiddleware }, addGameRecapRouteHandler);

// --- POST ---

// Handle Discord OAuth token transfer
app.post("/auth-code", { preHandler: authMiddleware }, getDiscordUserIdRouteHandler);

// --- GET ---

// Get global records
app.get("/records", { preHandler: authMiddleware }, getBestScoresForCategoryRouteHandler);

// Health check
app.get("/health", healthRouteHandler);

// Player profile from username
app.get("/player-profile", { preHandler: authMiddleware }, getPlayerProfileRouteHandler);

export default app;
