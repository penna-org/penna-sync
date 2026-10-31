import type { HttpContext } from '@hazejs/core'
import { inject, validate } from '@hazejs/core'
import { SettingsService } from '~/app/service/SettingsService'
import { SaveSettingsSchema } from '~/app/validate/settings'

/** 扩展配置同步：GET 拉取、PUT 推送（带 baseVersion 做冲突检测）、DELETE 清空 */
export class SettingsController {
  private settings = inject(SettingsService)

  show() {
    return this.settings.get()
  }

  async update(ctx: HttpContext) {
    const input = await validate(SaveSettingsSchema, await ctx.body())
    return this.settings.save({
      ...input,
      device: (await ctx.auth.currentAccessToken())?.name,
    })
  }

  async destroy(ctx: HttpContext) {
    await this.settings.clear()
    return ctx.noContent()
  }
}
