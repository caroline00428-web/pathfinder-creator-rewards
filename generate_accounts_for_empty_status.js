const fs = require("fs");
const crypto = require("crypto");

const emptyStatusRecords = JSON.parse(fs.readFileSync("empty_status_records.json", "utf-8"));

console.log(`Generating accounts for ${emptyStatusRecords.length} people\n`);

const accounts = emptyStatusRecords.map((record, idx) => {
  // Generate username from discord name + random suffix
  const discordClean = record.discord
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 15);
  
  // Generate a 8-character password
  const password = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return {
    email: record.email,
    discord: record.discord,
    username: `${discordClean}_${password.substring(0, 4)}`,
    password: password,
    creatorCode: `GDP_${discordClean.toUpperCase()}_${password.substring(0, 4)}`,
  };
});

// Print for preview
console.log("Generated accounts:\n");
accounts.forEach((acc, idx) => {
  console.log(`${idx + 1}. ${acc.email}`);
  console.log(`   Username: ${acc.username}`);
  console.log(`   Password: ${acc.password}`);
  console.log(`   Creator Code: ${acc.creatorCode}\n`);
});

// Save to file
fs.writeFileSync("generated_accounts.json", JSON.stringify(accounts, null, 2));
console.log(`✅ Saved ${accounts.length} accounts to generated_accounts.json`);
