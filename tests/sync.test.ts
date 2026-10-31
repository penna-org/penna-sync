import { refreshDatabase } from '@hazejs/orm'
import { useTestApp } from '@hazejs/testing'
import { beforeEach, describe, expect, it } from 'vitest'

const t = useTestApp()
beforeEach(() => refreshDatabase({ migrations: 'database/migrations' }))

/** 用 .env.test 里的 SYNC_SECRET 配对一台设备，返回带令牌的客户端 */
async function pair(device = 'Chrome · macOS') {
  const res = await t.post('/api/auth/pair', { secret: 'test-secret', device })
  expect(res.status).toBe(201)
  return {
    token: res.body.data.token as string,
    id: res.body.data.accessToken.id as number,
    client: t.withHeaders({ authorization: `Bearer ${res.body.data.token}` }),
  }
}

describe('pairing', () => {
  it('reports itself as a self-hosted server without a token', async () => {
    const res = await t.get('/api/server')
    expect(res.body.data).toMatchObject({ name: 'penna-sync', selfHosted: true })
  })

  it('rejects a wrong secret and unauthenticated sync requests', async () => {
    expect((await t.post('/api/auth/pair', { secret: 'nope', device: 'x' })).status).toBe(401)
    expect((await t.get('/api/settings')).status).toBe(401)
    expect((await t.get('/api/documents')).status).toBe(401)
  })

  it('issues a device token that can list and revoke devices', async () => {
    const a = await pair('A')
    const b = await pair('B')
    const me = await a.client.get('/api/auth/me')
    expect(me.body.data).toMatchObject({ id: 1, role: 'admin' })

    const list = await a.client.get('/api/auth/tokens')
    expect(list.body.data.map((d: { name: string, current: boolean }) => [d.name, d.current])).toEqual([['A', true], ['B', false]])
    expect(list.body.data[0]).not.toHaveProperty('token')

    expect((await a.client.delete(`/api/auth/tokens/${b.id}`)).status).toBe(204)
    expect((await b.client.get('/api/settings')).status).toBe(401)

    expect((await a.client.post('/api/auth/logout')).status).toBe(204)
    expect((await a.client.get('/api/settings')).status).toBe(401)
  })
})

describe('settings', () => {
  it('stores the config with optimistic versioning', async () => {
    const { client } = await pair()
    const empty = await client.get('/api/settings')
    expect(empty.body.data).toMatchObject({ config: null, version: 0 })

    const first = await client.put('/api/settings', { config: { theme: 'dark' }, baseVersion: 0 })
    expect(first.body.data).toMatchObject({ config: { theme: 'dark' }, version: 1, updatedBy: 'Chrome · macOS' })

    const second = await client.put('/api/settings', { config: { theme: 'light' }, baseVersion: 1 })
    expect(second.body.data.version).toBe(2)

    // 拿着过期的版本推送：409，并带回服务端的最新配置
    const stale = await client.put('/api/settings', { config: { theme: 'blue' }, baseVersion: 1 })
    expect(stale.status).toBe(409)
    expect(stale.body.code).toBe('settings_conflict')
    expect(stale.body.data).toMatchObject({ config: { theme: 'light' }, version: 2 })

    expect((await client.delete('/api/settings')).status).toBe(204)
    expect((await client.get('/api/settings')).body.data.config).toBeNull()
  })
})

describe('documents', () => {
  it('syncs documents incrementally with conflicts and tombstones', async () => {
    const { client } = await pair()
    const created = await client.put('/api/documents/doc-0001', { title: 'Hello', content: '# hi', baseVersion: 0, createdAt: 1_700_000_000_000 })
    expect(created.body.data).toMatchObject({ id: 'doc-0001', version: 1, createdAt: 1_700_000_000_000 })

    const all = await client.get('/api/documents')
    expect(all.body.data.documents).toHaveLength(1)
    const cursor = all.body.data.cursor as number

    const updated = await client.put('/api/documents/doc-0001', { title: 'Hello', content: '# hi!', baseVersion: 1 })
    expect(updated.body.data.version).toBe(2)

    const conflict = await client.put('/api/documents/doc-0001', { title: 'Hello', content: 'old', baseVersion: 1 })
    expect(conflict.status).toBe(409)
    expect(conflict.body.code).toBe('document_conflict')
    expect(conflict.body.data).toMatchObject({ content: '# hi!', version: 2 })

    const removed = await client.delete('/api/documents/doc-0001?baseVersion=2')
    expect(removed.body.data).toMatchObject({ content: '', version: 3 })
    expect(removed.body.data.deletedAt).toBeTypeOf('number')

    // 增量拉取能看到墓碑；全量拉取不返回已删除的文档
    const changes = await client.get(`/api/documents?since=${cursor}`)
    expect(changes.body.data.documents).toEqual([expect.objectContaining({ id: 'doc-0001', version: 3 })])
    expect((await client.get('/api/documents')).body.data.documents).toEqual([])

    expect((await client.put('/api/documents/bad id!', { title: '', content: '' })).status).toBe(422)
  })
})
