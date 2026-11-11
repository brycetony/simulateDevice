/**
 * 契约测试：CMD-10 路由与访问语义（路由表纯数据静态检查，仿 test_auth_14）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-10 / AUTH-14（判据先于实现存在，禁止按实现反推）。
 * 期望值（路径/name/无 roles）为契约字面量，禁止 import 实现内常量。
 */

import { describe, expect, test } from 'vitest'
import { routes } from '../../src/router/routes'

function findCmdRoute() {
  const layout = routes.find((r) => r.path === '/')
  return layout?.children?.find((c) => c.path === 'devices/:id/commands')
}

describe('CMD-10 路由与访问语义', () => {
  test('路由存在：/devices/:id/commands 已注册于 Layout 子路由', () => {
    const cmd = findCmdRoute()
    expect(cmd).toBeDefined()
    expect(cmd?.path).toBe('devices/:id/commands')
  })

  test('name 为 DeviceCommands（跳转与唯一入口依赖）', () => {
    const cmd = findCmdRoute()
    expect(cmd?.name).toBe('DeviceCommands')
  })

  test('未声明 meta.roles → 按 AUTH-14 登录即可访问（现状锁定，收紧待 B1/Q10 答复）', () => {
    const cmd = findCmdRoute()
    expect(cmd?.meta?.roles).toBeUndefined()
  })
})
