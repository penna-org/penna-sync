import { Model } from '@hazejs/orm'
import { settings } from '~/database/schema/settings'

/** 扩展配置（加密 JSON），见 app/service/SettingsService.ts */
export class Setting extends Model.define(settings) {
  static override hidden = ['payload']
  // 乐观锁：save() 带上 WHERE version = 读到的版本，并发推送时只有一个成功
  static override optimLock = 'version'
}
