import Fastify from "fastify";
import { AddWordRouteHandler } from "./routes/AddWord/AddWord.route";
const app = Fastify();

app.post("/add-word", AddWordRouteHandler);

app.listen({ port: 4000 }, (err) => {
    if (err) throw err;
    console.log("API running on http://localhost:4000");
});
