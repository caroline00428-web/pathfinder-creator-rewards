// One-time migration: add SpecialReward + SpecialRewardApplication tables + seed 5 rewards
// Usage: set TURSO_DATABASE_URL=... && set TURSO_AUTH_TOKEN=... && npx tsx prisma/migrate-special-rewards.ts

import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("❌ Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({ url, authToken: token });

async function main() {
  console.log("🔄 Creating SpecialReward + SpecialRewardApplication tables...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS SpecialReward (
      id TEXT PRIMARY KEY,
      campaignId TEXT NOT NULL REFERENCES Campaign(id),
      rewardType TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      diamonds INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS SpecialRewardApplication (
      id TEXT PRIMARY KEY,
      creatorId TEXT NOT NULL REFERENCES Creator(id),
      rewardId TEXT NOT NULL REFERENCES SpecialReward(id),
      campaignId TEXT NOT NULL REFERENCES Campaign(id),
      videoId TEXT,
      followerCount INTEGER,
      profileUrl TEXT,
      notes TEXT,
      adminNotes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      reviewedAt TEXT,
      UNIQUE(creatorId, rewardId, videoId)
    )
  `);

  console.log("✅ Tables created");

  // Check if already seeded
  const existing = await db.execute("SELECT id FROM SpecialReward LIMIT 1");
  if (existing.rows.length > 0) {
    console.log("✅ Already seeded, skipping");
    return;
  }

  // Get campaign ID
  const camp = await db.execute("SELECT id FROM Campaign LIMIT 1");
  const campaignId = String(camp.rows[0]?.[0] ?? "camp_001");

  const rewards = [
    [campaignId, "REGISTRATION", "Registration Bonus", "Complete the registration form to receive this bonus. One-time per creator.", 200],
    [campaignId, "PARTICIPATION", "Participation Award", "Submit 1 valid video to qualify. Once per platform-wide. Stacks with tier rewards.", 500],
    [campaignId, "DILIGENCE", "Diligence Award", "15+ active publishing days during the campaign with videos reaching ≥200 views. Stacks with tier rewards.", 1000],
    [campaignId, "STAR_CREATOR", "Star Creator Award", "Account with 5,000+ real followers. Complete basic content tasks for extra bonus. Stacks with tier rewards.", 1000],
    [campaignId, "AI_COMIC", "AI Comic Award", "AI-created 30s+ video in My Defense World universe with complete storyline. 500 diamonds per video.", 500],
  ];

  for (const [cid, type, name, desc, diamonds] of rewards) {
    await db.execute({
      sql: "INSERT INTO SpecialReward (id, campaignId, rewardType, name, description, diamonds) VALUES (?, ?, ?, ?, ?, ?)",
      args: [`sr_${String(type).toLowerCase()}`, cid, type, name, desc, diamonds],
    });
  }

  console.log(`✅ ${rewards.length} special rewards seeded`);
  console.log("\n🎉 Migration complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });
