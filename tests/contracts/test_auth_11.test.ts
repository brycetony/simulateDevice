/**
 * 契约测试：AUTH-11 superadmin UI 保护谓词（合法 UI 便利——非安全边界，见 auth.md 顶部声明）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-11（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { canToggleStatus, canDeleteUser, assignableRoles } from '../../src/utils/users'

describe('AUTH-11 superadmin 保护谓词', () => {
  test('状态开关：superadmin 禁用，其余角色可切换', () => {
    expect(canToggleStatus('superadmin')).toBe(false)
    expect(canToggleStatus('admin')).toBe(true)
    expect(canToggleStatus('user')).toBe(true)
  })

  test('删除按钮：superadmin 隐藏，其余角色可见', () => {
    expect(canDeleteUser('superadmin')).toBe(false)
    expect(canDeleteUser('admin')).toBe(true)
    expect(canDeleteUser('user')).toBe(true)
  })

  test('角色下拉可选项 = admin 与 user（禁止经 UI 以 superadmin 新建）', () => {
    expect(assignableRoles()).toEqual(['admin', 'user'])
  })
})
