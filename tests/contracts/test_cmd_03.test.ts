/**
 * 契约测试：CMD-03 枚举（commandType/streamType/paramType，大小写敏感）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-03（判据先于实现存在，禁止按实现反推）。
 * 期望枚举值为契约字面量，非 import 实现常量断言自身。
 */

import { describe, expect, test } from 'vitest'
import {
  COMMAND_TYPES,
  STREAM_TYPES,
  PARAM_TYPES,
  isCommandType,
  isStreamType,
  isParamType,
} from '../../src/utils/commands'

describe('CMD-03 枚举', () => {
  test('三组枚举字面量：GET SET / ASCII HEX / string number', () => {
    expect(COMMAND_TYPES).toEqual(['GET', 'SET'])
    expect(STREAM_TYPES).toEqual(['ASCII', 'HEX'])
    expect(PARAM_TYPES).toEqual(['string', 'number'])
  })

  test('commandType 谓词：成员通过，小写 get 拒绝（大小写敏感）', () => {
    expect(isCommandType('GET')).toBe(true)
    expect(isCommandType('SET')).toBe(true)
    expect(isCommandType('get')).toBe(false)
  })

  test('streamType 谓词：成员通过，小写 ascii 拒绝', () => {
    expect(isStreamType('ASCII')).toBe(true)
    expect(isStreamType('HEX')).toBe(true)
    expect(isStreamType('ascii')).toBe(false)
  })

  test('paramType 谓词：成员通过，首字母大写 Number 拒绝', () => {
    expect(isParamType('string')).toBe(true)
    expect(isParamType('number')).toBe(true)
    expect(isParamType('Number')).toBe(false)
  })
})
