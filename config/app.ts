import { defineConfig, env } from '@hazejs/core'

// 读取环境变量时使用函数形式，确保在 .env 加载之后求值
export default defineConfig(() => ({
  name: env('APP_NAME', 'penna-sync'),
  // 位于 Nginx / Caddy 等反向代理之后时设为 true（或代理层数），限流才能拿到真实客户端 IP
  trustProxy: env('TRUST_PROXY', false),
}))
