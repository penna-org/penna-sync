import type { HttpContext } from '@hazejs/core'
import { NotFoundException } from '@hazejs/core'

/** 设备 = 配对时签发的令牌：列出与吊销 */
export class TokenController {
  /** 设备列表（不含明文与摘要），并标出当前请求所用的设备 */
  async index(ctx: HttpContext) {
    const tokens = await ctx.auth.token().tokens().list((await ctx.auth.user())!)
    const currentId = (await ctx.auth.currentAccessToken())?.id
    return tokens.map(({ token: _hash, ...token }) => ({
      ...token,
      current: token.id === currentId,
    }))
  }

  async destroy(ctx: HttpContext) {
    if (!(await ctx.auth.token().tokens().revoke(ctx.param('id')!, (await ctx.auth.user())!)))
      throw new NotFoundException('设备不存在')
    return ctx.noContent()
  }
}
