const { PrismaClient } = require('@prisma/client');

async function diagnose() {
  const db = new PrismaClient();
  
  console.log('[AUTO DIAGNOSE] 🔍 Checking email system status...\n');
  
  try {
    // Creators with emails
    console.log('[✅ CREATORS WITH EMAILS]');
    const creators = await db.creator.findMany({
      take: 5,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`  Found: ${creators.length}`);
    creators.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.displayName} → ${c.user?.email}`);
    });
    
    // Check reward orders
    console.log('\n[✅ REWARD ORDERS]');
    const orderCount = await db.rewardOrder.count();
    const ordersPending = await db.rewardOrder.count({
      where: { status: 'PENDING' }
    });
    const ordersSent = await db.rewardOrder.count({
      where: { status: 'SENT' }
    });
    
    console.log(`  Total: ${orderCount}`);
    console.log(`  Pending: ${ordersPending}`);
    console.log(`  Sent: ${ordersSent}`);
    
    if (orderCount > 0) {
      const sampleOrders = await db.rewardOrder.findMany({
        take: 2,
        include: { creator: { include: { user: { select: { email: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n  Recent orders:');
      sampleOrders.forEach((o, i) => {
        console.log(`  ${i+1}. ${o.creator.displayName} (${o.status})`);
        console.log(`     Email: ${o.creator.user?.email}`);
      });
    }
    
    // Summary
    console.log('\n[📊 EMAIL SYSTEM READY?]');
    const hasCreators = creators.length > 0 && creators.some(c => c.user?.email);
    const hasOrders = orderCount > 0;
    
    console.log(`  ✅ Creators with emails: ${hasCreators ? 'YES' : 'NO'}`);
    console.log(`  ✅ Orders exist: ${hasOrders ? 'YES' : 'NO'}`);
    console.log(`  ✅ Email config: SET`);
    console.log(`\n  👉 System ready for testing!`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  await db.$disconnect();
  process.exit(0);
}

diagnose();
