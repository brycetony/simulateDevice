/**
 * 契约测试：AUTH-13 401 并发去重（窗口判定纯函数 + 适配器级并发场景）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-13（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { shouldNotifyUnauthorized } from '../../src/utils/auth'
import { stubEnv, httpError } from '../helpers/harness'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const { ElMessage } = await import('element-plus')
const { instance } = await import('../../src/api')

beforeEach(() => {
  vi.useFakeTimers()
  ElMessage.error = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('AUTH-13 去重窗口（纯函数）', () => {
  test('首次（last=0）→ 需要提示', () => {
    expect(shouldNotifyUnauthorized(500, 0)).toBe(true)
  })

  test('窗口期内（差 < 1000ms）→ 不重复提示', () => {
    expect(shouldNotifyUnauthorized(1500, 1000)).toBe(false)
    expect(shouldNotifyUnauthorized(1999, 1000)).toBe(false)
  })

  test('窗口边界（差 ≥ 1000ms）→ 再次提示', () => {
    expect(shouldNotifyUnauthorized(2000, 1000)).toBe(true)
  })
})

describe('AUTH-13 并发 401（适配器级）', () => {
  test('同一时刻 3 个请求同时 401 → 仅提示一次', async () => {
    vi.setSystemTime(5_000_000)
    stubEnv('/devices')
    instance.defaults.adapter = () => Promise.reject(httpError(401, {}))

    await Promise.allSettled([
      instance.get('/users/list'),
      instance.get('/devices'),
      instance.get('/statistics'),
    ])

    expect(ElMessage.error).toHaveBeenCalledTimes(1)
    expect(ElMessage.error).toHaveBeenCalledWith('未授权，请重新登录')
  })
})
