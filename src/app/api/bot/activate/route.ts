// POST: Called by Google Apps Script to claim a pre-generated account.
// Uses raw SQL to avoid Prisma client cache issues.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";

function getTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error("Turso not configured");
  return createClient({ url, authToken: token });
}

export async function GET() {
  try {
    const db = getTurso();
    const total = await db.execute("SELECT COUNT(*) as c FROM CreatorAccount");
    const unused = await db.execute("SELECT COUNT(*) as c FROM CreatorAccount WHERE used = 0");
    return NextResponse.json({ ok: true, total: Number(total.rows[0][0]), unused: Number(unused.rows[0][0]), botSecretSet: !!process.env.BOT_SECRET });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message?.slice(0, 80) });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.BOT_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { discordName, email } = body;
  if (!discordName || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const db = getTurso();

    // Check duplicate — read from User table for accurate credentials
    const dup = await db.execute({ sql: "SELECT u.username, ca.password, ca.creatorCode FROM User u JOIN CreatorAccount ca ON ca.email = u.email WHERE u.email = ? AND ca.used = 1 LIMIT 1", args: [email] });
    if (dup.rows.length > 0) {
      // Update username to Discord-based name if it's still the old random format
      const oldUser = String(dup.rows[0][0]);
      const pw = String(dup.rows[0][1]);
      const code = String(dup.rows[0][2]);
      const cleanD = discordName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
      if (cleanD && oldUser.startsWith("GDP_")) {
        const newName = `${cleanD}_${pw.slice(0, 4)}`;
        await db.execute({ sql: "UPDATE User SET username = ? WHERE email = ?", args: [newName, email] });
        await db.execute({ sql: "UPDATE CreatorAccount SET username = ? WHERE email = ?", args: [newName, email] });
        return NextResponse.json({ username: newName, password: pw, creatorCode: code, alreadyClaimed: true });
      }
      return NextResponse.json({ username: oldUser, password: pw, creatorCode: code, alreadyClaimed: true });
    }

    // Find unused account
    const avail = await db.execute("SELECT id, username, password, passwordHash, creatorCode FROM CreatorAccount WHERE used = 0 ORDER BY createdAt ASC LIMIT 1");
    if (avail.rows.length === 0) {
      return NextResponse.json({ error: "No accounts available" }, { status: 503 });
    }
    const acc = avail.rows[0];
    const accId = String(acc[0]);
    const username = String(acc[1]);
    const password = String(acc[2]);
    const passwordHash = String(acc[3]);
    const creatorCode = String(acc[4]);

    // Create User + Creator FIRST, then mark as used
    const cleanName = discordName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    const suffix = password.slice(0, 4);
    const niceName = cleanName ? `${cleanName}_${suffix}` : username;
    const niceCode = `GDP_${cleanName.toUpperCase()}_${suffix}`;

    const userId = `u_${accId}`;
    await db.execute({ sql: "INSERT INTO User (id, email, username, passwordHash, role) VALUES (?, ?, ?, ?, ?)", args: [userId, email, niceName, passwordHash, "CREATOR"] });
    await db.execute({ sql: "INSERT INTO Creator (id, userId, displayName, creatorCode) VALUES (?, ?, ?, ?)", args: [`c_${accId}`, userId, discordName.slice(0, 50), niceCode] });
    await db.execute({ sql: "INSERT INTO CreditWallet (id, creatorId, balance) VALUES (?, ?, 0)", args: [`w_${accId}`, `c_${accId}`] });

    // Mark as used ONLY after User creation succeeds
    await db.execute({ sql: "UPDATE CreatorAccount SET used = 1, usedAt = ?, discordName = ?, email = ?, username = ?, password = ? WHERE id = ?", args: [new Date().toISOString(), discordName, email, niceName, password, accId] });

    return NextResponse.json({ username: niceName, password, creatorCode: niceCode, alreadyClaimed: false });
  } catch (e: any) {
    console.error("Activate error:", e.message);
    return NextResponse.json({ error: "Activation failed. Please try again." }, { status: 500 });
  }
}
