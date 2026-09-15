import type { RouteHandlerMethod } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../prisma";

const roomParams = z.object({ roomCode: z.string().trim().min(1).max(16) });
const upsertRoomSchema = z.object({
    userToken: z.string().trim().min(1).max(120),
    serverUrl: z.string().trim().max(500).nullable().optional(),
    creatorAuthId: z.string().trim().max(120).nullable().optional(),
    targetConfig: z.record(z.unknown()),
});

const listBotRoomsRouteHandler: RouteHandlerMethod = async (_req, res) => {
    const rooms = await prisma.botRoom.findMany({ orderBy: { created_at: "asc" } });
    return res.send(
        rooms.map((room) => ({
            roomCode: room.room_code,
            userToken: room.user_token,
            serverUrl: room.server_url,
            creatorAuthId: room.creator_auth_id,
            targetConfig: room.target_config,
            updatedAt: room.updated_at,
        })),
    );
};

const upsertBotRoomRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = roomParams.safeParse(req.params);
    const body = upsertRoomSchema.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).send({ message: "Invalid input" });

    const targetConfig = body.data.targetConfig as Prisma.InputJsonValue;
    const room = await prisma.botRoom.upsert({
        where: { room_code: params.data.roomCode },
        create: {
            room_code: params.data.roomCode,
            user_token: body.data.userToken,
            server_url: body.data.serverUrl ?? null,
            creator_auth_id: body.data.creatorAuthId ?? null,
            target_config: targetConfig,
        },
        update: {
            user_token: body.data.userToken,
            server_url: body.data.serverUrl ?? null,
            creator_auth_id: body.data.creatorAuthId ?? null,
            target_config: targetConfig,
        },
    });
    return res.send({
        roomCode: room.room_code,
        userToken: room.user_token,
        serverUrl: room.server_url,
        creatorAuthId: room.creator_auth_id,
        targetConfig: room.target_config,
        updatedAt: room.updated_at,
    });
};

const deleteBotRoomRouteHandler: RouteHandlerMethod = async (req, res) => {
    const params = roomParams.safeParse(req.params);
    if (!params.success) return res.status(400).send({ message: "Invalid input" });
    await prisma.botRoom.deleteMany({ where: { room_code: params.data.roomCode } });
    return res.status(204).send();
};

export { deleteBotRoomRouteHandler, listBotRoomsRouteHandler, upsertBotRoomRouteHandler };
