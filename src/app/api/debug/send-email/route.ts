import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendRewardEmail } from "@/lib/send-reward-email";

// 测试邮件发送 — 仅 ADMIN 可用
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { to, type } = await req.json();
  if (!to || !type) {
    return NextResponse.json({ error: "Missing to or type" }, { status: 400 });
  }

  try {
    console.log("[Test] Sending email to:", to, "type:", type);
    console.log("[Test] API Key exists:", !!process.env.RESEND_API_KEY);

    const result = await sendRewardEmail(to, type, {
      diamonds: 200,
      rewardName: "Test Reward",
      views: 1000,
      items: ["Test Item"],
      code: "TEST123",
    });

    console.log("[Test] Email sent result:", result);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("[Test] Email failed:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
