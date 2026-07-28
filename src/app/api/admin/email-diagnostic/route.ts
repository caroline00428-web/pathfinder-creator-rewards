import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendRewardEmail } from "@/lib/send-reward-email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    console.log("[EMAIL DIAG] Starting email diagnostic...\n");

    // 1. Get PENDING special reward applications with their creators
    console.log("[1] Fetching PENDING special reward applications...");
    const pendingApps = await db.specialRewardApplication.findMany({
      where: { status: "PENDING" },
      include: {
        creator: { include: { user: { select: { email: true } } } },
        reward: { select: { name: true, diamonds: true } },
      },
      take: 5,
    });

    console.log(`Found ${pendingApps.length} pending applications\n`);

    const diagnostics = [];

    // 2. Check each application
    for (const app of pendingApps) {
      console.log(`[APP] ${app.creator.displayName}`);
      const diag: any = {
        applicationId: app.id,
        creator: app.creator.displayName,
        creatorCode: app.creator.creatorCode,
        email: app.creator.user?.email || "NO EMAIL",
        reward: app.reward.name,
        diamonds: app.reward.diamonds,
        status: "checking",
      };

      if (!app.creator.user?.email) {
        console.log(`  ❌ No email for creator`);
        diag.status = "no_email";
        diag.error = "Creator has no email address";
      } else {
        // Try to send test email
        console.log(`  📧 Attempting to send to ${app.creator.user.email}`);
        try {
          const result = await sendRewardEmail(app.creator.user.email, "SPECIAL", {
            diamonds: app.reward.diamonds,
            rewardName: app.reward.name,
          });

          if (result.success) {
            console.log(`  ✅ Email sent! Message ID: ${result.result?.messageId}`);
            diag.status = "success";
            diag.messageId = result.result?.messageId;
          } else {
            console.log(`  ❌ Email failed: ${result.error || result.reason}`);
            diag.status = "failed";
            diag.error = result.error || result.reason;
          }
        } catch (err: any) {
          console.log(`  ❌ Exception: ${err.message}`);
          diag.status = "exception";
          diag.error = err.message;
        }
      }

      diagnostics.push(diag);
    }

    console.log("\n[SUMMARY]");
    const success = diagnostics.filter((d) => d.status === "success").length;
    const failed = diagnostics.filter((d) => d.status === "failed").length;
    const noEmail = diagnostics.filter((d) => d.status === "no_email").length;

    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  No email: ${noEmail}`);

    return NextResponse.json({
      summary: {
        total: pendingApps.length,
        success,
        failed,
        noEmail,
      },
      diagnostics,
    });
  } catch (error: any) {
    console.error("[EMAIL DIAG] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
