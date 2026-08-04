import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 403 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      creatorId: session.user.creatorId, // ← 这个是关键！
    },
    message: "如果 creatorId 是 undefined，那就是问题所在"
  });
}
