import { env } from '@hazejs/core'
import { defineDatabaseConfig } from '@hazejs/orm'

// SQLite 单文件：默认 ./data/app.db（Docker 中为 /data/penna-sync.db），备份时复制这个文件即可
export default defineDatabaseConfig(() => ({
  default: 'main',
  connections: {
    main: {
      driver: 'sqlite',
      url: env('DATABASE_URL', 'file:./data/app.db'),
      logging: env('DB_LOGGING', false),
    },
  },
}))
