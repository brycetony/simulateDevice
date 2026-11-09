/**
 * 故障回归：F-08 登录页 401 整页 reload 抹掉错误提示与表单输入
 * （原状 api/index.ts:36-40 不检查当前路径）。
 * 断言来源: docs/faults/faults.md 条目 F-08（复现判据先于修复存在，禁止按修复后实现反推）。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const { ElMessage } = await import('element-plus')
const { instance } = await import('../../src/api')

beforeEach(() => {
  vi.useFakeTimers()
  ElMessage.error = vi.fn()
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('F-08 登录页 401 不整页跳转', () => {
  test('当前在 /login → 不写 window.location.href（原状必写 → 整页 reload）', async () => {
    vi.setSystemTime(30_000_000)
    const location = { href: 'http://localhost/', pathname: '/login' }
    vi.stubGlobal('window', { location })
    const err = Object.assign(new Error('401'), { response: { status: 401, data: {} } })
    instance.defaults.adapter = () => Promise.reject(err)

    await expect(instance.post('/auth/login', {})).rejects.toBeTruthy()
    expect(location.href).toBe('http://localhost/')
    // 提示仍在（没有被 reload 抹掉的条件：不跳转即可保留 DOM）
    expect(ElMessage.error).toHaveBeenCalledWith('未授权，请重新登录')
  })
})
