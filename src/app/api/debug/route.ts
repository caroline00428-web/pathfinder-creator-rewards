import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Protected: only accessible with debug secret or in development
  const debugSecret = process.env.DEBUG_SECRET;
  const providedSecret = req.nextUrl.searchParams.get("secret");

  if (debugSecret && providedSecret !== debugSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If no DEBUG_SECRET is set, only allow in non-production
  if (!debugSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  const result: any = { timestamp: new Date().toISOString() };

  try {
    const { db } = await import("@/lib/db");
    const userCount = await (db as any).user.count();
    result.ok = true;
    result.userCount = userCount;
  } catch (e: any) {
    result.ok = false;
    result.error = e.message?.slice(0, 120);
  }

  return NextResponse.json(result);
}
