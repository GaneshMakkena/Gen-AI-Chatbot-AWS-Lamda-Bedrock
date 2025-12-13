/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for S3/CloudFront deployment
  output: 'export',

  // Allow images from data URLs and external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },

  // Environment variables available on client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Enable React strict mode
  reactStrictMode: true,

  // NOTE: Security headers should be configured in CloudFront ResponseHeadersPolicy
  // since they don't apply in 'output: export' mode.
};

export default nextConfig;
