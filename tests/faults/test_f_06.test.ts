/**
 * 故障回归：F-06 凭证泄漏日志（api 层：错误路径禁止 console.log 打印 response）。
 * 断言来源: docs/faults/faults.md 条目 F-06（复现判据先于修复存在，禁止按修复后实现反推）。
 * Login.vue 侧的登录响应日志属组件接线，人工/GUI 判据覆盖（本文件只锁 api 层）。
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

describe('F-06 错误路径零日志', () => {
  test('console.log 替换为抛错函数后走真实错误入口 → 不抛（原状 api/index.ts:31 必抛）', async () => {
    vi.setSystemTime(20_000_000)
    const original = console.log
    console.log = () => {
      throw new Error('F-06 违例：错误路径打印了响应数据')
    }
    try {
      const err = Object.assign(new Error('500'), {
        response: { status: 500, data: { message: '内部错误', token: 'leak-me' } },
      })
      instance.defaults.adapter = () => Promise.reject(err)
      await expect(instance.get('/users/list')).rejects.toBeTruthy()
    } finally {
      console.log = original
    }
  })
})
