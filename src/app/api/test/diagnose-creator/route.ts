import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { creatorCode } = await req.json();

    if (!creatorCode) {
      return NextResponse.json({ error: "Missing creatorCode" }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { creatorCode },
      include: {
        wallet: true,
        videos: {
          include: {
            claims: {
              include: { milestone: true },
            },
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const transactions = await db.creditTransaction.findMany({
      where: { creatorId: creator.id },
    });

    return NextResponse.json({
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        creatorCode: creator.creatorCode,
        rewardScheme: creator.rewardScheme,
        wallet: creator.wallet,
      },
      videos: creator.videos.map((v) => ({
        id: v.id,
        title: v.title,
        platform: v.platform,
        viewCount: v.viewCount,
        status: v.status,
        claims: v.claims.map((c) => ({
          milestoneId: c.milestoneId,
          creditsAwarded: c.creditsAwarded,
          viewThreshold: c.milestone.viewThreshold,
        })),
      })),
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
