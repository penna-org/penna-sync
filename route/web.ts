import { defineRoutes, raw } from '@hazejs/core'
import { version } from '~/package.json'

/** 根路径：确认服务在运行（浏览器打开时看到的就是这个） */
export default defineRoutes((r) => {
  r.get('/', () => raw({
    name: 'penna-sync',
    version,
    status: 'ok',
    docs: 'https://github.com/penna-org/penna-sync',
  })).name('home')
})
