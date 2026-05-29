import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All backend proxying is handled by src/app/api/ routes.
  // BACKEND_BASE_URL is read server-side by those routes and never exposed to the browser.
};

export default nextConfig;
