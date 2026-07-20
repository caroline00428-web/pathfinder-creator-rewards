import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable instrumentation hook for Turso DB initialization
  // @ts-ignore — property exists at runtime in Next.js 14+
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
