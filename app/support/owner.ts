import { config, defineUserProvider } from '@hazejs/core'

/** 同步空间的所有者：自部署只有这一个「用户」，字段与官方后端的用户一致，扩展无需区分 */
export interface Owner {
  id: number
  name: string
  email: string
  role: 'admin'
}

export const OWNER_ID = 1

export function owner(): Owner {
  return {
    id: OWNER_ID,
    name: config<string>('sync.name', '自部署同步'),
    email: '',
    role: 'admin',
  }
}

/** 只认设备令牌，不接受任何账号密码 */
export const ownerProvider = defineUserProvider<Owner>({
  retrieveById: id => String(id) === String(OWNER_ID)
    ? owner()
    : null,
  retrieveByCredentials: () => null,
  validateCredentials: () => false,
  getId: user => user.id,
})
