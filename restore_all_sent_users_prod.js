const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const db = new PrismaClient();

async function restore() {
  try {
    // Read CSV - use path.resolve
    const csvPath = path.resolve(process.env.HOME || process.env.USERPROFILE, "Downloads", "Untitled form (Responses) - Form Responses 1.csv");
    console.log("CSV path:", csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found at:", csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim());

    // Find column indices
    const emailIdx = headers.indexOf("Email address");
    const discordIdx = headers.indexOf("Discord Username");
    const statusIdx = headers.indexOf("Column 1");
    const usernameIdx = headers.indexOf("Column 2");
    const passwordIdx = headers.indexOf("Column 3");
    const creatorCodeIdx = headers.indexOf("Column 4");

    console.log(`Indices - Email: ${emailIdx}, Discord: ${discordIdx}, Status: ${statusIdx}`);
    console.log(`Username: ${usernameIdx}, Password: ${passwordIdx}, CreatorCode: ${creatorCodeIdx}\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Process rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const status = values[statusIdx];
      const email = values[emailIdx];
      const discordName = values[discordIdx];
      const username = values[usernameIdx];
      const password = values[passwordIdx];
      const creatorCode = values[creatorCodeIdx];

      // Only process SENT rows or empty status with all fields
      if (status && status !== "SENT") {
        continue;
      }

      if (!email || !username || !password) {
        continue;
      }

      try {
        // Check if user already exists
        const existing = await db.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE username = ?`,
          username
        );

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const userId = crypto.randomUUID();
        await db.$executeRawUnsafe(
          `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
           VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
          userId,
          email,
          username,
          passwordHash
        );

        // Create creator
        await db.$executeRawUnsafe(
          `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
           VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
          crypto.randomUUID(),
          userId,
          discordName || username,
          creatorCode
        );

        console.log(`✅ ${username}`);
        created++;
      } catch (err) {
        console.error(`❌ ${username}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await db.$disconnect();
  }
}

restore();
