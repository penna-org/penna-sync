import { defineMiddlewareConfig } from '@hazejs/core'

// 请求 ID（x-request-id）与访问日志由框架内置，无需注册
// 扩展只用 Bearer 令牌，不用 Cookie 会话，因此不启用 csrf
export default defineMiddlewareConfig({
  global: ['cors', 'secureHeaders', 'compress'],
  alias: {},
})
