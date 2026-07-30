const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const nodemailer = require("nodemailer");

const db = new PrismaClient();

async function sendEmail(email, username, password, creatorCode, discord) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const text = `Welcome to the Galaxy Defense Creator Program!

Your account has been successfully created. Here is your login information:

Discord Username: ${discord}
Username: ${username}
Password: ${password}
Creator Code: ${creatorCode}

Login URL: https://creator-reward-platform.vercel.app/login

Please keep your login information safe. If you have any questions, please contact us.

Galaxy Defense Creator Program`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "🎮 Galaxy Defense Creator Account - Login Information",
    text,
  });
}

async function create() {
  try {
    const accounts = JSON.parse(fs.readFileSync("generated_accounts.json", "utf-8"));

    console.log(`Creating ${accounts.length} accounts and sending emails...\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const acc of accounts) {
      try {
        // Check if email already has user
        const existing = await db.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE email = ?`,
          acc.email
        );

        if (existing && existing.length > 0) {
          console.log(`⏭️  ${acc.email}: Already has user`);
          skipped++;
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(acc.password, 10);

        // Create user
        const userId = crypto.randomUUID();
        await db.$executeRawUnsafe(
          `INSERT INTO "User" (id, email, username, passwordHash, role, createdAt)
           VALUES (?, ?, ?, ?, 'CREATOR', datetime('now'))`,
          userId,
          acc.email,
          acc.username,
          passwordHash
        );

        // Create creator
        await db.$executeRawUnsafe(
          `INSERT INTO "Creator" (id, userId, displayName, creatorCode, status, createdAt)
           VALUES (?, ?, ?, ?, 'ACTIVE', datetime('now'))`,
          crypto.randomUUID(),
          userId,
          acc.discord,
          acc.creatorCode
        );

        // Send email
        try {
          await sendEmail(acc.email, acc.username, acc.password, acc.creatorCode, acc.discord);
          console.log(`✅ ${acc.email}`);
        } catch (emailErr) {
          console.log(`✅ ${acc.email} (created, email failed)`);
        }

        created++;
      } catch (err) {
        console.error(`❌ ${acc.email}: ${err.message}`);
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

create();
