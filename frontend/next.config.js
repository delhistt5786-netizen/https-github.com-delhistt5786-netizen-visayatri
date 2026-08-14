/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Silence build warnings for dynamic route usage
  experimental: {},
  // face-api.js / @tensorflow/tfjs-core probe for Node-only modules (fs, encoding)
  // that are never actually used in the browser bundle — stub them out.
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, encoding: false };
    return config;
  },
}
module.exports = nextConfig
