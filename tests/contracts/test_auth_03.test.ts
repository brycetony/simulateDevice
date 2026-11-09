/**
 * 契约测试：AUTH-03 Bearer 附加（纯函数 + 适配器级端到端——header 必须真正到达请求层）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-03（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { attachAuthHeader } from '../../src/utils/auth'
import { stubEnv } from '../helpers/harness'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const { instance } = await import('../../src/api')

describe('AUTH-03 Bearer 附加（纯函数）', () => {
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

  test('已有自定义头不被覆盖；Authorization 碰撞以会话 token 为准（AUTH-03）', () => {
    expect(attachAuthHeader({ 'X-Custom': 'a' }, 't1')).toEqual({
      'X-Custom': 'a',
      Authorization: 'Bearer t1',
    })
    expect(attachAuthHeader({ Authorization: 'Custom scheme' }, 't1')).toEqual({
      Authorization: 'Bearer t1',
    })
  })
})

describe('AUTH-03 Bearer 附加（适配器级：header 到达请求层）', () => {
  let captured: Record<string, unknown> | undefined

  beforeEach(() => {
    captured = undefined
    instance.defaults.adapter = async (config: Record<string, unknown>) => {
      captured = config
      return { data: { code: 0, data: {}, message: 'ok' }, status: 200, headers: {}, config }
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('localStorage 有 token → 请求头含 Authorization: Bearer <token>', async () => {
    const { store } = stubEnv('/devices')
    store.set('token', 'tok-123')
    await instance.get('/users/list')
    const headers = captured?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok-123')
  })

  test('无 token → 请求头不含 Authorization 键', async () => {
    stubEnv('/login')
    await instance.get('/users/list')
    const headers = captured?.headers as Record<string, string>
    expect('Authorization' in headers).toBe(false)
  })
})
