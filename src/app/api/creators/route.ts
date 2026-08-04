import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
      videos: { select: { viewCount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 计算每个 creator 的总浏览量
  const creatorsWithViews = creators.map((creator) => {
    const totalViews = creator.videos.reduce((sum, v) => sum + v.viewCount, 0);
    const { videos, ...rest } = creator;
    return { ...rest, totalViews };
  });

  return NextResponse.json(creatorsWithViews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { username, email, password, displayName, creatorCode } = await req.json();

  if (!username || !email || !password || !displayName || !creatorCode) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username, email, passwordHash, role: "CREATOR" },
    });

    const creator = await tx.creator.create({
      data: { userId: user.id, displayName, creatorCode, status: "ACTIVE" },
      include: {
        user: { select: { username: true, email: true } },
        wallet: { select: { balance: true } },
        _count: { select: { videos: true, orders: true } },
        videos: { select: { viewCount: true } },
      },
    });

    await tx.creditWallet.create({
      data: { creatorId: creator.id },
    });

    return creator;
  });

  // 计算总浏览量
  const totalViews = result.videos.reduce((sum, v) => sum + v.viewCount, 0);
  const { videos, ...rest } = result;
  return NextResponse.json({ ...rest, totalViews }, { status: 201 });
}
