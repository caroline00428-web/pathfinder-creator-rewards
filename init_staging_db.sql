-- Creator Reward Platform Schema
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role TEXT DEFAULT 'CREATOR',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Creator" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  "creatorCode" TEXT UNIQUE NOT NULL,
  "playerId" TEXT UNIQUE,
  "playerIdLocked" BOOLEAN DEFAULT 0,
  "discordId" TEXT,
  "youtubeChannelId" TEXT,
  status TEXT DEFAULT 'ACTIVE',
  "rewardScheme" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "Campaign" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  "startTime" DATETIME NOT NULL,
  "endTime" DATETIME NOT NULL,
  active BOOLEAN DEFAULT 1,
  description TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Video" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  "externalVideoId" TEXT,
  title TEXT,
  "uploadTime" DATETIME NOT NULL,
  "viewCount" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  "eligibilityStatus" TEXT DEFAULT 'PENDING',
  "lastSyncedAt" DATETIME,
  "submittedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("creatorId", url),
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id),
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"(id)
);

CREATE TABLE IF NOT EXISTS "ViewCountHistory" (
  id TEXT PRIMARY KEY,
  "videoId" TEXT NOT NULL,
  "viewCount" INTEGER NOT NULL,
  source TEXT NOT NULL,
  "recordedBy" TEXT,
  "recordedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("videoId") REFERENCES "Video"(id)
);

CREATE TABLE IF NOT EXISTS "Milestone" (
  id TEXT PRIMARY KEY,
  "campaignId" TEXT,
  platform TEXT NOT NULL,
  "viewThreshold" INTEGER NOT NULL,
  "creditsAwarded" INTEGER NOT NULL,
  active BOOLEAN DEFAULT 1,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"(id)
);

CREATE TABLE IF NOT EXISTS "MilestoneClaim" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  platform TEXT NOT NULL,
  "creditsAwarded" INTEGER NOT NULL,
  "claimedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("creatorId", "milestoneId"),
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id),
  FOREIGN KEY ("videoId") REFERENCES "Video"(id),
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"(id)
);

CREATE TABLE IF NOT EXISTS "CreditWallet" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0,
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id)
);

CREATE TABLE IF NOT EXISTS "CreditTransaction" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  "relatedVideoId" TEXT,
  "relatedOrderId" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id)
);

CREATE TABLE IF NOT EXISTS "ShopItem" (
  id TEXT PRIMARY KEY,
  "gameItemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "creditCost" INTEGER NOT NULL,
  quantity INTEGER DEFAULT -1,
  category TEXT,
  description TEXT,
  active BOOLEAN DEFAULT 1,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RewardOrder" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "totalCreditCost" INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING',
  "exportBatchId" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id)
);

CREATE TABLE IF NOT EXISTS "RewardOrderItem" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "gameItemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "creditCost" INTEGER NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "RewardOrder"(id)
);

CREATE TABLE IF NOT EXISTS "ExportBatch" (
  id TEXT PRIMARY KEY,
  "exportedBy" TEXT NOT NULL,
  "exportedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  "fileName" TEXT,
  "orderCount" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "SpecialReward" (
  id TEXT PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "rewardType" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  active BOOLEAN DEFAULT 1,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"(id)
);

CREATE TABLE IF NOT EXISTS "SpecialRewardApplication" (
  id TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "videoId" TEXT,
  "followerCount" INTEGER,
  "profileUrl" TEXT,
  notes TEXT,
  "adminNotes" TEXT,
  status TEXT DEFAULT 'PENDING',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" DATETIME,
  UNIQUE("creatorId", "rewardId", "videoId"),
  FOREIGN KEY ("creatorId") REFERENCES "Creator"(id),
  FOREIGN KEY ("rewardId") REFERENCES "SpecialReward"(id),
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"(id)
);

CREATE TABLE IF NOT EXISTS "Announcement" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT 1,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CreatorAccount" (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "creatorCode" TEXT UNIQUE NOT NULL,
  "discordName" TEXT,
  email TEXT,
  used BOOLEAN DEFAULT 0,
  "usedAt" DATETIME,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Video_creatorId_idx" ON "Video"("creatorId");
CREATE INDEX IF NOT EXISTS "Video_campaignId_idx" ON "Video"("campaignId");
CREATE INDEX IF NOT EXISTS "MilestoneClaim_creatorId_idx" ON "MilestoneClaim"("creatorId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_creatorId_idx" ON "CreditTransaction"("creatorId");
CREATE INDEX IF NOT EXISTS "RewardOrder_creatorId_idx" ON "RewardOrder"("creatorId");
