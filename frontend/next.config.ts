import type { NextConfig } from "next";

const tailscaleIp = process.env.TAILSCALE_IP || "127.0.0.1";
const raspberrypiIP = process.env.RASPBERRY_PI_IP;

const nextConfig: any = {
  
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    /*
    // @ts-expect-error - Next.js 16 types might be missing this definition yet
    allowedDevOrigins: [
      "localhost:3000", 
      `${tailscaleIp}:3000`,
      `${raspberrypiIP}:3000`
    ],
    */
  },
};

export default nextConfig;