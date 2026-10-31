# syntax=docker/dockerfile:1

# 构建：安装依赖并用 hazejs 打包（业务代码与纯 JS 依赖打进 dist，SQLite 驱动追踪复制到 dist/node_modules）
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 运行：只带 dist 与启动脚本，不需要 pnpm 和源码
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data \
    DATABASE_URL=file:/data/penna-sync.db
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
# 启动脚本会补齐 APP_KEY / 访问密钥、执行迁移，再启动服务
CMD ["node", "scripts/start.mjs"]
