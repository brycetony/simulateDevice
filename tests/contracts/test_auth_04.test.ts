/**
 * 契约测试：AUTH-04 响应剥壳与 401 语义（适配器级接线——从 axios 实例公共入口断言，
 * 防「抽了白抽」的同源假绿）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-04（判据先于实现存在，禁止按实现反推）。
 * 手法：vi.mock element-plus（node 环境不加载真组件）、stub localStorage/window、
 * 自定义 axios adapter 伪造响应；期望文案/键名全部为契约字面量。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
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

describe('AUTH-04 剥壳与 401（适配器级）', () => {
  test('2xx 剥壳：返回值即 {code,data,message}', async () => {
    const { store } = stubEnv('/devices')
    store.set('token', 't1')
    instance.defaults.adapter = () =>
      Promise.resolve({
        data: { code: 0, data: { items: [], total: 0 }, message: 'ok' },
        status: 200,
        headers: {},
        config: {},
      } as never)
    const res = await instance.get('/users/list')
    expect(res).toEqual({ code: 0, data: { items: [], total: 0 }, message: 'ok' })
  })

  test('401：提示「未授权，请重新登录」+ 清三键 + 跳 /login', async () => {
    vi.setSystemTime(1_000_000)
    const { store, location } = stubEnv('/devices')
    store.set('token', 't1')
    store.set('userInfo', '{"id":"u1"}')
    store.set('userRole', 'admin')
    instance.defaults.adapter = () => Promise.reject(httpError(401, {}))

    await expect(instance.get('/users/list')).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('未授权，请重新登录')
    expect(store.has('token')).toBe(false)
    expect(store.has('userInfo')).toBe(false)
    expect(store.has('userRole')).toBe(false)
    expect(location.href).toBe('/login')
  })

  test('401 时已在 /login 页：清键但不整页跳转（F-08 关联行为）', async () => {
    vi.setSystemTime(2_000_000)
    const { store, location } = stubEnv('/login')
    store.set('token', 'stale')
    instance.defaults.adapter = () => Promise.reject(httpError(401, {}))

    await expect(instance.post('/auth/login', {})).rejects.toBeTruthy()
    expect(store.has('token')).toBe(false)
    expect(location.href).toBe('http://localhost/')
  })

  test('非 401 错误：不清键、不跳转，只 toast 归一文案', async () => {
    const { store, location } = stubEnv('/devices')
    store.set('token', 't1')
    instance.defaults.adapter = () => Promise.reject(httpError(502, { message: '网关超时' }))

    await expect(instance.get('/users/list')).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('网关超时')
    expect(store.has('token')).toBe(true)
    expect(location.href).toBe('http://localhost/')
  })
})
