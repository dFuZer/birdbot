import Logger from "../lib/logger";
import prisma from "../prisma";

export default async function refreshMaterializedViews() {
    Logger.log({ message: "Refreshing materialized views", path: "helpers/refreshMaterializedViews.ts" });
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW leaderboard;`;
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW pp_leaderboard;`;
}
