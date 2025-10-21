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
  // 关闭ESLint检查
  eslint: {
    // 在生产构建期间忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // 启用standalone输出模式，用于Docker部署
  output: 'standalone',
}
module.exports = {
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '127.0.0.1'],
  }

module.exports = nextConfig 