import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreatorNav from "@/components/creator/CreatorNav";
import SocialSidebar from "@/components/SocialSidebar";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "CREATOR" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreatorNav />
      <SocialSidebar />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
