import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [totalCreators, pendingTikTok, pendingOrders, totalVideos, activeCampaigns, recentVideos] =
    await Promise.all([
      db.creator.count(),
      db.video.count({ where: { platform: "TIKTOK", status: "PENDING" } }),
      db.rewardOrder.count({ where: { status: "PENDING" } }),
      db.video.count(),
      db.campaign.count({ where: { active: true } }),
      db.video.findMany({
        include: { creator: true, campaign: true },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
    ]);

  const totalCreditsResult = await db.creditTransaction.aggregate({
    where: { type: "MILESTONE_REWARD" },
    _sum: { amount: true },
  });

  const stats = [
    { label: "Total Creators", value: totalCreators, href: "/admin/creators" },
    { label: "Pending TikTok Reviews", value: pendingTikTok, href: "/admin/videos" },
    { label: "Pending Orders", value: pendingOrders, href: "/admin/orders" },
    { label: "Total Videos", value: totalVideos },
    { label: "Active Campaigns", value: activeCampaigns, href: "/admin/campaigns" },
    { label: "Credits Issued", value: totalCreditsResult._sum.amount ?? 0 },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="mb-6 relative rounded-2xl overflow-hidden h-32 bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/pathfinder-hero.jpg)", backgroundPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent" />
        <div className="relative z-10 flex items-center h-full px-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">Galaxy Defense</p>
            <h1 className="text-xl font-extrabold text-white">Pathfinder Program · Admin</h1>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Video Submissions</h3>
        {recentVideos.length === 0 ? (
          <p className="text-gray-500 text-sm">No videos submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-gray-500">Creator</th>
                  <th className="pb-2 font-medium text-gray-500">Platform</th>
                  <th className="pb-2 font-medium text-gray-500">Campaign</th>
                  <th className="pb-2 font-medium text-gray-500">Views</th>
                  <th className="pb-2 font-medium text-gray-500">Status</th>
                  <th className="pb-2 font-medium text-gray-500">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-2">{v.creator.displayName}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.platform === "YOUTUBE" ? "bg-red-100 text-red-700" : "bg-gray-900 text-white"
                      }`}>
                        {v.platform}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{v.campaign.name}</td>
                    <td className="py-2">{v.viewCount.toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        v.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(v.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
