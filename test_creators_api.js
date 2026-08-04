import { PrismaClient } from "@prisma/client";

async function test() {
  const db = new PrismaClient();
  
  try {
    console.log("Testing Creator data...");
    const creators = await db.creator.findMany({
      include: {
        user: { select: { username: true, email: true } },
        wallet: { select: { balance: true } },
        _count: { select: { videos: true, orders: true } },
      },
    });
    
    console.log("Found creators:", creators.length);
    console.log(JSON.stringify(creators, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

test();
