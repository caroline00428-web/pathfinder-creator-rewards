import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { username },
      include: { creator: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" });
    }

    console.log("User found:", username);
    console.log("Password hash:", user.passwordHash.substring(0, 20) + "...");

    // Test bcrypt comparison
    const isValid = await bcrypt.compare(password, user.passwordHash);

    console.log("Password comparison result:", isValid);

    return NextResponse.json({
      found: true,
      username: user.username,
      email: user.email,
      hasCreator: !!user.creator,
      passwordValid: isValid,
      passwordLength: password.length,
      hashLength: user.passwordHash.length,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
