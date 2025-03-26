import Fastify from "fastify";
import Logger from "./lib/logger";
import { authMiddleware } from "./middleware/auth";
import { addGameRecapRouteHandler } from "./routes/addGameRecap.route";
import { addPlayersRouteHandler } from "./routes/addPlayers.route";
import { addWordRouteHandler } from "./routes/addWord.route";

const app = Fastify();
const PORT = 4000;

// Apply middleware to all routes
app.addHook("preHandler", authMiddleware);

// API Routes
app.post("/add-word", addWordRouteHandler);
app.post("/add-player", addPlayersRouteHandler);
app.post("/add-game-recap", addGameRecapRouteHandler);

// Start the API
app.listen({ port: PORT }, (err) => {
    if (err) throw err;
    Logger.log({ message: `API running on http://localhost:${PORT}`, path: "index.ts" });
});
