import * as v from 'valibot'

export const SaveSettingsSchema = v.object({
  // 整份扩展配置；结构由扩展维护，服务端只保证是一个对象
  config: v.record(v.string(), v.unknown()),
  baseVersion: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
})
