/**
 * 契约测试：AUTH-06 路由守卫判定（/login 恒放行 / 无 token 踢登录 / 越权回默认页 / 放行）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-06（判据先于实现存在，禁止按实现反推）。
 * 期望跳转值为契约字面量 '/login' '/devices'，禁止 import 实现内常量。
 */

import { describe, expect, test } from 'vitest'
import { resolveGuard } from '../../src/utils/auth'

describe('AUTH-06 路由守卫', () => {
  test('/login 恒放行（无 token 也放行；已登录再访不重定向——C17 锁现状）', () => {
    expect(resolveGuard('/login', undefined, null, '')).toEqual({ allow: true })
  })

  test('其余路由无 token → /login', () => {
    expect(resolveGuard('/devices', undefined, null, '')).toEqual({ redirect: '/login' })
    expect(resolveGuard('/users', ['superadmin'], null, '')).toEqual({ redirect: '/login' })
  })

  test('有 token 但角色不在 requiredRoles → /devices', () => {
    expect(resolveGuard('/users', ['superadmin'], 't1', 'admin')).toEqual({
      redirect: '/devices',
    })
  })

  test('角色为空串访问受限路由 → /devices（边界）', () => {
    expect(resolveGuard('/users', ['superadmin'], 't1', '')).toEqual({ redirect: '/devices' })
  })

  test('superadmin 访问受限路由 → 放行', () => {
    expect(resolveGuard('/users', ['superadmin'], 't1', 'superadmin')).toEqual({ allow: true })
  })

  test('无角色要求的路由，登录即可访问', () => {
    expect(resolveGuard('/tools', undefined, 't1', 'user')).toEqual({ allow: true })
    expect(resolveGuard('/devices/:id/commands', undefined, 't1', 'admin')).toEqual({
      allow: true,
    })
  })
})
