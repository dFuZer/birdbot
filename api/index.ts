import Fastify from "fastify";
import Logger from "./lib/logger";
import { authMiddleware } from "./middleware/auth";
import { addPlayerRouteHandler } from "./routes/addPlayer.route";
import { addWordRouteHandler } from "./routes/addWord.route";

const app = Fastify();
const PORT = 4000;

// Apply middleware to all routes
app.addHook("preHandler", authMiddleware);

// API Routes
app.post("/add-word", addWordRouteHandler);
app.post("/add-player", addPlayerRouteHandler);

// Start the API
app.listen({ port: PORT }, (err) => {
    if (err) throw err;
    Logger.log({ message: `API running on http://localhost:${PORT}`, path: "index.ts" });
});
