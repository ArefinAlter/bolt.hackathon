/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  swcMinify: false,
  images: {
    domains: ['images.pexels.com', 'api.dicebear.com'],
  },
}

module.exports = withPWA(nextConfig);