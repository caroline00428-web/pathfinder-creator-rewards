/**
 * Galaxy Defense Creator Program — Google Apps Script
 *
 * Setup:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file
 * 3. Set your BOT_SECRET:
 *    In Apps Script editor, go to Project Settings (⚙️) → Script Properties → Add:
 *    Property: BOT_SECRET  |  Value: <same as Vercel BOT_SECRET env var>
 * 4. Click "Triggers" (⏰) → Add Trigger:
 *    Function: onFormSubmit
 *    Event: On form submit
 * 5. Save → Authorize → Done
 *
 * Columns in your Google Sheet:
 * A: Timestamp  B: Discord Username  C: Platform  D: Language  E: Followers  F: Email  G: Status  H: Username  I: Password  J: Code
 */

const API_URL = "https://creator-reward-platform.vercel.app/api/bot/activate";

function onFormSubmit(e) {
  try {
    const sheet = e.range.getSheet();
    const row = e.range.getRow();

    const discordName = sheet.getRange(row, 2).getValue(); // Column B: Discord Username
    const email = sheet.getRange(row, 6).getValue();        // Column F: Email address

    if (!email || !discordName) {
      sheet.getRange(row, 7).setValue("ERROR: Missing email or Discord name");
      return;
    }

    // Get API secret from Script Properties
    const botSecret = PropertiesService.getScriptProperties().getProperty("BOT_SECRET");
    if (!botSecret) {
      sheet.getRange(row, 7).setValue("ERROR: BOT_SECRET not configured");
      return;
    }

    // Call website API
    const options = {
      method: "POST",
      headers: { "Authorization": `Bearer ${botSecret}`, "Content-Type": "application/json" },
      payload: JSON.stringify({ discordName: discordName, email: email }),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(API_URL, options);
    const data = JSON.parse(response.getContentText());

    if (data.error) {
      const detail = data.step ? ` [${data.step}]` : "";
      const extra = data.detail ? `: ${data.detail}` : "";
      sheet.getRange(row, 7).setValue(`ERROR${detail}${extra}`);
      return;
    }

    // Write results to sheet columns H, I, J (for admin reference)
    sheet.getRange(row, 8).setValue(data.username);
    sheet.getRange(row, 9).setValue(data.password);
    sheet.getRange(row, 10).setValue(data.creatorCode);
    sheet.getRange(row, 11).setValue(data.alreadyClaimed ? "REMINDER" : "NEW");

    if (data.alreadyClaimed) {
      // Already had an account — send reminder email
      GmailApp.sendEmail(email,
        "Galaxy Defense Creator Account — Reminder",
        `Hi ${discordName},\n\n` +
        `You already have a Galaxy Defense Creator account. Here are your credentials:\n\n` +
        `Username: ${data.username}\nPassword: ${data.password}\nCreator Code: ${data.creatorCode}\n\n` +
        `Login: https://creator-reward-platform.vercel.app/login\nGuide: https://creator-reward-platform.vercel.app/guide\n\n` +
        `Questions? Ask @Hedy in our Discord: https://discord.gg/8tcRJ7wwDB`
      );
    } else {
      // New account — send welcome email
      GmailApp.sendEmail(email,
        "Galaxy Defense Creator Account — Welcome!",
        `Hi ${discordName},\n\n` +
        `Thank you for joining the Galaxy Defense Pathfinder Creator Program!\n\n` +
        `Your account is ready:\n\n` +
        `Username: ${data.username}\nPassword: ${data.password}\nCreator Code: ${data.creatorCode}\n\n` +
        `Login: https://creator-reward-platform.vercel.app/login\n` +
        `Starter Guide: https://creator-reward-platform.vercel.app/guide\n\n` +
        `How to earn rewards:\n` +
        `• Submit your first video with #galaxydefense #galaxydefensepathfinder\n` +
        `• Sync views to claim milestone rewards\n` +
        `• Apply for special bonuses (Registration, Participation, AI Comic etc.)\n` +
        `• Redeem points in the Reward Shop\n\n` +
        `Questions? Ask @Hedy in our Discord: https://discord.gg/8tcRJ7wwDB\n\n` +
        `Good luck and happy creating! 🎬`
      );
    }

    sheet.getRange(row, 7).setValue("SENT");
  } catch (e) {
    console.error("onFormSubmit error:", e);
  }
}

// Manual test function — run this once to verify setup
function testWithFirstRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const discordName = sheet.getRange(2, 2).getValue(); // Column B
  const email = sheet.getRange(2, 6).getValue();        // Column F
  if (!email || !discordName) {
    console.log("No data in row 2. Fill the sheet first.");
    return;
  }
  console.log(`Testing with: ${discordName} <${email}>`);
  // Simulated submit
  const fakeEvent = { range: { getRow: () => 2, getSheet: () => sheet } };
  onFormSubmit(fakeEvent);
}
