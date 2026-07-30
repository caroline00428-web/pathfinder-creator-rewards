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

  const emptyStatusRecords = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const status = values[statusIdx];
    const email = values[emailIdx];
    const discord = values[discordIdx];

    // Empty status (not SENT, not ERROR, not filled in)
    if ((status === "" || status === undefined || !status) && email && discord) {
      emptyStatusRecords.push({
        rowNum: i + 1,
        email,
        discord,
      });
    }
  }

  console.log(`\nTotal empty-status records: ${emptyStatusRecords.length}\n`);
  
  if (emptyStatusRecords.length > 0) {
    console.log("Empty status records (need to send emails):");
    emptyStatusRecords.forEach((r, idx) => {
      console.log(`${idx + 1}. Row ${r.rowNum}: ${r.email} | ${r.discord}`);
    });

    fs.writeFileSync("empty_status_records.json", JSON.stringify(emptyStatusRecords, null, 2));
    console.log(`\n✅ Saved ${emptyStatusRecords.length} records to empty_status_records.json`);
  }
} catch (err) {
  console.error("Error:", err.message);
}
