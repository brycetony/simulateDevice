/**
 * 故障回归：F-02 default 错误分支 message.join 必崩（TypeError 抛在弹窗参数求值处，
 * 该分支自身永远弹不出任何提示——原状 api/index.ts:50-51）。
 * 断言来源: docs/faults/faults.md 条目 F-02（复现判据先于修复存在，禁止按修复后实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { resolveApiErrorMessage } from '../../src/utils/auth'

describe('F-02 default 分支不再抛 TypeError', () => {
  test('message 为字符串（原状必崩路径）→ 直用，不抛错', () => {
    // 修复前：'X'.join is not a function → TypeError
    expect(() => resolveApiErrorMessage(502, { message: 'Bad Gateway 细节' })).not.toThrow()
    expect(resolveApiErrorMessage(502, { message: 'Bad Gateway 细节' })).toBe('Bad Gateway 细节')
  })

  test('message 为数组（原状唯一能工作的形态）→ join 不回归', () => {
    expect(resolveApiErrorMessage(502, { message: ['a', 'b'] })).toBe('a, b')
  })

  test('message 为空数组 / 非字符串非数组 → 兜底，不抛错', () => {
    expect(resolveApiErrorMessage(502, { message: [] })).toBe('未知错误')
    expect(resolveApiErrorMessage(502, { message: 42 })).toBe('未知错误')
  })
})
