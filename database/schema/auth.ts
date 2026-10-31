import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 此文件只依赖 drizzle-orm，不要使用 ~ 别名（drizzle-kit 需要直接读取）
// JS 属性名由 @hazejs/orm 的 databaseTokenStore() 读取，请勿修改

// 设备令牌（config/auth.ts 的 token Guard）：每台配对过的浏览器一枚，可随时吊销
export const personalAccessTokens = sqliteTable('personal_access_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tokenableType: text('tokenable_type').notNull(),
  tokenableId: text('tokenable_id').notNull(),
  // 设备名，如「Chrome · macOS」
  name: text('name').notNull(),
  // 明文令牌的 SHA-256 摘要
  token: text('token').notNull().unique(),
  abilities: text('abilities', { mode: 'json' }).$type<string[]>().notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, table => [
  index('personal_access_tokens_tokenable_index').on(table.tokenableType, table.tokenableId),
])
