/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cs.copart.com',
      },
      {
        protocol: 'https',
        hostname: '*.copart.com',
      },
      {
        protocol: 'https',
        hostname: 'www.iaai.com',
      },
      {
        protocol: 'https',
        hostname: 'images.iaai.com',
      },
      {
        protocol: 'https',
        hostname: 'vis.iaai.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
