/**
 * 契约测试：CMD-07 提交分流（_id 有无 → edit/add；Q16：add 显式剥离 _id 键）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-07（判据先于实现存在，禁止按实现反推）。
 * add 载荷无 _id 键为关系不变量（原状依赖 axios 序列化隐式丢弃 undefined，Q16 已裁显式剥离）。
 */

import { describe, expect, test } from 'vitest'
import { buildCommandPayload, buildEmptyCommandForm } from '../../src/utils/commands'

describe('CMD-07 提交分流', () => {
  test('edit：_id 有值 → mode 为 edit，整包含 _id 与 deviceId 回传', () => {
    const form = { ...buildEmptyCommandForm('dev-1'), _id: 'cmd-9', commandName: 'read' }
    const { mode, payload } = buildCommandPayload(form)
    expect(mode).toBe('edit')
    expect(payload._id).toBe('cmd-9')
    expect(payload.deviceId).toBe('dev-1')
  })

  test('add：_id 键缺席（初始态）→ mode 为 add，载荷不含 _id 键（显式剥离）', () => {
    const { mode, payload } = buildCommandPayload(buildEmptyCommandForm('dev-1'))
    expect(mode).toBe('add')
    expect('_id' in payload).toBe(false)
  })

  test('边界：_id 为空串 → 走 add 且载荷不含 _id 键', () => {
    const form = { ...buildEmptyCommandForm('dev-1'), _id: '' }
    const { mode, payload } = buildCommandPayload(form)
    expect(mode).toBe('add')
    expect('_id' in payload).toBe(false)
  })
})
