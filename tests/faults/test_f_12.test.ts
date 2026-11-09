/**
 * 故障回归：F-12 Layout 顶层 JSON.parse(userInfo) 无防御，非法 JSON 直接白屏
 * （原状 Layout.vue:119）。
 * 断言来源: docs/faults/faults.md 条目 F-12（复现判据先于修复存在，禁止按修复后实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { parseUserInfo } from '../../src/utils/auth'

describe('F-12 userInfo 防御性解析', () => {
  test('null / 空值 → {}，不抛错', () => {
    expect(parseUserInfo(null)).toEqual({})
  })

  test('非法 JSON（原状白屏路径）→ {}，不抛错', () => {
    expect(() => parseUserInfo('{"id":"u1"')).not.toThrow()
    expect(parseUserInfo('{"id":"u1"')).toEqual({})
    expect(parseUserInfo('not json at all')).toEqual({})
  })

  test('合法 JSON 对象 → 原样返回', () => {
    expect(parseUserInfo('{"id":"u1","role":"admin"}')).toEqual({ id: 'u1', role: 'admin' })
  })

  test('合法 JSON 但非对象（字符串/数字）→ {}', () => {
    expect(parseUserInfo('"just a string"')).toEqual({})
    expect(parseUserInfo('123')).toEqual({})
  })
})
