import { defineAuthConfig } from '@hazejs/core'
import { databaseTokenStore } from '@hazejs/orm'
import { ownerProvider } from '~/app/support/owner'
import { personalAccessTokens } from '~/database/schema/auth'

/**
 * 没有注册 / 登录：整个服务只有一个同步空间（「所有者」）。
 * 浏览器用访问密钥配对后拿到一枚设备令牌（token Guard），之后所有请求都带 `Authorization: Bearer <token>`。
 */
export default defineAuthConfig(() => ({
  default: 'token',
  guards: {
    token: {
      driver: 'token',
      provider: 'owner',
      store: databaseTokenStore(personalAccessTokens),
      prefix: 'ps_',
    },
  },
  providers: {
    owner: ownerProvider,
  },
}))
