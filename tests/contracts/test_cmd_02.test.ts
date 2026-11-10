/**
 * 契约测试：CMD-02 命令实体与种子（九字段/七字段形状、三种种子终态）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-02（判据先于实现存在，禁止按实现反推）。
 * 期望值为契约字面量（字段清单与种子默认值经 DeviceCommands.vue:204-224 现状核对）。
 */

import { describe, expect, test } from 'vitest'
import {
  buildEmptyCommandForm,
  buildPlaceholderParam,
  buildManualParam,
  resetCommandForm,
} from '../../src/utils/commands'

describe('CMD-02 命令实体与种子', () => {
  test('空表单终态：九字段全空初值、params 空数组、不含 _id 键', () => {
    const form = buildEmptyCommandForm('dev-1')
    expect(form).toEqual({
      deviceId: 'dev-1',
      commandName: '',
      commandType: '',
      streamType: '',
      reqStream: '',
      resStream: '',
      storeKey: '',
      params: [],
    })
    expect('_id' in form).toBe(false)
  })

  test('占位符种子：七字段、paramType 为 string、paramLength 为 1、label 原样整段', () => {
    expect(buildPlaceholderParam('[$a|1]')).toEqual({
      paramName: '',
      paramType: 'string',
      paramKey: '',
      paramLabel: '[$a|1]',
      paramLength: 1,
      paramValue: '',
      isUnique: false,
    })
  })

  test('手工种子：paramType 空串、paramLabel 空串（与占位符种子不一致为现状锁定，OPEN Q15）', () => {
    const manual = buildManualParam()
    expect(manual.paramType).toBe('')
    expect(manual.paramLabel).toBe('')
    expect(manual.paramLength).toBe(1)
    expect(manual.isUnique).toBe(false)
  })

  test('reset 终态：deviceId 保留、其余清空、_id 显式 undefined（对齐原 resetForm）', () => {
    const reset = resetCommandForm('dev-2')
    expect(reset.deviceId).toBe('dev-2')
    expect(reset.commandName).toBe('')
    expect(reset.commandType).toBe('')
    expect(reset.streamType).toBe('')
    expect(reset.reqStream).toBe('')
    expect(reset.resStream).toBe('')
    expect(reset.storeKey).toBe('')
    expect(reset.params).toEqual([])
    expect(reset._id).toBeUndefined()
  })
})
