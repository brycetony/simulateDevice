/**
 * 契约测试：AUTH-09 用户管理接口形状（适配器级——捕获真实请求断言 URL/方法/参数/请求体）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-09（判据先于实现存在，禁止按实现反推）。
 * 期望路径/参数为契约字面量；「add/edit 请求体不含密码字段」是本条核心不变量。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { stubEnv } from '../helpers/harness'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const api = await import('../../src/api')

interface Captured {
  method?: string
  url?: string
  params?: Record<string, unknown>
  data?: unknown
}

function captureAdapter(sink: Captured) {
  return async (config: Record<string, unknown>) => {
    sink.method = config.method as string
    sink.url = config.url as string
    sink.params = config.params as Record<string, unknown>
    sink.data = config.data
    return { data: { code: 0, data: {}, message: 'ok' }, status: 200, headers: {}, config }
  }
}

beforeEach(() => {
  stubEnv('/users')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AUTH-09 用户管理接口形状', () => {
  test('getUserList → GET /users/list 携带分页与 search 参数', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.getUserList({ page: 2, pageSize: 5, search: 'x' })
    expect(c.method).toBe('get')
    expect(c.url).toBe('/users/list')
    expect(c.params).toEqual({ page: 2, pageSize: 5, search: 'x' })
  })

  test('addUser → POST /users/add，请求体不含 password 键（核心不变量）', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.addUser({ username: 'bob', nickName: 'Bob', email: '', role: 'admin', status: '1' })
    expect(c.method).toBe('post')
    expect(c.url).toBe('/users/add')
    const body = JSON.parse(c.data as string)
    expect('password' in body).toBe(false)
    expect(body).toEqual({ username: 'bob', nickName: 'Bob', email: '', role: 'admin', status: '1' })
  })

  test('editUser → PUT /users/edit，整对象回传（S5 白名单 OPEN——照现状锁定）且不含 password', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    const row = { _id: 'u1', username: 'bob', nickName: 'B', email: '', role: 'admin', status: '0' }
    await api.editUser(row)
    expect(c.method).toBe('put')
    expect(c.url).toBe('/users/edit')
    const body = JSON.parse(c.data as string)
    expect('password' in body).toBe(false)
    expect(body).toEqual(row)
  })

  test('deleteUser → DELETE /users/delete/:id', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.deleteUser('9')
    expect(c.method).toBe('delete')
    expect(c.url).toBe('/users/delete/9')
  })
})
