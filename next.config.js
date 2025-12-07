/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'market-saas.obs.cn-north-4.myhuaweicloud.com',
      },
    ],
  },
  // 启用standalone输出模式，用于Docker部署
  output: 'standalone',
}
module.exports = {
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '127.0.0.1'],
  }

module.exports = nextConfig 