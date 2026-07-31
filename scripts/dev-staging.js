#!/usr/bin/env node
/**
 * Local Staging Development Runner
 * Usage: node scripts/dev-staging.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const envStagingPath = path.join(__dirname, "..", ".env.staging");
const envLocalPath = path.join(__dirname, "..", ".env.local.staging");

if (!fs.existsSync(envStagingPath)) {
  console.error("❌ .env.staging not found!");
  console.error("   Please create .env.staging first (copy from .env.staging template)");
  process.exit(1);
}

console.log("🚀 Starting Next.js in Staging mode...");
console.log(`📋 Using: .env.staging`);
console.log("");

// Set NODE_ENV and load .env.staging for this process
process.env.NODE_ENV = "staging";

// Copy .env.staging to .env.local.staging for Next.js to pick up
// Note: Next.js will load .env.local which might conflict, so we inform user
console.log("⚠️  Tip: Make sure .env.local doesn't override staging settings");
console.log("");

// Load .env.staging into process.env manually
const envContent = fs.readFileSync(envStagingPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const [key, ...valueParts] = trimmed.split("=");
  const value = valueParts.join("=").replace(/^"(.*)"$/, "$1");

  if (key && value) {
    process.env[key] = value;
  }
});

console.log(`✅ Loaded ${Object.keys(process.env).filter(k => k.startsWith("TURSO_") || k === "NEXTAUTH_URL").length} staging variables`);
console.log("");

// Start Next.js
try {
  execSync("next dev", {
    stdio: "inherit",
    env: process.env,
  });
} catch (error) {
  console.error("Error starting dev server:", error.message);
  process.exit(1);
}
