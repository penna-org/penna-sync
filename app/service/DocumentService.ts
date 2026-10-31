import { ConflictException } from '@hazejs/core'
import { OptimisticLockException, UniqueConstraintException } from '@hazejs/orm'
import { Document } from '~/app/model/Document'

export interface DocumentSnapshot {
  id: string
  title: string
  content: string
  version: number
  /** 毫秒时间戳 */
  createdAt: number
  updatedAt: number
  /** 已删除（墓碑）时为删除时间 */
  deletedAt: number | null
  updatedBy: string | null
}

export interface DocumentChanges {
  documents: DocumentSnapshot[]
  /** 下次增量拉取传回的 since */
  cursor: number
}

export interface SaveDocumentInput {
  title: string
  content: string
  baseVersion?: number
  createdAt?: number
  device?: string
}

/**
 * 编辑器文档：每篇一行，按版本号做乐观并发控制；
 * 删除是软删除，墓碑留给其他设备增量拉取时删除本地副本。
 */
export class DocumentService {
  async changes(since?: number): Promise<DocumentChanges> {
    // 先取时间再查询：查询期间写入的文档 updatedAt ≥ cursor，下次还能拉到（客户端按版本去重）
    const cursor = Date.now()
    let query = Document.query()
    if (since)
      query = query.where('updatedAt', '>=', new Date(since))
    else
      query = query.whereNull('deletedAt')
    const rows = await query.order('updatedAt', 'asc').select()
    return {
      documents: rows.map(row => this.toSnapshot(row)),
      cursor,
    }
  }

  async save(docId: string, input: SaveDocumentInput): Promise<DocumentSnapshot> {
    const row = await this.find(docId)
    if (!row) {
      try {
        const created = await Document.create({
          docId,
          title: input.title,
          content: input.content,
          version: 1,
          updatedBy: input.device ?? null,
          createdAt: input.createdAt
            ? new Date(input.createdAt)
            : new Date(),
        })
        return this.toSnapshot(created)
      }
      catch (error) {
        // 两台设备同时新建同一篇（唯一索引冲突）：后到的按冲突处理
        if (error instanceof UniqueConstraintException)
          this.conflict(await this.find(docId))
        throw error
      }
    }
    // 墓碑上再保存视为恢复，不算冲突（另一台设备删除时没有看到这次修改）
    if (!row.deletedAt && input.baseVersion !== undefined && input.baseVersion !== row.version)
      this.conflict(row)
    row.title = input.title
    row.content = input.content
    row.deletedAt = null
    row.updatedBy = input.device ?? null
    await this.saveLocked(row, docId)
    return this.toSnapshot(row)
  }

  async remove(docId: string, baseVersion?: number, device?: string): Promise<DocumentSnapshot | null> {
    const row = await this.find(docId)
    if (!row || row.deletedAt) {
      return row
        ? this.toSnapshot(row)
        : null
    }
    if (baseVersion !== undefined && baseVersion !== row.version)
      this.conflict(row)
    row.content = ''
    row.deletedAt = new Date()
    row.updatedBy = device ?? null
    await this.saveLocked(row, docId)
    return this.toSnapshot(row)
  }

  private find(docId: string) {
    return Document.where('docId', docId).find()
  }

  /** 乐观锁保存（version 自动 +1）；读到之后被别的请求抢先写入时返回冲突 */
  private async saveLocked(row: Document, docId: string): Promise<void> {
    try {
      await row.save()
    }
    catch (error) {
      if (error instanceof OptimisticLockException)
        this.conflict(await this.find(docId))
      throw error
    }
  }

  private conflict(row: Document | undefined): never {
    throw new ConflictException('文档已在其他设备上修改', {
      code: 'document_conflict',
      data: row
        ? this.toSnapshot(row)
        : undefined,
    })
  }

  private toSnapshot(row: Document): DocumentSnapshot {
    return {
      id: row.docId,
      title: row.title,
      content: row.content,
      version: row.version,
      createdAt: row.createdAt?.getTime() ?? 0,
      updatedAt: row.updatedAt?.getTime() ?? 0,
      deletedAt: row.deletedAt?.getTime() ?? null,
      updatedBy: row.updatedBy ?? null,
    }
  }
}
