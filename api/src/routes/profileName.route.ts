import type { RouteHandlerMethod } from "fastify";
import { playerParams, profileNameSchema } from "../schemas/parity.zod";
import {
    ProfileNameConflictError,
    ProfileNameCooldownError,
    setProfileName,
} from "../services/parity.service";

const setProfileNameRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = playerParams.safeParse(req.params);
    const body = profileNameSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });

    try {
        return res.send(await setProfileName(params.data.playerId, body.data.username));
    } catch (error) {
        if (error instanceof ProfileNameConflictError) return res.status(409).send({ message: error.message });
        if (error instanceof ProfileNameCooldownError) {
            return res.status(429).send({ message: error.message, availableAt: error.availableAt.toISOString() });
        }
        throw error;
    }
};

export { setProfileNameRouteHandler };
