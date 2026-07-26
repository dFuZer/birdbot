import type { RouteHandlerMethod } from "fastify";
import { moderationSchema, playerParams } from "../schemas/parity.zod";
import { getModerationState, setModerationState } from "../services/parity.service";

const getModerationStateRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = playerParams.safeParse(req.params);
    if (!parsed.success) return res.status(400).send({ message: "Invalid player id" });
    const state = await getModerationState(parsed.data.playerId);
    return res.send(
        state ?? {
            player_id: parsed.data.playerId,
            trust_score: 0,
            blacklisted: false,
            blacklist_reason: null,
            suppressed: false,
            suppress_reason: null,
        },
    );
};

const setModerationStateRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = playerParams.safeParse(req.params);
    const body = moderationSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });
    if (body.data.blacklisted === false && body.data.blacklistReason === undefined) {
        body.data.blacklistReason = null;
    }
    if (body.data.suppressed === false && body.data.suppressReason === undefined) {
        body.data.suppressReason = null;
    }
    return res.send(await setModerationState(params.data.playerId, body.data));
};

export { getModerationStateRouteHandler, setModerationStateRouteHandler };
