import Fastify from "fastify";
import { addWordRouteHandler } from "./routes/addWord.route";
import { authMiddleware } from "./middleware/auth";

const app = Fastify();

// Apply middleware to all routes
app.addHook("preHandler", authMiddleware);

// API Routes
app.post("/add-word", addWordRouteHandler);

// Start the API
app.listen({ port: 4000 }, (err) => {
    if (err) throw err;
    console.log("API running on http://localhost:4000");
});
