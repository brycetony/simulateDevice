/**
 * 契约测试：AUTH-14 受限路由声明义务（路由表纯数据静态检查——防新增子路由漏配 roles）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-14（判据先于实现存在，禁止按实现反推）。
 * 期望值（'/users'、['superadmin']、'/login'）为契约字面量，禁止 import 实现内常量。
 */

import { describe, expect, test } from 'vitest'
import { routes } from '../../src/router/routes'

function flatten() {
  const all: Array<{ path: string; name?: string; roles?: string[] }> = []
  for (const r of routes) {
    all.push({ path: r.path, name: r.name as string | undefined, roles: r.meta?.roles })
    for (const c of r.children ?? []) {
      all.push({ path: `${r.path === '/' ? '' : r.path}/${c.path}`, name: c.name as string, roles: c.meta?.roles })
    }
  }
  return all
}

describe('AUTH-14 受限路由声明义务', () => {
  test('/users 必须声明 roles: ["superadmin"]', () => {
    const users = flatten().find((r) => r.path === '/users')
    expect(users?.roles).toEqual(['superadmin'])
  })

  test('声明了角色限制的路由恰为 /users（新增受限路由须显式声明，改动此断言须过契约复核）', () => {
    const restricted = flatten().filter((r) => Array.isArray(r.roles))
    expect(restricted.map((r) => r.path)).toEqual(['/users'])
  })

  test('/login 恒存在且无角色限制', () => {
    const login = flatten().find((r) => r.path === '/login')
    expect(login).toBeDefined()
    expect(login?.roles).toBeUndefined()
  })

  test('所有子路由均有唯一 name（守卫依赖路由表完整性）', () => {
    const names = flatten().map((r) => r.name).filter(Boolean)
    expect(new Set(names).size).toBe(names.length)
  })
})
