// Seed Turso via HTTP API (bypasses @libsql/client header issue in Node 24)
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error("❌ Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

// Extract host from libsql:// url -> https:// for HTTP API
const host = url.replace("libsql://", "https://");
const baseUrl = `${host}/v2/pipeline`;

async function execute(sql: string, args?: any[]) {
  const body: any = { requests: [{ type: "execute", stmt: { sql, args } }] };
  // Use global fetch — avoids undici header validation in Node 24
  const res = await globalThis.fetch(baseUrl, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.results?.[0]?.type === "error") {
    console.log(`  ⚠️ ${data.results[0].error?.message?.slice(0, 60)}`);
  }
  return data;
}

async function main() {
  console.log("🌱 Seeding Turso...");

  // Check if already seeded
  const check = await execute("SELECT id FROM User WHERE username = 'admin'");
  if (check.results?.[0]?.response?.result?.rows?.length > 0) {
    console.log("✅ Already seeded, skipping");
    return;
  }

  const adminHash = await bcrypt.hash("admin123", 12);
  const creatorHash = await bcrypt.hash("creator123", 12);

  // Admin
  await execute("INSERT INTO User (id, email, username, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
    ["admin_001", "admin@galaxydefense.com", "admin", adminHash, "ADMIN"]);
  console.log("✅ Admin: admin / admin123");

  // Creator
  await execute("INSERT INTO User (id, email, username, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
    ["creator_001", "creator01@galaxydefense.com", "creator01", creatorHash, "CREATOR"]);
  await execute("INSERT INTO Creator (id, userId, displayName, creatorCode) VALUES (?, ?, ?, ?)",
    ["cr_001", "creator_001", "Demo Creator", "PATHFINDER001"]);
  await execute("INSERT INTO CreditWallet (id, creatorId, balance) VALUES (?, ?, 0)",
    ["wallet_001", "cr_001"]);
  console.log("✅ Creator: creator01 / creator123");

  // Campaign
  await execute("INSERT INTO Campaign (id, name, platform, startTime, endTime, active, description) VALUES (?, ?, ?, ?, ?, 1, ?)",
    ["camp_001", "Pathfinder Program - Season 1", "BOTH", "2026-07-01T00:00:00.000Z", "2026-09-30T00:00:00.000Z", "Galaxy Defense Pathfinder Program Season 1"]);
  console.log("✅ Campaign created");

  // YouTube milestones
  const yt = [[1000,100],[5000,250],[10000,500],[30000,1000],[80000,2500],[200000,5000]];
  for (let i=0; i<yt.length; i++) {
    await execute("INSERT INTO Milestone (id, campaignId, platform, viewThreshold, creditsAwarded) VALUES (?, ?, 'YOUTUBE', ?, ?)",
      [`ms_yt_${i}`, "camp_001", yt[i][0], yt[i][1]]);
  }
  // TikTok milestones
  const tt = [[1000,100],[5000,250],[10000,500],[30000,1000],[80000,2500]];
  for (let i=0; i<tt.length; i++) {
    await execute("INSERT INTO Milestone (id, campaignId, platform, viewThreshold, creditsAwarded) VALUES (?, ?, 'TIKTOK', ?, ?)",
      [`ms_tt_${i}`, "camp_001", tt[i][0], tt[i][1]]);
  }
  console.log(`✅ ${yt.length + tt.length} milestones created`);

  // Shop items
  const shop = [
    ["14701","Galaxy Credits Pack",50,-1,"500 in-game credits"],
    ["14702","Rare Skin Shard",200,100,"Unlock a rare weapon skin"],
    ["14703","Epic Loot Box",500,50,"Contains epic or better items"],
    ["14704","Name Change Card",300,-1,"Change your in-game name"],
    ["14705","XP Boost (7 Days)",150,-1,"Double XP for 7 days"],
  ];
  for (let i=0; i<shop.length; i++) {
    await execute("INSERT INTO ShopItem (id, gameItemId, itemName, creditCost, quantity, description) VALUES (?, ?, ?, ?, ?, ?)",
      [`shop_${i}`, ...shop[i]]);
  }
  console.log(`✅ ${shop.length} shop items created`);
  console.log("\n🎉 Turso seed complete!");
}

main().catch(e => { console.error(e); process.exit(1); });
