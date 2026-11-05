/**
 * 契约测试：TOOLS-03 对称加密使用 ECB 模式（有意保留，见契约已知边界 1）。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-03（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { decryptText, encryptText, type SymmetricAlgorithm } from '../../src/utils/tools'

const PLAINTEXT_2_IDENTICAL_BLOCKS = 'A'.repeat(32) // 两个相同的 16 字节块

function ciphertextBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

describe('TOOLS-03 ECB 指纹', () => {
  test('两个相同明文块 → 密文原始字节对应块相同（ECB 特征，防模式被悄悄换掉）', () => {
    const ct = encryptText(PLAINTEXT_2_IDENTICAL_BLOCKS, '1234567890123456', 'aes')
    const bytes = ciphertextBytes(ct)
    // 32 字节明文 + PKCS7 整块补位 = 48 字节密文（3 块：A*16, A*16, padding）
    expect(bytes.length).toBe(48)
    const first = bytes.slice(0, 16).join(',')
    const second = bytes.slice(16, 32).join(',')
    expect(first, '若此项失败：加密已不是 ECB（块级确定性丢失）').toBe(second)
  })

  test('同明文+密钥 → 密文确定性一致（ECB 无 IV）', () => {
    const a = encryptText('determinism-check', '1234567890123456', 'aes')
    const b = encryptText('determinism-check', '1234567890123456', 'aes')
    expect(a).toBe(b)
  })
})

describe('TOOLS-03 round-trip（三算法）', () => {
  const cases: Array<[SymmetricAlgorithm, string]> = [
    ['aes', '1234567890123456'],
    ['des', 'k1k2k3k4'],
    ['tripledes', 'k'.repeat(24)],
  ]
  for (const [algorithm, key] of cases) {
    test(`${algorithm}：加密后解密还原（含非 ASCII）`, () => {
      const message = `hello 工具页-${algorithm}-é✓`
      const ct = encryptText(message, key, algorithm)
      const result = decryptText(ct, key, algorithm)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe(message)
      }
    })
  }
})
