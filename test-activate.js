// Quick test script for bot/activate API
// Reads BOT_SECRET from project .env.local
const path = require("path");
const fs = require("fs");

// Parse .env.local
const envPath = path.join(__dirname, ".env.local");
if (!fs.existsSync(envPath)) { console.log(".env.local not found"); process.exit(1); }
const envContent = fs.readFileSync(envPath, "utf8");
const botLine = envContent.split("\n").find(l => l.startsWith("BOT_SECRET="));
if (!botLine) { console.log("BOT_SECRET not in .env.local — add it first"); process.exit(1); }
const secret = botLine.split("=")[1].trim().replace(/^"|"$/g, "");

fetch("https://creator-reward-platform.vercel.app/api/bot/activate", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
  body: JSON.stringify({ discordName: "TestDebug", email: "caroline00428@gmail.com" }),
}).then(r => r.text()).then(d => console.log(d)).catch(e => console.log("Fetch error:", e.message));
