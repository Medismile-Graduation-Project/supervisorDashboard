/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // إعدادات إضافية
  reactStrictMode: true,
  
  // إصلاح مشاكل تحميل الـ chunks
  webpack: (config, { isServer }) => {
    // إصلاح مشاكل تحميل الـ chunks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // إصلاح مشكلة favicon
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
