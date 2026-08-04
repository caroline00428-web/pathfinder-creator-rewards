import { execSync } from "child_process";

console.log("Syncing Prisma schema with database...");

try {
  console.log("\n1. Running prisma db push to sync schema...");
  execSync("npx prisma db push --skip-generate --force-reset", {
    stdio: "inherit",
  });
  console.log("✅ Database synced");
} catch (err) {
  console.error("❌ Error:", err.message);
}
