import { dbCheck, defineHealthConfig } from '@hazejs/core'
import { Db } from '@hazejs/orm'

// /health/live 始终 200；/health 与 /health/ready 额外检查数据库
export default defineHealthConfig({
  checks: { db: dbCheck(Db) },
})
