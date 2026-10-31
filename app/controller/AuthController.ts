import type { HttpContext } from '@hazejs/core'
import { inject, UnauthorizedException, validate } from '@hazejs/core'
import { SecretService } from '~/app/service/SecretService'
import { owner } from '~/app/support/owner'
import { PairSchema } from '~/app/validate/auth'

/**
 * 没有账号：浏览器用访问密钥配对，换取一枚以设备命名的长期令牌。
 * 之后的同步请求都用这枚令牌；在扩展「设备」页移除即吊销。
 */
export class AuthController {
  private secrets = inject(SecretService)

  async pair(ctx: HttpContext) {
    const { secret, device } = await validate(PairSchema, await ctx.body())
    if (!this.secrets.verify(secret))
      throw new UnauthorizedException('访问密钥不正确')
    const user = owner()
    const issued = await ctx.auth.token().createToken(user, device, { abilities: ['sync:*'] })
    const { token: _hash, ...accessToken } = issued.accessToken
    return ctx.created({
      token: issued.plainTextToken,
      accessToken,
      user,
    })
  }

  me(ctx: HttpContext) {
    return ctx.auth.user()
  }

  /** 吊销当前设备令牌 */
  async logout(ctx: HttpContext) {
    await ctx.auth.logout()
    return ctx.noContent()
  }
}
