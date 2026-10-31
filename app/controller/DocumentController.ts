import type { HttpContext } from '@hazejs/core'
import type { DeleteDocumentQuery, DocIdParams, ListDocumentsQuery } from '~/app/validate/document'
import { inject, validate } from '@hazejs/core'
import { DocumentService } from '~/app/service/DocumentService'
import { SaveDocumentSchema } from '~/app/validate/document'

type WithId = HttpContext<{ params: typeof DocIdParams }>

/** 编辑器文档同步：GET 增量拉取、PUT 新建或更新（带 baseVersion 做冲突检测）、DELETE 软删除 */
export class DocumentController {
  private documents = inject(DocumentService)

  index(ctx: HttpContext<{ query: typeof ListDocumentsQuery }>) {
    return this.documents.changes(ctx.validated.query.since)
  }

  async update(ctx: WithId) {
    const input = await validate(SaveDocumentSchema, await ctx.body())
    return this.documents.save(ctx.validated.params.id, {
      ...input,
      device: await this.device(ctx),
    })
  }

  async destroy(ctx: HttpContext<{ params: typeof DocIdParams, query: typeof DeleteDocumentQuery }>) {
    const { params, query } = ctx.validated
    const removed = await this.documents.remove(params.id, query.baseVersion, await this.device(ctx))
    return removed ?? ctx.noContent()
  }

  private async device(ctx: HttpContext) {
    return (await ctx.auth.currentAccessToken())?.name
  }
}
