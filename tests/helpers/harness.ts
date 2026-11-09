/**
 * 适配器级测试公共桩（AUTH 域接线测试共用）。
 *
 * 用途：vi.mock('element-plus') 必须留在各测试文件内（hoisting 限制），
 * localStorage / window 桩与 axios adapter 伪造器在此共享。
 * 本文件不含任何断言与条目 ID，不在 gate 溯源扫描范围。
 */
import { vi } from 'vitest'

export interface StubEnv {
  store: Map<string, string>
  location: { href: string; pathname: string }
}

/** 桩化 localStorage 与 window.location；返回可断言的 store 与 location 引用。 */
export function stubEnv(pathname = '/devices'): StubEnv {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  const location = { href: 'http://localhost/', pathname }
  vi.stubGlobal('window', { location })
  return { store, location }
}

/** 构造带 response 的拒绝值（模拟 HTTP 错误；status 传 undefined = 网络级错误）。 */
export function httpError(status: number | undefined, data?: unknown): Error {
  const err = new Error('adapter: simulated failure') as Error & { response?: unknown }
  if (status !== undefined) {
    err.response = { status, data }
  }
  return err
}
