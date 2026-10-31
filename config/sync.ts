import { defineConfig, env } from '@hazejs/core'

/** 同步服务自身的配置：config('sync.secret') 等 */
export default defineConfig(() => ({
  // 配对用的访问密钥；留空时首次启动自动生成，保存在 <dataDir>/sync-secret
  secret: env('SYNC_SECRET', ''),
  // 数据目录：SQLite 数据库与自动生成的密钥都放在这里（Docker 中挂载为卷）
  dataDir: env('DATA_DIR', './data'),
  // 扩展「账号」页显示的名字
  name: env('SYNC_NAME', '自部署同步'),
}))
