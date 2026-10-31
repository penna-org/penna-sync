import { config } from '@hazejs/core'
import { version } from '~/package.json'

/** 服务信息（无需令牌）：扩展据此识别自部署服务器 */
export class ServerController {
  show() {
    return {
      name: 'penna-sync',
      version,
      selfHosted: true,
      title: config<string>('sync.name', '自部署同步'),
    }
  }
}
