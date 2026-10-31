import { defineRoutes } from '@hazejs/core'
import { AuthController } from '~/app/controller/AuthController'
import { DocumentController } from '~/app/controller/DocumentController'
import { ServerController } from '~/app/controller/ServerController'
import { SettingsController } from '~/app/controller/SettingsController'
import { TokenController } from '~/app/controller/TokenController'
import { DeleteDocumentQuery, DocIdParams, ListDocumentsQuery } from '~/app/validate/document'

/**
 * 接口与官方后端保持一致（/api/settings、/api/documents、/api/auth/tokens），
 * 只是把邮箱密码登录换成了访问密钥配对（/api/auth/pair）。
 */
export default defineRoutes((r) => {
  r.group({ prefix: '/api', as: 'api.' }, (r) => {
    r.get('/server', [ServerController, 'show']).name('server')

    r.group({ prefix: '/auth', as: 'auth.' }, (r) => {
      // 配对：同一 IP 每分钟最多 10 次，防止暴力猜密钥
      r.post('/pair', [AuthController, 'pair']).middleware('throttle:10,60').name('pair')
      r.get('/me', [AuthController, 'me']).middleware('auth').name('me')
      r.post('/logout', [AuthController, 'logout']).middleware('auth').name('logout')
      r.get('/tokens', [TokenController, 'index']).middleware('auth').name('tokens.index')
      r.delete('/tokens/:id', [TokenController, 'destroy']).middleware('auth').name('tokens.destroy')
    })

    r.group({ prefix: '/settings', as: 'settings.', middleware: ['auth'] }, (r) => {
      r.get('/', [SettingsController, 'show']).name('show')
      r.put('/', [SettingsController, 'update']).name('update')
      r.delete('/', [SettingsController, 'destroy']).name('destroy')
    })

    r.group({ prefix: '/documents', as: 'documents.', middleware: ['auth'] }, (r) => {
      r.get('/', [DocumentController, 'index']).validate({ query: ListDocumentsQuery }).name('index')
      r.put('/:id', [DocumentController, 'update']).validate({ params: DocIdParams }).name('update')
      r.delete('/:id', [DocumentController, 'destroy']).validate({ params: DocIdParams, query: DeleteDocumentQuery }).name('destroy')
    })
  })
})
