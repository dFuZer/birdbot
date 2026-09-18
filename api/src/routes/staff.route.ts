import type { RouteHandlerMethod } from "fastify";
import { BotStaffRole } from "@prisma/client";
import prisma from "../prisma";
import { staffMutationSchema, staffRoleSchema } from "../schemas/safety.zod";

async function staffPayload() {
    const rows = await prisma.botStaff.findMany({ orderBy: [{ role: "asc" }, { auth_id: "asc" }] });
    return {
        admins: rows.filter((row) => row.role === BotStaffRole.ADMIN).map((row) => row.auth_id),
        automods: rows.filter((row) => row.role === BotStaffRole.AUTOMOD).map((row) => row.auth_id),
    };
}

const listStaffRouteHandler: RouteHandlerMethod = async (_req, res) => {
    return res.send(await staffPayload());
};

const putStaffRouteHandler: RouteHandlerMethod = async (req, res) => {
    const body = staffMutationSchema.safeParse(req.body);
    if (!body.success) return res.status(400).send({ message: "Invalid input" });
    const role = body.data.role === "ADMIN" ? BotStaffRole.ADMIN : BotStaffRole.AUTOMOD;
    await prisma.botStaff.upsert({
        where: {
            auth_id_role: { auth_id: body.data.authId, role },
        },
        create: {
            auth_id: body.data.authId,
            role,
            updated_by: body.data.updatedBy,
        },
        update: { updated_by: body.data.updatedBy },
    });
    return res.send(await staffPayload());
};

const deleteStaffRouteHandler: RouteHandlerMethod = async (req, res) => {
    const body = staffMutationSchema.safeParse(req.body);
    if (!body.success) return res.status(400).send({ message: "Invalid input" });
    const roleParse = staffRoleSchema.safeParse(body.data.role);
    if (!roleParse.success) return res.status(400).send({ message: "Invalid role" });
    const role = roleParse.data === "ADMIN" ? BotStaffRole.ADMIN : BotStaffRole.AUTOMOD;
    await prisma.botStaff.deleteMany({
        where: { auth_id: body.data.authId, role },
    });
    return res.send(await staffPayload());
};

export { deleteStaffRouteHandler, listStaffRouteHandler, putStaffRouteHandler };
