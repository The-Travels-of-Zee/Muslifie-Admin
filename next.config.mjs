/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  // Multiple ways to disable ESLint
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // This tells ESLint to ignore all directories
  },
  // Alternative: disable type checking too
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  // Add these for better production performance
  swcMinify: true,
  images: {
    domains: ['localhost'], // Add your image domains here
  },
  // Ensure proper API handling
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
};

export default nextConfig;