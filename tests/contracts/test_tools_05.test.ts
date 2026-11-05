/**
 * 契约测试：TOOLS-05 Base64 变体编码（非 RFC 4648，有意行为，裁决自 C5）。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-05（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { decodeBase64, encodeBase64 } from '../../src/utils/tools'

describe('TOOLS-05 变体字面值（锁定"不漂移到标准 Base64"）', () => {
  // 已知字面值：encodeURIComponent + btoa 的组合结果。
  // 注意与 RFC 4648 的差异是有意的：标准 Base64('é') 应为 'w6k='，本变体是 'JUMzJUE5'。
  test('é → JUMzJUE5（若失败说明实现漂移到了标准 Base64）', () => {
    expect(encodeBase64('é')).toBe('JUMzJUE5')
  })

  test('中 → JUU0JUI4JUFE', () => {
    expect(encodeBase64('中')).toBe('JUU0JUI4JUFE')
  })

  test('A → QQ==', () => {
    expect(encodeBase64('A')).toBe('QQ==')
  })
})

describe('TOOLS-05 自洽可逆', () => {
  const samples = ['hello', 'é中✓ emoji', 'a'.repeat(100), '{"k":"v&<">"}']
  for (const s of samples) {
    test(`round-trip: ${JSON.stringify(s).slice(0, 20)}`, () => {
      expect(decodeBase64(encodeBase64(s))).toBe(s)
    })
  }

  test('非法输入抛错（不静默）', () => {
    expect(() => decodeBase64('!!!')).toThrow()
  })
})
