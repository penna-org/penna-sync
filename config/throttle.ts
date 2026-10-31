import { defineThrottleConfig } from '@hazejs/core'

// 单实例部署，限流计数放在进程内存
export default defineThrottleConfig(() => ({
  store: 'memory',
  limiters: {
    api: { max: 120, window: '1m' },
  },
}))
