/**
 * 契约测试：TOOLS-09 密钥长度校验（按 UTF-8 字节数，非字符数）。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-09（裁决自 T-001 §7 新决策项，2026-11-05）。
 */

import { describe, expect, test } from 'vitest'
import {
  decryptText,
  encryptText,
  keyByteLength,
} from '../../src/utils/tools'

describe('TOOLS-09 字节数 ≠ 字符数', () => {
  test('keyByteLength 按 UTF-8 字节计数（é=2、密=3、A=1）', () => {
    expect(keyByteLength('éééééééé')).toBe(16) // 8 字符 = 16 字节
    expect(keyByteLength('密码密码密码密码')).toBe(24) // 8 个汉字 = 24 字节
    expect(keyByteLength('A'.repeat(16))).toBe(16)
  })

  test('é×8（16 字节）对 AES 是有效密钥，round-trip 成功', () => {
    const key = 'éééééééé'
    const ct = encryptText('byte-not-char', key, 'aes')
    const result = decryptText(ct, key, 'aes')
    expect(result).toEqual({ ok: true, value: 'byte-not-char' })
  })
})

describe('TOOLS-09 非法长度显式拒绝', () => {
  test('AES + 15 字节密钥：加密抛错（信息含长度要求）', () => {
    expect(() => encryptText('x', 'A'.repeat(15), 'aes')).toThrow(/16\/24\/32/)
  })

  test('AES + 15 字节密钥：解密返回 invalid-key', () => {
    expect(decryptText('AAAAAAAAAAAAAAAAAAAAAA==', 'A'.repeat(15), 'aes')).toEqual({
      ok: false,
      reason: 'invalid-key',
    })
  })

  test('AES + 15 字节（5 个汉字）：加密抛错', () => {
    expect(() => encryptText('x', '密密密密密', 'aes')).toThrow()
  })

  test('DES + 7 字节抛错；3DES + 23 字节抛错', () => {
    expect(() => encryptText('x', 'A'.repeat(7), 'des')).toThrow(/8 字节/)
    expect(() => encryptText('x', 'A'.repeat(23), 'tripledes')).toThrow(/24 字节/)
  })

  test('AES + 24/32 字节密钥有效（全档位 round-trip）', () => {
    for (const n of [24, 32]) {
      const key = 'k'.repeat(n)
      const ct = encryptText('all-key-sizes', key, 'aes')
      expect(decryptText(ct, key, 'aes')).toEqual({ ok: true, value: 'all-key-sizes' })
    }
  })
})
