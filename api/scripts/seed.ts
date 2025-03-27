import { PrismaClient } from "@prisma/client";

async function seed() {
    let prisma = new PrismaClient();
    await prisma.$connect();

    await prisma.$executeRaw`
        create or replace view player_latest_username as
            (with un as (
                select p.id as player_id, pu.username as player_username, row_number() over (partition by pu.player_id order by pu.created_at desc) as recency_rank
                from player_username pu
                inner join player p
                on pu.player_id = p.id
            )
            select player_id, player_username as username from un where recency_rank = 1
        )
    `;
}

seed();
