/**
 * 契约测试：AUTH-05 错误文案归一（string/string[] 双兼容 + 状态级兜底 + 网络级固定文案）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-05（判据先于实现存在，禁止按实现反推）。
 * 所有期望文案为契约字面量，禁止从实现 import 常量。
 */

import { describe, expect, test } from 'vitest'
import { resolveApiErrorMessage } from '../../src/utils/auth'

describe('AUTH-05 错误文案归一', () => {
  test('400 + message 字符串 → 直用后端文案', () => {
    expect(resolveApiErrorMessage(400, { message: '用户名已存在' })).toBe('用户名已存在')
  })

  test('各状态级兜底文案（message 缺失）', () => {
    expect(resolveApiErrorMessage(400, {})).toBe('请求参数错误')
    expect(resolveApiErrorMessage(403, {})).toBe('拒绝访问')
    expect(resolveApiErrorMessage(404, {})).toBe('请求错误，未找到该资源')
    expect(resolveApiErrorMessage(500, {})).toBe('服务器端出错')
  })

  test('未枚举状态码（502 等）→ 未知错误', () => {
    expect(resolveApiErrorMessage(502, {})).toBe('未知错误')
  })

  test('message 为数组 → 逗号空格连接（双兼容，Q8 OPEN）', () => {
    expect(resolveApiErrorMessage(422, { message: ['字段A无效', '字段B无效'] })).toBe(
      '字段A无效, 字段B无效',
    )
  })

  test('message 为空串 → 走兜底（不返回空文案）', () => {
    expect(resolveApiErrorMessage(400, { message: '' })).toBe('请求参数错误')
  })

  test('网络级错误（无 status）→ 固定文案，不读 body', () => {
    expect(resolveApiErrorMessage(undefined, undefined)).toBe('网络错误，请稍后重试')
  })
})
