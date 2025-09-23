import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for Cloudflare Pages compatibility
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

export default withPWA(nextConfig);
