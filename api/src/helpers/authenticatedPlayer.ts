import { Prisma } from "@prisma/client";

/** JKLM guests and the bot itself must not affect recaps or word metrics. */
export const authenticatedPlayerSql = Prisma.sql`
    btrim(p.auth_id) <> ''
    AND lower(p.auth_id) <> 'birdbot'
`;
