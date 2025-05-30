import type { onRequestAsyncHookHandler } from "fastify";
import { API_KEY } from "../env";

let authMiddleware: onRequestAsyncHookHandler = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (token !== API_KEY) {
        return reply.status(403).send({ error: "Invalid API Key" });
    }
};

export { authMiddleware };
