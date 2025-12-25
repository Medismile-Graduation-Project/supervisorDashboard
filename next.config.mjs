/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // إعدادات إضافية
  reactStrictMode: true,
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
