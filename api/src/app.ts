import Fastify from "fastify";
import Logger from "./lib/logger";
import { authMiddleware } from "./middleware/auth.middleware";
import { addGameRouteHandler } from "./routes/addGame.route";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";
import { getBestScoresForCategoryRouteHandler } from "./routes/getBestScoresForCategory.route";
import { getLeaderboardRouteHandler } from "./routes/getLeaderboard.route";
import { getPlayerProfileRouteHandler } from "./routes/getPlayerProfile.route";
import { getUserProfileRouteHandler } from "./routes/getUserProfile.route";
import { healthRouteHandler } from "./routes/health.route";
import { linkAccountRouteHandler } from "./routes/linkAccount.route";
import { postDiscordOAuthToken } from "./routes/postDiscordOAuthToken.route";

const app = Fastify();

app.addHook("onError", (req, res, error) => {
    Logger.error({
        errorType: "unknown",
        error,
        path: req.url,
        message: `An unknown error occurred: ${error.message}`,
    });
    res.status(500).send({ error: "Internal server error" });
});

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
app.post("/auth-code", { preHandler: authMiddleware }, postDiscordOAuthToken);
// Link account
app.post("/link-account", { preHandler: authMiddleware }, linkAccountRouteHandler);

// --- GET ---

// Get global records
app.get("/records", { preHandler: authMiddleware }, getBestScoresForCategoryRouteHandler);

// Health check
app.get("/health", healthRouteHandler);

// Player profile from username
app.get("/player-profile", { preHandler: authMiddleware }, getPlayerProfileRouteHandler);

// Get user profile from session token
app.get("/user", { preHandler: authMiddleware }, getUserProfileRouteHandler);

// Get leaderboard
app.get("/leaderboard", getLeaderboardRouteHandler);

export default app;
