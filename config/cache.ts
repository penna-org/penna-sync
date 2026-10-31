import { defineCacheConfig } from '@hazejs/core'

// 单实例部署：限流计数与令牌的 last_used_at 节流都在进程内存
export default defineCacheConfig(() => ({
  default: 'memory',
  prefix: 'penna-sync:',
  stores: {
    memory: { driver: 'memory' },
  },
}))
