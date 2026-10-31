import type { Application } from '@hazejs/core'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const FILE = 'sync-secret'

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

/**
 * 访问密钥：新浏览器凭它配对，换取自己的设备令牌。
 * 优先读 SYNC_SECRET；没设置时用数据目录里的 sync-secret，首次启动自动生成。
 */
export class SecretService {
  private secret?: string

  /** 启动时调用：确保密钥存在，首次生成时打印到日志 */
  ensure(app: Application): void {
    const dir = resolve(app.config.get<string>('sync.dataDir', './data'))
    const file = join(dir, FILE)
    const fromEnv = app.config.get<string>('sync.secret', '').trim()
    const fromFile = existsSync(file)
      ? readFileSync(file, 'utf8').trim()
      : ''
    this.secret = fromEnv || fromFile
    if (this.secret)
      return
    const generated = randomBytes(18).toString('base64url')
    mkdirSync(dir, { recursive: true })
    writeFileSync(file, `${generated}\n`, { mode: 0o600 })
    this.secret = generated
    app.logger.info([
      '',
      '  已生成访问密钥，在扩展「设置 → 账号 → 自部署服务器」中填写：',
      '',
      `      ${generated}`,
      '',
      `  密钥保存在 ${file}；也可以用环境变量 SYNC_SECRET 指定`,
      '',
    ].join('\n'))
  }

  /** 常量时间比较，避免按响应时间猜密钥 */
  verify(input: string): boolean {
    if (!this.secret)
      return false
    return timingSafeEqual(digest(input), digest(this.secret))
  }
}
