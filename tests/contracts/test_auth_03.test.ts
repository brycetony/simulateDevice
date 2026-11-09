/**
 * 契约测试：AUTH-03 Bearer 附加（有 token 附加，无/空 token 不附加空头）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-03（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { attachAuthHeader } from '../../src/utils/auth'

describe('AUTH-03 Bearer 附加', () => {
  test('有 token → 附加 Authorization: Bearer <token>', () => {
    expect(attachAuthHeader({}, 't1')).toEqual({ Authorization: 'Bearer t1' })
  })

  test('无 token（null）→ 不产生空头', () => {
    const headers = attachAuthHeader({}, null)
    expect('Authorization' in headers).toBe(false)
  })

  test('空串 token → 不产生空头', () => {
    const headers = attachAuthHeader({}, '')
    expect('Authorization' in headers).toBe(false)
  })

  test('已有自定义头不被覆盖', () => {
    expect(attachAuthHeader({ 'X-Custom': 'a' }, 't1')).toEqual({
      'X-Custom': 'a',
      Authorization: 'Bearer t1',
    })
  })
})
