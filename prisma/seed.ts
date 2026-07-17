import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      email: "admin@galaxydefense.com",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: admin / admin123`);

  // Create sample creator account
  const creatorPassword = await bcrypt.hash("creator123", 12);
  const creatorUser = await db.user.upsert({
    where: { username: "creator01" },
    update: {},
    create: {
      email: "creator01@galaxydefense.com",
      username: "creator01",
      passwordHash: creatorPassword,
      role: "CREATOR",
    },
  });

  const creator = await db.creator.upsert({
    where: { userId: creatorUser.id },
    update: {},
    create: {
      userId: creatorUser.id,
      displayName: "Demo Creator",
      creatorCode: "PATHFINDER001",
    },
  });

  await db.creditWallet.upsert({
    where: { creatorId: creator.id },
    update: {},
    create: { creatorId: creator.id, balance: 0 },
  });
  console.log(`✅ Creator user: creator01 / creator123 (Player ID not yet bound)`);

  // Create sample campaign
  const campaign = await db.campaign.create({
    data: {
      name: "Pathfinder Program - Season 1",
      platform: "BOTH",
      startTime: new Date("2026-07-01"),
      endTime: new Date("2026-09-30"),
      active: true,
      description: "Galaxy Defense Pathfinder Program Season 1. Submit your YouTube and TikTok videos to earn rewards!",
    },
  });
  console.log(`✅ Campaign: ${campaign.name}`);

  // Create milestones for YouTube
  const ytMilestones = [
    { viewThreshold: 1000, creditsAwarded: 100 },
    { viewThreshold: 5000, creditsAwarded: 250 },
    { viewThreshold: 10000, creditsAwarded: 500 },
    { viewThreshold: 30000, creditsAwarded: 1000 },
    { viewThreshold: 80000, creditsAwarded: 2500 },
    { viewThreshold: 200000, creditsAwarded: 5000 },
  ];

  for (const m of ytMilestones) {
    await db.milestone.create({
      data: {
        campaignId: campaign.id,
        platform: "YOUTUBE",
        viewThreshold: m.viewThreshold,
        creditsAwarded: m.creditsAwarded,
        active: true,
      },
    });
  }
  console.log(`✅ ${ytMilestones.length} YouTube milestones created`);

  // Create milestones for TikTok
  const ttMilestones = [
    { viewThreshold: 1000, creditsAwarded: 100 },
    { viewThreshold: 5000, creditsAwarded: 250 },
    { viewThreshold: 10000, creditsAwarded: 500 },
    { viewThreshold: 30000, creditsAwarded: 1000 },
    { viewThreshold: 80000, creditsAwarded: 2500 },
  ];

  for (const m of ttMilestones) {
    await db.milestone.create({
      data: {
        campaignId: campaign.id,
        platform: "TIKTOK",
        viewThreshold: m.viewThreshold,
        creditsAwarded: m.creditsAwarded,
        active: true,
      },
    });
  }
  console.log(`✅ ${ttMilestones.length} TikTok milestones created`);

  // Create sample shop items
  const shopItems = [
    { gameItemId: "14701", itemName: "Galaxy Credits Pack", creditCost: 50, quantity: -1, description: "500 in-game credits" },
    { gameItemId: "14702", itemName: "Rare Skin Shard", creditCost: 200, quantity: 100, description: "Unlock a rare weapon skin" },
    { gameItemId: "14703", itemName: "Epic Loot Box", creditCost: 500, quantity: 50, description: "Contains epic or better items" },
    { gameItemId: "14704", itemName: "Name Change Card", creditCost: 300, quantity: -1, description: "Change your in-game name" },
    { gameItemId: "14705", itemName: "XP Boost (7 Days)", creditCost: 150, quantity: -1, description: "Double XP for 7 days" },
  ];

  for (const item of shopItems) {
    await db.shopItem.create({ data: item });
  }
  console.log(`✅ ${shopItems.length} shop items created`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
