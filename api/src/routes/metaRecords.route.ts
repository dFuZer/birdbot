import type { RouteHandlerMethod } from "fastify";
import { milestoneQuerySchema, milestoneSchema } from "../schemas/parity.zod";
import { listMilestones, recordMilestone } from "../services/parity.service";

const getMetaRecordsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = milestoneQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).send({ message: "Invalid query", issues: parsed.error.issues });
    return res.send(
        await listMilestones(parsed.data.playerId, parsed.data.type, parsed.data.limit, parsed.data.milestone),
    );
};

const writeMetaRecordRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = milestoneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    return res.status(201).send(await recordMilestone(parsed.data));
};

export { getMetaRecordsRouteHandler, writeMetaRecordRouteHandler };
