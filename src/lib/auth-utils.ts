import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Get or auto-create creator. Returns creator object or null.
export async function getOrCreateCreator() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  let creator = await db.creator.findFirst({ where: { userId: session.user.id } });
  if (!creator && session.user.role === "ADMIN") {
    creator = await db.creator.create({
      data: {
        userId: session.user.id,
        displayName: session.user.username || "Admin Creator",
        creatorCode: "ADMIN" + session.user.id.slice(-4).toUpperCase(),
      },
    });
    await db.creditWallet.create({ data: { creatorId: creator.id, balance: 0 } }).catch(() => {});
  }
  return creator;
}
