import { NextResponse } from "next/server";

export async function GET() {
  const result: any = {
    turso: !!process.env.TURSO_DATABASE_URL,
    node: process.version,
  };

  // Test if adapter can be loaded
  try {
    const mod = require("@prisma/adapter-libsql");
    result.adapterExports = Object.keys(mod);
    result.adapterLoaded = true;
  } catch (e: any) {
    result.adapterLoaded = false;
    result.adapterError = e.message;
  }

  // Test DB connection
  try {
    const { db } = await import("@/lib/db");
    const userCount = await (db as any).user.count();
    result.dbOk = true;
    result.userCount = userCount;
    result.adminExists = !!(await (db as any).user.findFirst({ where: { username: "admin" } }));
  } catch (e: any) {
    result.dbOk = false;
    result.dbError = e.message;
  }

  return NextResponse.json(result);
}
