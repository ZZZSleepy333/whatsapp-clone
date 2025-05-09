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

  webSocketServer: {
    path: "/api/socket",
  },
};

module.exports = nextConfig;
