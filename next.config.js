/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
  files: {
    domains: ["res.cloudinary.com"],
  },
  // Thêm cấu hình cho WebSocket
  webSocketServer: {
    path: '/api/socket',
  },
};

module.exports = nextConfig;
