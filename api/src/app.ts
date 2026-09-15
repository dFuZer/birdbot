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
import {
    getEconomyProfileRouteHandler,
    grantVipRouteHandler,
    mutateCreditsRouteHandler,
    mutateXpRouteHandler,
    recordPurchaseRouteHandler,
    setCosmeticsRouteHandler,
} from "./routes/economy.route";
import { getMetaRecordsRouteHandler, writeMetaRecordRouteHandler } from "./routes/metaRecords.route";
import { getModerationStateRouteHandler, setModerationStateRouteHandler } from "./routes/moderation.route";
import { createNewsRouteHandler, getNewsRouteHandler, updateNewsRouteHandler } from "./routes/news.route";
import { setProfileNameRouteHandler } from "./routes/profileName.route";
import { createBanEventRouteHandler } from "./routes/bans.route";
import {
    deleteBotRoomRouteHandler,
    listBotRoomsRouteHandler,
    upsertBotRoomRouteHandler,
} from "./routes/botRooms.route";
import { deleteStaffRouteHandler, listStaffRouteHandler, putStaffRouteHandler } from "./routes/staff.route";

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
app.post("/economy/credits", { preHandler: authMiddleware }, mutateCreditsRouteHandler);
app.post("/economy/xp", { preHandler: authMiddleware }, mutateXpRouteHandler);
app.post("/economy/purchases", { preHandler: authMiddleware }, recordPurchaseRouteHandler);
app.post("/profile/:playerId/vip", { preHandler: authMiddleware }, grantVipRouteHandler);
app.post("/meta/records", { preHandler: authMiddleware }, writeMetaRecordRouteHandler);
app.post("/news", { preHandler: authMiddleware }, createNewsRouteHandler);
app.post("/bans", { preHandler: authMiddleware }, createBanEventRouteHandler);
app.put("/staff", { preHandler: authMiddleware }, putStaffRouteHandler);
app.delete("/staff", { preHandler: authMiddleware }, deleteStaffRouteHandler);
app.put("/bot/rooms/:roomCode", { preHandler: authMiddleware }, upsertBotRoomRouteHandler);
app.delete("/bot/rooms/:roomCode", { preHandler: authMiddleware }, deleteBotRoomRouteHandler);

// --- PATCH ---

app.patch("/profile/:playerId/cosmetics", { preHandler: authMiddleware }, setCosmeticsRouteHandler);
app.patch("/profile/:playerId/name", { preHandler: authMiddleware }, setProfileNameRouteHandler);
app.patch("/moderation/:playerId", { preHandler: authMiddleware }, setModerationStateRouteHandler);
app.patch("/news/:newsId", { preHandler: authMiddleware }, updateNewsRouteHandler);

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
app.get("/economy/:playerId", { preHandler: authMiddleware }, getEconomyProfileRouteHandler);
app.get("/meta/records", { preHandler: authMiddleware }, getMetaRecordsRouteHandler);
app.get("/moderation/:playerId", { preHandler: authMiddleware }, getModerationStateRouteHandler);
app.get("/news", { preHandler: authMiddleware }, getNewsRouteHandler);
app.get("/staff", { preHandler: authMiddleware }, listStaffRouteHandler);
app.get("/bot/rooms", { preHandler: authMiddleware }, listBotRoomsRouteHandler);

export default app;
