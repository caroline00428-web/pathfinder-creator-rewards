import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const creators = await db.creator.findMany({
    include: {
      user: { select: { username: true, email: true } },
      wallet: { select: { balance: true } },
      _count: { select: { videos: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(creators);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, email, password, displayName, creatorCode } = await req.json();

  if (!username || !email || !password || !displayName || !creatorCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
  }

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username, email, passwordHash, role: "CREATOR" },
    });

    const creator = await tx.creator.create({
      data: { userId: user.id, displayName, creatorCode },
    });

    await tx.creditWallet.create({
      data: { creatorId: creator.id },
    });

    return { user, creator };
  });

  return NextResponse.json({
    id: result.creator.id,
    username: result.user.username,
    displayName: result.creator.displayName,
    creatorCode: result.creator.creatorCode,
  }, { status: 201 });
}
