import { defineProvider } from '@hazejs/core'
import { DocumentService } from '~/app/service/DocumentService'
import { SecretService } from '~/app/service/SecretService'
import { SettingsService } from '~/app/service/SettingsService'

export default defineProvider({
  register(container) {
    container.singleton(SecretService)
    container.singleton(SettingsService)
    container.singleton(DocumentService)
  },
  boot(app) {
    // 没有设置 SYNC_SECRET 时首次启动生成访问密钥并打印出来
    app.container.make(SecretService).ensure(app)
  },
})
