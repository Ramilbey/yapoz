import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "bcryptjs", "unpdf"],
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
