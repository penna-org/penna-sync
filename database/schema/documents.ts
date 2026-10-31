import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// 此文件只依赖 drizzle-orm，不要使用 ~ 别名（drizzle-kit 需要直接读取）
// 扩展 Markdown 编辑器的文档；id 由客户端生成（离线也能新建）
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 客户端文档 ID，接口路径里用它
  docId: text('doc_id').notNull(),
  title: text('title').notNull().default(''),
  // Markdown 源码；删除后清空，只留墓碑供其他设备同步
  content: text('content').notNull().default(''),
  // 每次写入 +1，客户端据此判断冲突
  version: integer('version').notNull().default(1),
  updatedBy: text('updated_by'),
  // 软删除：其他设备拉取时据此删掉本地副本
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
}, table => [
  uniqueIndex('documents_doc_id_unique').on(table.docId),
  index('documents_updated_index').on(table.updatedAt),
])
