const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function restoreSentEmails() {
  try {
    // Read CSV
    const csvPath = "C:\\Users\\Leocool\\Downloads\\Untitled form (Responses) - Form Responses 1.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim());
    console.log("Headers:", headers);

    // Find column indices
    const emailIdx = headers.indexOf("Email address");
    const discordIdx = headers.indexOf("Discord Username");
    const statusIdx = headers.indexOf("Column 1");
    const usernameIdx = headers.indexOf("Column 2");
    const passwordIdx = headers.indexOf("Column 3");
    const creatorCodeIdx = headers.indexOf("Column 4");

    console.log(`Email: ${emailIdx}, Discord: ${discordIdx}, Status: ${statusIdx}`);
    console.log(`Username: ${usernameIdx}, Password: ${passwordIdx}, CreatorCode: ${creatorCodeIdx}`);

    let restored = 0;
    let skipped = 0;
    let failed = 0;

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const status = values[statusIdx];

      // Only process SENT rows
      if (status !== "SENT") {
        skipped++;
        continue;
      }

      const email = values[emailIdx];
      const discordName = values[discordIdx];
      const username = values[usernameIdx];
      const password = values[passwordIdx];
      const creatorCode = values[creatorCodeIdx];

      if (!email || !username || !password) {
        console.log(`⏭️  Row ${i}: Missing required fields`);
        skipped++;
        continue;
      }

      try {
        // Check if user exists by username
        const existingUser = await db.user.findFirst({
          where: { username },
        });

        if (existingUser) {
          console.log(`⏭️  ${username}: User already exists`);
          skipped++;
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.user.create({
          data: {
            email,
            username,
            passwordHash,
            role: "CREATOR",
          },
        });

        // Create creator using raw SQL
        await db.$executeRawUnsafe(
          `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
           VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
          crypto.randomUUID(),
          user.id,
          discordName || username,
          creatorCode
        );

        console.log(`✅ ${username} (${email})`);
        restored++;
      } catch (err) {
        console.error(`❌ ${username}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Restored: ${restored}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

restoreSentEmails();
