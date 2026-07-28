import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Look up creator by userId (works for both CREATOR role and ADMIN testing)
  const creator = await db.creator.findFirst({
    where: { userId: session.user.id },
    include: {
      user: { select: { username: true, email: true } },
      wallet: true,
    },
  });

  if (!creator) {
    // Auto-create Creator record for admins testing creator features
    if (session.user.role === "ADMIN") {
      const newCreator = await db.creator.create({
        data: {
          userId: session.user.id,
          displayName: session.user.username || "Admin Creator",
          creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase(),
        },
        include: {
          user: { select: { username: true, email: true } },
          wallet: true,
        },
      });
      // Create wallet
      await db.creditWallet.create({ data: { creatorId: newCreator.id, balance: 0 } });
      return NextResponse.json(newCreator);
    }
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  return NextResponse.json(creator);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Look up creator by userId
    let creator = await db.creator.findFirst({
      where: { userId: session.user.id },
    });

    // Auto-create for admin testing
    if (!creator && session.user.role === "ADMIN") {
      creator = await db.creator.create({
        data: {
          userId: session.user.id,
          displayName: session.user.username || "Admin Creator",
          creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase(),
        },
      });
      await db.creditWallet.create({ data: { creatorId: creator.id, balance: 0 } });
    }

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const body = await req.json();
    const { playerId, youtubeChannelId } = body;

    // Handle YouTube channel ID update (not locked, can be updated anytime)
    // Only process if the key is present in the request body
    if (typeof youtubeChannelId === "string") {
      const cleaned = youtubeChannelId.trim();
      const updated = await db.creator.update({
        where: { id: creator.id },
        data: { youtubeChannelId: cleaned || null },
      });
      return NextResponse.json({
        youtubeChannelId: updated.youtubeChannelId,
      });
    }

    // Handle Player ID binding
    if (typeof playerId === "string" && playerId.trim().length > 0) {
      if (creator.playerIdLocked) {
        return NextResponse.json({ error: "Player ID is locked and cannot be changed" }, { status: 400 });
      }

      const existing = await db.creator.findFirst({
        where: { playerId: playerId.trim(), id: { not: creator.id } },
      });

      if (existing) {
        return NextResponse.json({ error: "This Player ID is already bound to another creator" }, { status: 409 });
      }

      const updated = await db.creator.update({
        where: { id: creator.id },
        data: {
          playerId: playerId.trim(),
          playerIdLocked: true,
        },
      });

      return NextResponse.json({
        playerId: updated.playerId,
        playerIdLocked: updated.playerIdLocked,
      });
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  } catch (error: any) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Update failed. Please try again." }, { status: 500 });
  }
}
