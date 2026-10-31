import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 此文件只依赖 drizzle-orm，不要使用 ~ 别名（drizzle-kit 需要直接读取）
// 扩展配置（整份 AppConfig 的 JSON，加密存储）；自部署只有一个同步空间，表里最多一行
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Crypt.encryptString(JSON.stringify(config))：里面有 API Key，不明文落库
  payload: text('payload').notNull(),
  // 每次写入 +1，客户端据此判断冲突
  version: integer('version').notNull().default(1),
  // 最后一次写入来自哪台设备（设备令牌名）
  updatedBy: text('updated_by'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
})
