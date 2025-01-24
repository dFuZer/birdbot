import Fastify from "fastify";
import prisma from "@prisma/client";
import z from "zod";

const app = Fastify();

app.get("/", async (req, res) => {
    res.send({ message: "API is running!" });
});

app.listen({ port: 4000 }, (err) => {
    if (err) throw err;
    console.log("API running on http://localhost:4000");
});
