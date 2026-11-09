/**
 * 故障回归：F-03 401 只清 token 残留 userInfo/userRole（原状 api/index.ts:38）。
 * 断言来源: docs/faults/faults.md 条目 F-03（复现判据先于修复存在，禁止按修复后实现反推）。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const { instance } = await import('../../src/api')

beforeEach(() => {
  vi.useFakeTimers()
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  vi.stubGlobal('window', { location: { href: 'http://localhost/', pathname: '/devices' } })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('F-03 401 清三键', () => {
  test('预置三键齐全 → 401 后三键全部不存在（原状只清 token → 红）', async () => {
    vi.setSystemTime(10_000_000)
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    })
    store.set('token', 't1')
    store.set('userInfo', '{"id":"u1","email":"a@b.c"}')
    store.set('userRole', 'admin')

    const err = Object.assign(new Error('401'), { response: { status: 401, data: {} } })
    instance.defaults.adapter = () => Promise.reject(err)

    await expect(instance.get('/users/list')).rejects.toBeTruthy()
    expect([...store.keys()]).toEqual([])
  })
})
