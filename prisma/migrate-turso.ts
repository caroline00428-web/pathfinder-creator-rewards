// Run this once to create tables on Turso and seed data
// Usage: set TURSO_DATABASE_URL=... && set TURSO_AUTH_TOKEN=... && npx tsx prisma/migrate-turso.ts

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("❌ Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CREATOR',
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Creator (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL REFERENCES User(id),
  displayName TEXT NOT NULL,
  creatorCode TEXT UNIQUE NOT NULL,
  playerId TEXT UNIQUE,
  playerIdLocked INTEGER NOT NULL DEFAULT 0,
  discordId TEXT,
  youtubeChannelId TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Campaign (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Video (
  id TEXT PRIMARY KEY,
  creatorId TEXT NOT NULL REFERENCES Creator(id),
  campaignId TEXT NOT NULL REFERENCES Campaign(id),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  externalVideoId TEXT,
  title TEXT,
  uploadTime TEXT NOT NULL,
  viewCount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  eligibilityStatus TEXT NOT NULL DEFAULT 'PENDING',
  lastSyncedAt TEXT,
  submittedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(creatorId, url)
);

CREATE TABLE IF NOT EXISTS ViewCountHistory (
  id TEXT PRIMARY KEY,
  videoId TEXT NOT NULL REFERENCES Video(id),
  viewCount INTEGER NOT NULL,
  source TEXT NOT NULL,
  recordedBy TEXT,
  recordedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS Milestone (
  id TEXT PRIMARY KEY,
  campaignId TEXT REFERENCES Campaign(id),
  platform TEXT NOT NULL,
  viewThreshold INTEGER NOT NULL,
  creditsAwarded INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS MilestoneClaim (
  id TEXT PRIMARY KEY,
  creatorId TEXT NOT NULL REFERENCES Creator(id),
  videoId TEXT NOT NULL REFERENCES Video(id),
  milestoneId TEXT NOT NULL REFERENCES Milestone(id),
  platform TEXT NOT NULL,
  creditsAwarded INTEGER NOT NULL,
  claimedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(videoId, milestoneId)
);

CREATE TABLE IF NOT EXISTS CreditWallet (
  id TEXT PRIMARY KEY,
  creatorId TEXT UNIQUE NOT NULL REFERENCES Creator(id),
  balance INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS CreditTransaction (
  id TEXT PRIMARY KEY,
  creatorId TEXT NOT NULL REFERENCES Creator(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  relatedVideoId TEXT,
  relatedOrderId TEXT,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ShopItem (
  id TEXT PRIMARY KEY,
  gameItemId TEXT NOT NULL,
  itemName TEXT NOT NULL,
  creditCost INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT -1,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS RewardOrder (
  id TEXT PRIMARY KEY,
  creatorId TEXT NOT NULL REFERENCES Creator(id),
  playerId TEXT NOT NULL,
  totalCreditCost INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  exportBatchId TEXT REFERENCES ExportBatch(id),
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS RewardOrderItem (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL REFERENCES RewardOrder(id),
  gameItemId TEXT NOT NULL,
  itemName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  creditCost INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ExportBatch (
  id TEXT PRIMARY KEY,
  exportedBy TEXT NOT NULL,
  exportedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'pending',
  fileName TEXT,
  orderCount INTEGER NOT NULL DEFAULT 0
);
`;

async function main() {
  console.log("🚀 Creating tables on Turso...");

  // Execute each statement separately
  const statements = SCHEMA_SQL.split(";").map(s => s.trim()).filter(s => s.length > 0);
  for (const sql of statements) {
    try {
      await db.execute(sql + ";");
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.log(`  ⚠️ ${e.message?.slice(0, 80)}`);
      }
    }
  }
  console.log("✅ Tables created");

  // Check if already seeded
  const existing = await db.execute("SELECT id FROM User WHERE username = 'admin'");
  if (existing.rows.length > 0) {
    console.log("✅ Already seeded, skipping");
    return;
  }

  // Seed admin user
  const bcrypt = require("bcryptjs");
  const adminHash = await bcrypt.hash("admin123", 12);
  const adminId = "admin_001";

  await db.execute({
    sql: "INSERT INTO User (id, email, username, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
    args: [adminId, "admin@galaxydefense.com", "admin", adminHash, "ADMIN"],
  });
  console.log("✅ Admin: admin / admin123");

  // Seed creator
  const creatorHash = await bcrypt.hash("creator123", 12);
  const creatorUserId = "creator_001";
  const creatorId = "cr_001";

  await db.execute({
    sql: "INSERT INTO User (id, email, username, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
    args: [creatorUserId, "creator01@galaxydefense.com", "creator01", creatorHash, "CREATOR"],
  });
  await db.execute({
    sql: "INSERT INTO Creator (id, userId, displayName, creatorCode) VALUES (?, ?, ?, ?)",
    args: [creatorId, creatorUserId, "Demo Creator", "PATHFINDER001"],
  });
  await db.execute({
    sql: "INSERT INTO CreditWallet (id, creatorId, balance) VALUES (?, ?, 0)",
    args: ["wallet_001", creatorId],
  });
  console.log("✅ Creator: creator01 / creator123");

  // Seed campaign
  const campaignId = "camp_001";
  await db.execute({
    sql: "INSERT INTO Campaign (id, name, platform, startTime, endTime, active, description) VALUES (?, ?, ?, ?, ?, 1, ?)",
    args: [campaignId, "Pathfinder Program - Season 1", "BOTH", "2026-07-01T00:00:00.000Z", "2026-09-30T00:00:00.000Z", "Galaxy Defense Pathfinder Program Season 1"],
  });
  console.log("✅ Campaign created");

  // Seed milestones
  const ytMilestones = [
    [1000, 100], [5000, 250], [10000, 500], [30000, 1000], [80000, 2500], [200000, 5000],
  ];
  for (let i = 0; i < ytMilestones.length; i++) {
    await db.execute({
      sql: "INSERT INTO Milestone (id, campaignId, platform, viewThreshold, creditsAwarded) VALUES (?, ?, 'YOUTUBE', ?, ?)",
      args: [`ms_yt_${i}`, campaignId, ytMilestones[i][0], ytMilestones[i][1]],
    });
  }
  const ttMilestones = [
    [1000, 100], [5000, 250], [10000, 500], [30000, 1000], [80000, 2500],
  ];
  for (let i = 0; i < ttMilestones.length; i++) {
    await db.execute({
      sql: "INSERT INTO Milestone (id, campaignId, platform, viewThreshold, creditsAwarded) VALUES (?, ?, 'TIKTOK', ?, ?)",
      args: [`ms_tt_${i}`, campaignId, ttMilestones[i][0], ttMilestones[i][1]],
    });
  }
  console.log(`✅ ${ytMilestones.length + ttMilestones.length} milestones created`);

  // Seed shop items
  const shopItems = [
    ["14701", "Galaxy Credits Pack", 50, -1, "500 in-game credits"],
    ["14702", "Rare Skin Shard", 200, 100, "Unlock a rare weapon skin"],
    ["14703", "Epic Loot Box", 500, 50, "Contains epic or better items"],
    ["14704", "Name Change Card", 300, -1, "Change your in-game name"],
    ["14705", "XP Boost (7 Days)", 150, -1, "Double XP for 7 days"],
  ];
  for (let i = 0; i < shopItems.length; i++) {
    await db.execute({
      sql: "INSERT INTO ShopItem (id, gameItemId, itemName, creditCost, quantity, description) VALUES (?, ?, ?, ?, ?, ?)",
      args: [`shop_${i}`, ...shopItems[i]],
    });
  }
  console.log(`✅ ${shopItems.length} shop items created`);

  console.log("\n🎉 Turso database ready!");
}

main().catch(e => { console.error(e); process.exit(1); });
