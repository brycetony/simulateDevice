/**
 * 契约测试：TOOLS-01 密码生成必须使用 CSPRNG。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-01（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { generatePassword, secureRandomInt } from '../../src/utils/tools'

describe('TOOLS-01 CSPRNG', () => {
  test('Math.random 被替换为抛错函数后，生成密码仍成功（路径上禁止 Math.random）', () => {
    const original = Math.random
    Math.random = () => {
      throw new Error('TOOLS-01 违例：密码生成路径使用了 Math.random')
    }
    try {
      const pw = generatePassword({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      })
      expect(pw).toHaveLength(16)
    } finally {
      Math.random = original
    }
  })

  test('随机源来自 crypto.getRandomValues（替换后可观测）', () => {
    const cryptoObj = globalThis.crypto as Crypto
    const original = cryptoObj.getRandomValues.bind(cryptoObj)
    let calls = 0
    cryptoObj.getRandomValues = ((arr: Uint8Array) => {
      calls++
      return original(arr)
    }) as Crypto['getRandomValues']
    try {
      generatePassword({ length: 12, uppercase: true, lowercase: true, numbers: false, symbols: false })
      expect(calls).toBeGreaterThan(0)
    } finally {
      cryptoObj.getRandomValues = original
    }
  })

  test('secureRandomInt 返回落在 [0, max) 内的整数（拒绝采样不出界）', () => {
    for (let i = 0; i < 1000; i++) {
      const n = secureRandomInt(7)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(7)
    }
  })
})
