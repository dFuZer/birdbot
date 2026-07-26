import type { RouteHandlerMethod } from "fastify";
import {
    cosmeticsSchema,
    creditMutationSchema,
    playerParams,
    purchaseSchema,
    vipSchema,
    xpMutationSchema,
} from "../schemas/parity.zod";
import {
    getEconomyProfile,
    grantVip,
    InvalidPurchaseError,
    InsufficientCreditsError,
    InvalidXpMutationError,
    mutateCredits,
    mutateXp,
    recordPurchase,
    setCosmetics,
} from "../services/parity.service";

const getEconomyProfileRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = playerParams.safeParse(req.params);
    if (!parsed.success) return res.status(400).send({ message: "Invalid player id" });
    return res.send(await getEconomyProfile(parsed.data.playerId));
};

const mutateXpRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = xpMutationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    try {
        return res.send(await mutateXp(parsed.data));
    } catch (error) {
        if (error instanceof InvalidXpMutationError) return res.status(409).send({ message: error.message });
        throw error;
    }
};

const mutateCreditsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = creditMutationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    try {
        return res.send(await mutateCredits(parsed.data));
    } catch (error) {
        if (error instanceof InsufficientCreditsError) return res.status(409).send({ message: error.message });
        throw error;
    }
};

const recordPurchaseRouteHandler: RouteHandlerMethod = async (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send({ message: "Invalid input", issues: parsed.error.issues });
    try {
        return res.status(201).send(await recordPurchase(parsed.data));
    } catch (error) {
        if (error instanceof InvalidPurchaseError) return res.status(400).send({ message: error.message });
        if (error instanceof InsufficientCreditsError) return res.status(409).send({ message: error.message });
        throw error;
    }
};

const setCosmeticsRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = playerParams.safeParse(req.params);
    const body = cosmeticsSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });
    return res.send(await setCosmetics(params.data.playerId, body.data));
};

const grantVipRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = playerParams.safeParse(req.params);
    const body = vipSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });
    return res.status(201).send(await grantVip(params.data.playerId, body.data));
};

export {
    getEconomyProfileRouteHandler,
    grantVipRouteHandler,
    mutateCreditsRouteHandler,
    mutateXpRouteHandler,
    recordPurchaseRouteHandler,
    setCosmeticsRouteHandler,
};
