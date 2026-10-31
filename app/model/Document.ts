import { Model } from '@hazejs/orm'
import { documents } from '~/database/schema/documents'

/** 扩展 Markdown 编辑器同步上来的文档，见 app/service/DocumentService.ts */
export class Document extends Model.define(documents) {
  static override hidden = ['id']
  // 乐观锁：save() 带上 WHERE version = 读到的版本，并发写入时只有一个成功
  static override optimLock = 'version'
}
