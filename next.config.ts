import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client"],
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  env: {
    DATABASE_URL: "file:./dummy.db",
  },
};

export default nextConfig;
