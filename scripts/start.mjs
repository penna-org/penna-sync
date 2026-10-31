#!/usr/bin/env node
// 生产启动（pnpm start / Docker）：补齐 APP_KEY → 执行数据库迁移 → 启动服务
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

// .env 只补充没设置的变量，真实环境变量优先（与 hazejs 一致）
const envFile = join(process.cwd(), '.env')
if (existsSync(envFile)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(envFile, 'utf8')))) {
    if (process.env[key] === undefined)
      process.env[key] = value
  }
}

process.env.NODE_ENV ||= 'production'
const dataDir = resolve(process.env.DATA_DIR || './data')
process.env.DATA_DIR = dataDir
process.env.DATABASE_URL ||= `file:${join(dataDir, 'app.db')}`
mkdirSync(dataDir, { recursive: true })

// APP_KEY 用于加密落库的配置：没设置时生成一次并保存在数据目录，重启后保持不变
if (!process.env.APP_KEY) {
  const keyFile = join(dataDir, 'app-key')
  if (!existsSync(keyFile))
    writeFileSync(keyFile, `${randomBytes(32).toString('base64url')}\n`, { mode: 0o600 })
  process.env.APP_KEY = readFileSync(keyFile, 'utf8').trim()
}

if (!existsSync(join(dist, 'index.mjs'))) {
  console.error('找不到 dist/index.mjs，请先执行 pnpm build')
  process.exit(1)
}

const migrated = spawnSync(process.execPath, [join(dist, 'migrate.mjs')], { stdio: 'inherit', env: process.env })
if (migrated.status !== 0)
  process.exit(migrated.status ?? 1)

await import(pathToFileURL(join(dist, 'index.mjs')).href)
