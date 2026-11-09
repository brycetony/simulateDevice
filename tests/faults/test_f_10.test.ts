/**
 * 故障回归：F-10 状态开关假态（原状 Users.vue:180-184 无 try/catch，失败后 switch 停在
 * 错误态、列表不刷新）。回滚接线（row.status 翻回 + fetchUsers）属组件层，人工/GUI 判据覆盖；
 * 本文件锁回滚所依赖的翻转语义（nextStatus）与角色禁用谓词（canToggleStatus）。
 * 断言来源: docs/faults/faults.md 条目 F-10（复现判据先于修复存在，禁止按修复后实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { nextStatus, canToggleStatus } from '../../src/utils/users'

describe('F-10 失败回滚语义', () => {
  test('开关先翻转后失败的回滚：nextStatus(to) === from', () => {
    // 用户把 '1' 打到 '0'，请求失败 → 回滚值应为 nextStatus('0') === '1'
    expect(nextStatus('0')).toBe('1')
    expect(nextStatus('1')).toBe('0')
  })

  test('superadmin 开关在源头禁用（禁用态不产生失败请求）', () => {
    expect(canToggleStatus('superadmin')).toBe(false)
  })
})
