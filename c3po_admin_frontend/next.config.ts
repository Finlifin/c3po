import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Allow dev assets (_next/*) to be requested from remote host 10.70.141.134.
   * Next.js future versions require explicit allowedDevOrigins.
   */
  experimental: {
    allowedDevOrigins: ["http://10.70.141.134:3000", "http://10.70.141.134:8080", "http://10.70.141.134:5000"],
  },
};

export default nextConfig;
