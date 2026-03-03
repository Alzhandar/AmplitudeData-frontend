import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://localhost:8000";

    return [
      {
        source: "/backend/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
