const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  const creators = await db.creator.findMany({
    take: 5,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Recent creators with emails:');
  creators.forEach(c => {
    console.log(`- ${c.displayName}: ${c.user?.email || 'NO EMAIL'}`);
  });
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
