import { defineCorsConfig, env } from '@hazejs/core'

// 扩展对服务器地址有主机权限时不受 CORS 限制；这里允许没授权时也能直接调用
// CORS_ORIGIN 为逗号分隔的来源列表，默认允许任意来源（只用 Bearer 令牌，不携带 Cookie）
export default defineCorsConfig(() => {
  const origin = env('CORS_ORIGIN', '*')
  return {
    origin: origin === '*'
      ? '*'
      : origin.split(',').map(item => item.trim()),
    allowHeaders: ['content-type', 'authorization'],
  }
})
