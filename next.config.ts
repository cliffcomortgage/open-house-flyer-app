import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "**.simplyrets.com" },
      { protocol: "https", hostname: "**.idx.com" },
      { protocol: "https", hostname: "photos.zillowstatic.com" },
    ],
  },
  serverExternalPackages: ["puppeteer", "puppeteer-core", "sharp"],
};

export default nextConfig;
