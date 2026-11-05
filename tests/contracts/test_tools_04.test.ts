/**
 * 契约测试：TOOLS-04 解密失败必须显式返回原因，禁止静默空串。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-04（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { decryptText, encryptText } from '../../src/utils/tools'

const KEY = '1234567890123456'

describe('TOOLS-04 显式失败', () => {
  test('错误密钥解密 → {ok:false} 且带原因，不是静默的空值', () => {
    const ct = encryptText('non-empty secret', KEY, 'aes')
    const result = decryptText(ct, 'wrong-key-1234567', 'aes')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBeTruthy()
    }
  })

  test('非法 Base64 密文 → invalid-input（格式错误与解密失败可区分）', () => {
    const result = decryptText('!!!not-base64!!!', KEY, 'aes')
    expect(result).toEqual({ ok: false, reason: 'invalid-input' })
  })

  test('合法 Base64 但内容不是本算法密文 → failed（不是静默成功）', () => {
    // 已验证向量：AES-ECB 解出空明文 → 归并为 failed。
    // 注意 ECB 无完整性校验，个别伪造密文可能解出"合法"乱码——契约已知边界 2 的固有代价。
    const result = decryptText('qgwP5X9Tmvp4H2mLGZ0fDw==', KEY, 'aes')
    expect(result).toEqual({ ok: false, reason: 'failed' })
  })

  test('正确密钥 → 还原原文（显式失败不能误伤正常路径）', () => {
    const ct = encryptText('正常路径 message', KEY, 'aes')
    const result = decryptText(ct, KEY, 'aes')
    expect(result).toEqual({ ok: true, value: '正常路径 message' })
  })
})
