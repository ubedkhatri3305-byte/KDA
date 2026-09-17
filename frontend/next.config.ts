import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    let backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://kda-km8t.onrender.com/api/v1'
        : 'http://127.0.0.1:5000/api/v1');

    backendUrl = backendUrl.trim().replace(/\/+$/, '');
    if (backendUrl.includes('kda-backend.onrender.com')) {
      backendUrl = backendUrl.replace('kda-backend.onrender.com', 'kda-km8t.onrender.com');
    }
    if (
      backendUrl.startsWith('http://') &&
      !backendUrl.includes('127.0.0.1') &&
      !backendUrl.includes('localhost') &&
      !backendUrl.match(/^http:\/\/(192\.168\.|10\.|172\.)/)
    ) {
      backendUrl = backendUrl.replace(/^http:\/\//i, 'https://');
    }
    if (!backendUrl.endsWith('/api/v1')) {
      backendUrl = `${backendUrl}/api/v1`;
    }

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
