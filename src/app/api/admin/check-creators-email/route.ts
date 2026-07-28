import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get all creators with their emails
    const creators = await db.creator.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { displayName: "asc" },
    });

    const total = creators.length;
    const withEmail = creators.filter((c) => c.user?.email).length;
    const withoutEmail = total - withEmail;

    const creatorsList = creators.map((c) => ({
      displayName: c.displayName,
      creatorCode: c.creatorCode,
      email: c.user?.email || "NO EMAIL",
    }));

    return NextResponse.json({
      total,
      withEmail,
      withoutEmail,
      coverage: total > 0 ? ((withEmail / total) * 100).toFixed(1) : 0,
      creators: creatorsList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
