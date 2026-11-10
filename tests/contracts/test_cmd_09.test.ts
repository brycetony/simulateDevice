/**
 * 契约测试：CMD-09 列表消费（只读 items/total，code 零消费钉现状）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-09（判据先于实现存在，禁止按实现反推）。
 * 200+非零 code 照常返回是钉现状判据——OPEN B2 答复前禁止改读 code（与 AUTH C15/Q13 同判）。
 */

import { describe, expect, test } from 'vitest'
import { consumeListResponse } from '../../src/utils/commands'

describe('CMD-09 列表消费', () => {
  test('正常消费：只取 data.items 与 data.total', () => {
    expect(
      consumeListResponse({ code: 0, data: { items: [{ _id: 'c1' }, { _id: 'c2' }], total: 2 } }),
    ).toEqual({ items: [{ _id: 'c1' }, { _id: 'c2' }], total: 2 })
  })

  test('钉现状：code 非零照常返回（成功判定纯 HTTP status，禁止改读 code）', () => {
    expect(consumeListResponse({ code: 500, data: { items: [], total: 0 } })).toEqual({ items: [], total: 0 })
  })

  test('形状容错：无 code 字段照常消费（只依赖 data.items/data.total）', () => {
    expect(consumeListResponse({ data: { items: ['x'], total: 1 } })).toEqual({ items: ['x'], total: 1 })
  })
})
