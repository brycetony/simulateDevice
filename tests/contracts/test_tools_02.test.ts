/**
 * 契约测试：TOOLS-02 密码必须覆盖所选每一类字符。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-02（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { generatePassword, type PasswordOptions } from '../../src/utils/tools'

const CLASSES = {
  uppercase: /^[A-Z]$/,
  lowercase: /^[a-z]$/,
  numbers: /^[0-9]$/,
  symbols: /^[!@#$%^&*()_+\-=[\]{}|;:,.<>?]$/,
}

const combos: Array<Pick<PasswordOptions, 'uppercase' | 'lowercase' | 'numbers' | 'symbols'>> = [
  { uppercase: true, lowercase: true, numbers: true, symbols: true },
  { uppercase: true, lowercase: true, numbers: true, symbols: false },
  { uppercase: true, lowercase: false, numbers: true, symbols: true },
  { uppercase: true, lowercase: false, numbers: false, symbols: false },
  { uppercase: false, lowercase: true, numbers: false, symbols: true },
]

describe('TOOLS-02 类别覆盖', () => {
  for (const combo of combos) {
    const label = Object.entries(combo)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join('+')

    test(`勾选 ${label}：长度 6 与 16，各 300 次，每次每类 ≥1 字符且无越类字符`, () => {
      for (const length of [6, 16]) {
        for (let i = 0; i < 300; i++) {
          const pw = generatePassword({ ...combo, length })
          expect(pw).toHaveLength(length)
          for (const [cls, re] of Object.entries(CLASSES)) {
            const selected = combo[cls as keyof typeof combo]
            const count = [...pw].filter((c) => re.test(c)).length
            if (selected) {
              expect(count, `${label} L${length} 第${i}次：${cls} 类缺失（密码=${pw}）`).toBeGreaterThanOrEqual(1)
            } else {
              expect(count, `${label} L${length} 第${i}次：出现未选类别 ${cls}（密码=${pw}）`).toBe(0)
            }
          }
        }
      }
    })
  }

  test('长度小于类别数 → 显式报错（契约范围外输入不得静默产出）', () => {
    expect(() =>
      generatePassword({ length: 2, uppercase: true, lowercase: true, numbers: true, symbols: true }),
    ).toThrow()
  })
})
