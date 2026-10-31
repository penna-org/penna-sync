import { ConflictException, Crypt } from '@hazejs/core'
import { OptimisticLockException } from '@hazejs/orm'
import { Setting } from '~/app/model/Setting'

export interface SettingsSnapshot {
  config: Record<string, unknown> | null
  version: number
  updatedAt: Date | null
  updatedBy: string | null
}

export interface SaveSettingsInput {
  config: Record<string, unknown>
  /** 客户端上次拿到的版本；与服务端不一致时视为冲突（省略则强制覆盖） */
  baseVersion?: number
  device?: string
}

/** 扩展配置：整份 JSON 加密后落库（只有一行），按版本号做乐观并发控制 */
export class SettingsService {
  async get(): Promise<SettingsSnapshot> {
    const row = await Setting.query().find()
    if (!row) {
      return {
        config: null,
        version: 0,
        updatedAt: null,
        updatedBy: null,
      }
    }
    return this.toSnapshot(row)
  }

  async save(input: SaveSettingsInput): Promise<SettingsSnapshot> {
    const payload = await Crypt.encryptString(JSON.stringify(input.config))
    const row = await Setting.query().find()
    if (!row) {
      const created = await Setting.create({
        payload,
        version: 1,
        updatedBy: input.device ?? null,
      })
      return this.toSnapshot(created)
    }
    if (input.baseVersion !== undefined && input.baseVersion !== row.version)
      await this.conflict(row)
    row.payload = payload
    row.updatedBy = input.device ?? null
    try {
      // 乐观锁（Setting.optimLock）：version 自动 +1，并发推送时只有一个成功
      await row.save()
    }
    catch (error) {
      if (error instanceof OptimisticLockException)
        await this.conflict(await Setting.query().find())
      throw error
    }
    return this.toSnapshot(row)
  }

  async clear(): Promise<void> {
    // 不带条件的批量删除会被拒绝，按「id 不为空」删除全部
    await Setting.query().whereNotNull('id').delete()
  }

  private async conflict(row: Setting | undefined): Promise<never> {
    throw new ConflictException('配置已在其他设备上更新', {
      code: 'settings_conflict',
      data: row
        ? await this.toSnapshot(row)
        : undefined,
    })
  }

  private async toSnapshot(row: Setting): Promise<SettingsSnapshot> {
    return {
      config: JSON.parse(await Crypt.decryptString(row.payload)) as Record<string, unknown>,
      version: row.version,
      updatedAt: row.updatedAt ?? null,
      updatedBy: row.updatedBy ?? null,
    }
  }
}
