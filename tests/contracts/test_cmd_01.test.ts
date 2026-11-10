/**
 * 契约测试：CMD-01 命令四接口形状（适配器级——捕获真实请求断言 URL/方法/参数/请求体）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-01 / CMD-07（判据先于实现存在，禁止按实现反推）。
 * 期望路径/参数为契约字面量；核心不变量：deviceId 只进 path 不进 query、add 载荷无 _id 键（Q16）。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { stubEnv } from '../helpers/harness'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const api = await import('../../src/api')
const { buildCommandPayload, buildEmptyCommandForm } = await import('../../src/utils/commands')

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
    return { data: { code: 0, data: { items: [], total: 0 }, message: 'ok' }, status: 200, headers: {}, config }
  }
}

beforeEach(() => {
  stubEnv('/devices')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CMD-01 命令四接口形状', () => {
  test('getDeviceCommands → GET /devices/d1/commands，deviceId 只进 path 不进 query', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.getDeviceCommands({ deviceId: 'd1', page: 2, pageSize: 5, search: 'x' })
    expect(c.method).toBe('get')
    expect(c.url).toBe('/devices/d1/commands')
    expect(c.params).toEqual({ page: 2, pageSize: 5, search: 'x' })
  })

  test('search 空串照发（query 携带 search 空串，前端不过滤）', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.getDeviceCommands({ deviceId: 'd1', page: 1, pageSize: 10, search: '' })
    expect(c.method).toBe('get')
    expect(c.url).toBe('/devices/d1/commands')
    expect(c.params).toEqual({ page: 1, pageSize: 10, search: '' })
  })

  test('addCommand → POST /devices/command，载荷经 buildCommandPayload：deviceId 在 body、无 _id 键', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    // _id 用空串构造（编辑残留的 falsy 态）：剥离逻辑必须在载荷层真实起效，而非依赖键缺席
    const form = { ...buildEmptyCommandForm('d1'), _id: '', commandName: 'read' }
    await api.addCommand(buildCommandPayload(form).payload)
    expect(c.method).toBe('post')
    expect(c.url).toBe('/devices/command')
    const body = JSON.parse(c.data as string)
    expect('_id' in body).toBe(false)
    expect(body.deviceId).toBe('d1')
    expect(body.commandName).toBe('read')
  })

  test('editCommand → PUT /devices/command，body 含 _id（整包回传）', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    const form = { ...buildEmptyCommandForm('d1'), _id: 'cmd-9', commandName: 'read' }
    await api.editCommand(buildCommandPayload(form).payload)
    expect(c.method).toBe('put')
    expect(c.url).toBe('/devices/command')
    const body = JSON.parse(c.data as string)
    expect(body._id).toBe('cmd-9')
    expect(body.deviceId).toBe('d1')
  })

  test('deleteCommand → DELETE /devices/command/9', async () => {
    const c: Captured = {}
    api.instance.defaults.adapter = captureAdapter(c)
    await api.deleteCommand('9')
    expect(c.method).toBe('delete')
    expect(c.url).toBe('/devices/command/9')
  })
})
