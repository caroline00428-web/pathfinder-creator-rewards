import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const announcements = await db.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { title, content } = await req.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  const announcement = await db.announcement.create({ data: { title, content } });
  return NextResponse.json(announcement, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  // Soft delete: set inactive instead of physically deleting
  await db.announcement.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
