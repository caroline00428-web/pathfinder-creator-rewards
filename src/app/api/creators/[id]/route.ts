import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const creator = await db.creator.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, email: true, role: true, createdAt: true } },
      wallet: true,
      videos: {
        include: { campaign: true },
        orderBy: { submittedAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  return NextResponse.json(creator);
}
