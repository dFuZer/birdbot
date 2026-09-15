import { z } from "zod";

const actor = z.string().trim().min(1).max(80);
const staffRoleSchema = z.enum(["ADMIN", "AUTOMOD"]);

const staffMutationSchema = z.object({
    accountName: z.string().trim().min(1).max(120),
    role: staffRoleSchema,
    updatedBy: actor,
});

export { staffMutationSchema, staffRoleSchema };
