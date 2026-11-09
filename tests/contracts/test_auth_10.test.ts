/**
 * 契约测试：AUTH-10 role/status 枚举（值域与形态锁定——status 为字符串，禁止数字混用）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-10（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import {
  USER_ROLES,
  ROLE_LABELS,
  STATUS_ENABLED,
  STATUS_DISABLED,
  nextStatus,
} from '../../src/utils/users'

describe('AUTH-10 枚举', () => {
  test('role 值域严格 = {superadmin, admin, user}', () => {
    expect([...USER_ROLES]).toEqual(['superadmin', 'admin', 'user'])
  })

  test('status 为字符串形态（"1"/"0"），非数字', () => {
    expect(STATUS_ENABLED).toBe('1')
    expect(STATUS_DISABLED).toBe('0')
    expect(STATUS_ENABLED).not.toBe(1)
    expect(typeof STATUS_ENABLED).toBe('string')
  })

  test('角色标签映射（标签字面量为契约形态）', () => {
    expect(ROLE_LABELS).toEqual({
      superadmin: '超级管理员',
      admin: '管理员',
      user: '用户',
    })
  })

  test('nextStatus 翻转与往返（F-10 失败回滚依赖）', () => {
    expect(nextStatus('1')).toBe('0')
    expect(nextStatus('0')).toBe('1')
    expect(nextStatus(nextStatus('1'))).toBe('1')
  })
})
