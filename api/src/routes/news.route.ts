import { Prisma } from "@prisma/client";
import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { newsCreateSchema, newsQuerySchema, newsUpdateSchema } from "../schemas/parity.zod";
import { createNews, listNews, updateNews } from "../services/parity.service";

const newsParams = z.object({ newsId: z.string().uuid() });

const getNewsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = newsQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).send({ message: "Invalid query", issues: parsed.error.issues });
    return res.send(await listNews(parsed.data.includeDrafts, parsed.data.limit));
};

const createNewsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = newsCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    return res.status(201).send(await createNews(parsed.data));
};

const updateNewsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = newsParams.safeParse(req.params);
    const body = newsUpdateSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });
    try {
        return res.send(await updateNews(params.data.newsId, body.data));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).send({ message: "News entry not found" });
        }
        throw error;
    }
};

export { createNewsRouteHandler, getNewsRouteHandler, updateNewsRouteHandler };
