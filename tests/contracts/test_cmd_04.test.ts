/**
 * 契约测试：CMD-04 表单必填（版本 A：resStream 非必填）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-04（判据先于实现存在，禁止按实现反推）。
 * 全空表单恰 4 条错误是裁决①版本 A 的核心判据（resStream 恢复必填则变 5 条，届时须重裁）。
 */

import { describe, expect, test } from 'vitest'
import {
  buildEmptyCommandForm,
  buildManualParam,
  validateCommandForm,
  validateCommandParam,
} from '../../src/utils/commands'

describe('CMD-04 表单必填', () => {
  test('全空表单恰 4 条错误：commandName/commandType/streamType/reqStream，resStream 不在内', () => {
    const errors = validateCommandForm(buildEmptyCommandForm('dev-1'))
    expect(errors.map((e) => e.field)).toEqual(['commandName', 'commandType', 'streamType', 'reqStream'])
  })

  test('版本 A：resStream 留空且四必填齐全 → 零错误', () => {
    const form = {
      ...buildEmptyCommandForm('dev-1'),
      commandName: 'read-coils',
      commandType: 'GET',
      streamType: 'ASCII',
      reqStream: '[$a|1]',
    }
    expect(validateCommandForm(form)).toEqual([])
  })

  test('参数行手工种子恰 4 条错误：名称/类型/键名/标签（种子长度为 1 不报）', () => {
    const errors = validateCommandParam(buildManualParam())
    expect(errors.map((e) => e.field)).toEqual(['paramName', 'paramType', 'paramKey', 'paramLabel'])
  })

  test('参数行长度缺失（null）报错；paramValue 空与 isUnique false 不报', () => {
    const param = { ...buildManualParam(), paramName: 'n', paramType: 'string', paramKey: 'k', paramLabel: 'l', paramLength: null as unknown as number }
    const errors = validateCommandParam(param)
    expect(errors.map((e) => e.field)).toEqual(['paramLength'])
  })

  test('空串判定不 trim：reqStream 为单个空格不报错（未裁决行为锁现状，沿 users.ts 先例）', () => {
    const form = { ...buildEmptyCommandForm('dev-1'), commandName: 'n', commandType: 'GET', streamType: 'HEX', reqStream: ' ' }
    expect(validateCommandForm(form)).toEqual([])
  })
})
