import type { NextConfig } from "next";
import { config } from "./src/lib/config";
const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // async rewrites() {
  //   // Development: proxy to local backend


  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${config.api.baseUrl}/:path*`,
  //     }
  //   ];
  // },
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
