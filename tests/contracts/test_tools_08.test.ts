/**
 * 契约测试：TOOLS-08 哈希输出为小写十六进制。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-08（判据先于实现存在，禁止按实现反推）。
 * 向量来源：NIST/RFC 公开标准测试向量（"abc"），非本实现自产。
 */

import { describe, expect, test } from 'vitest'
import { generateHash } from '../../src/utils/tools'

describe('TOOLS-08 公开标准向量（"abc"）', () => {
  test('MD5', () => {
    expect(generateHash('abc', 'md5')).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  test('SHA-1', () => {
    expect(generateHash('abc', 'sha1')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  test('SHA-256', () => {
    expect(generateHash('abc', 'sha256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  test('SHA-512', () => {
    expect(generateHash('abc', 'sha512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })
})

describe('TOOLS-08 小写 hex 形态', () => {
  for (const algorithm of ['md5', 'sha1', 'sha256', 'sha512'] as const) {
    test(`${algorithm} 输出匹配 /^[0-9a-f]+$/`, () => {
      const digest = generateHash('大小写与形态-check', algorithm)
      expect(digest).toMatch(/^[0-9a-f]+$/)
    })
  }
})
