import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendRewardEmail } from "@/lib/send-reward-email";

// Admin-only endpoint to test sending email to a specific creator
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { creatorEmail, type = "SPECIAL", diamonds = 100, rewardName = "Test Reward" } = await req.json();

  if (!creatorEmail) {
    return NextResponse.json({ error: "creatorEmail is required" }, { status: 400 });
  }

  try {
    console.log(`[Admin Test] Attempting to send ${type} email to ${creatorEmail}`);

    const result = await sendRewardEmail(creatorEmail, type, {
      diamonds,
      rewardName,
      code: "TEST123",
      items: ["Test Item"],
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || result.reason,
        email: creatorEmail
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${creatorEmail}`,
      messageId: result.result?.messageId,
      email: creatorEmail,
      type,
    });
  } catch (error: any) {
    console.error(`[Admin Test] Error:`, error);
    return NextResponse.json({
      success: false,
      error: error.message,
      email: creatorEmail,
    }, { status: 500 });
  }
}
