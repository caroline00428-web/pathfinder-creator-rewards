import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can create accounts
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username, email, password, displayName, creatorCode } = await req.json();

    if (!username || !email || !password || !displayName || !creatorCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Input validation
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: "Username must be 3-30 characters" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username must only contain letters, numbers, and underscores" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one letter and one number" }, { status: 400 });
    }
    if (displayName.length > 50) {
      return NextResponse.json({ error: "Display name too long" }, { status: 400 });
    }
    if (creatorCode.length > 30) {
      return NextResponse.json({ error: "Creator code too long" }, { status: 400 });
    }

    // Check existing
    const existingUser = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    const existingCreator = await db.creator.findUnique({
      where: { creatorCode },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: "Creator code already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role: "CREATOR",
        },
      });

      const creator = await tx.creator.create({
        data: {
          userId: user.id,
          displayName,
          creatorCode,
        },
      });

      // Create empty wallet
      await tx.creditWallet.create({
        data: { creatorId: creator.id },
      });

      return { user, creator };
    });

    return NextResponse.json(
      {
        id: result.creator.id,
        username: result.user.username,
        displayName: result.creator.displayName,
        creatorCode: result.creator.creatorCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
