import Fastify from "fastify";
import { authMiddleware } from "./middleware/auth";
import { addPlayerRouteHandler } from "./routes/addPlayer.route";
import { addWordRouteHandler } from "./routes/addWord.route";

const app = Fastify();

// Apply middleware to all routes
app.addHook("preHandler", authMiddleware);

// API Routes
app.post("/add-word", addWordRouteHandler);
app.post("/add-player", addPlayerRouteHandler);

// Start the API
app.listen({ port: 4000 }, (err) => {
    if (err) throw err;
    console.log("API running on http://localhost:4000");
});
