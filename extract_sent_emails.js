const fs = require("fs");
const path = require("path");

try {
  const csvPath = path.resolve(process.env.HOME || process.env.USERPROFILE, "Downloads", "Untitled form (Responses) - Form Responses 1.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  const headers = lines[0].split(",").map((h) => h.trim());
  const emailIdx = headers.indexOf("Email address");
  const discordIdx = headers.indexOf("Discord Username");
  const statusIdx = headers.indexOf("Column 1");
  const usernameIdx = headers.indexOf("Column 2");
  const passwordIdx = headers.indexOf("Column 3");
  const creatorCodeIdx = headers.indexOf("Column 4");

  const sentRecords = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const status = values[statusIdx];
    const email = values[emailIdx];
    const discord = values[discordIdx];
    const username = values[usernameIdx];
    const password = values[passwordIdx];
    const creatorCode = values[creatorCodeIdx];

    if (status === "SENT" && email && username && password) {
      sentRecords.push({
        email,
        discord,
        username,
        password,
        creatorCode,
      });
    }
  }

  console.log(`Total SENT records: ${sentRecords.length}\n`);
  console.log("Email list:");
  sentRecords.forEach(r => {
    console.log(`${r.email} | ${r.username} | ${r.discord}`);
  });

  // Save to file
  fs.writeFileSync("sent_records.json", JSON.stringify(sentRecords, null, 2));
  console.log(`\n✅ Saved ${sentRecords.length} records to sent_records.json`);
} catch (err) {
  console.error("Error:", err.message);
}
