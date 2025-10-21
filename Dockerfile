# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 设置npm使用阿里云镜像
RUN npm config set registry https://registry.npmmirror.com

# 首先复制依赖文件，提高缓存效率
COPY package*.json ./

# 使用 npm ci 而非 npm install 确保一致性，并清理缓存
RUN npm ci && npm cache clean --force

# 复制应用代码
COPY . .

# 设置生产环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建应用
RUN npm run build

# 运行阶段
FROM node:22-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# 添加非 root 用户以提高安全性
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物，设置正确的所有权
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 切换到非特权用户
USER nextjs

# 配置健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]