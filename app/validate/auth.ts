import * as v from 'valibot'

export const PairSchema = v.object({
  secret: v.pipe(v.string('访问密钥必填'), v.trim(), v.minLength(1, '访问密钥必填'), v.maxLength(200, '访问密钥不正确')),
  // 设备名，显示在扩展「设备」列表里
  device: v.pipe(v.string('设备名必填'), v.trim(), v.minLength(1, '设备名必填'), v.maxLength(100, '设备名最多 100 个字符')),
})
