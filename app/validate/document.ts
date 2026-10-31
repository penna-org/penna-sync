import * as v from 'valibot'

export const DocIdParams = v.object({
  id: v.pipe(v.string(), v.regex(/^[\w-]{6,64}$/, '文档 ID 格式不正确')),
})

export const ListDocumentsQuery = v.object({
  // 上次拉取返回的 cursor（毫秒时间戳），省略表示全量
  since: v.optional(v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0))),
})

export const SaveDocumentSchema = v.object({
  title: v.pipe(v.string(), v.maxLength(500, '标题太长')),
  content: v.pipe(v.string(), v.maxLength(2_000_000, '文档太大（上限约 2MB）')),
  // 客户端上次拿到的版本，新文档为 0；与服务端不一致时视为冲突（省略则强制覆盖）
  baseVersion: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  // 客户端创建时间（毫秒），只在新建时使用
  createdAt: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
})

export const DeleteDocumentQuery = v.object({
  // DELETE 不一定带得了请求体，版本号走查询参数
  baseVersion: v.optional(v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0))),
})
