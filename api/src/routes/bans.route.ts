import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import prisma from "../prisma";

const banEventSchema = z.object({
    playerAccount: z.string().trim().min(1).max(120),
    roomCode: z.string().trim().min(1).max(16),
    moderatorAccounts: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
});

const createBanEventRouteHandler: RouteHandlerMethod = async (req, res) => {
    const body = banEventSchema.safeParse(req.body);
    if (!body.success) return res.status(400).send({ message: "Invalid input" });
    const event = await prisma.banEvent.create({
        data: {
            player_account: body.data.playerAccount,
            room_code: body.data.roomCode,
            moderator_accounts: body.data.moderatorAccounts,
        },
    });
    return res.status(201).send({
        id: event.id,
        playerAccount: event.player_account,
        roomCode: event.room_code,
        moderatorAccounts: event.moderator_accounts,
        createdAt: event.created_at,
    });
};

export { createBanEventRouteHandler };
