/**
 * 契约测试：CMD-08 删除确认与取消分流（isUserCancelled 严格版）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-08（判据先于实现存在，禁止按实现反推）。
 * 依据：element-plus 2.9.2 默认 distinguishCancelAndClose=false，取消按钮与 X/ESC 的
 * reject 值均为字符串 cancel（安装源码 messageBox.mjs:54-58 实证，RESEARCH-cmd §0.3）。
 */

import { describe, expect, test } from 'vitest'
import { isUserCancelled } from '../../src/utils/commands'

describe('CMD-08 删除取消分流', () => {
  test('字符串 cancel（取消按钮与 X/ESC 的 reject 值）→ true（静默）', () => {
    expect(isUserCancelled('cancel')).toBe(true)
  })

  test('Error 对象与 undefined（API 失败）→ false（失败分流归拦截器单点 toast）', () => {
    expect(isUserCancelled(new Error('Request failed with status code 500'))).toBe(false)
    expect(isUserCancelled(undefined)).toBe(false)
  })

  test('字符串 close → false（严格版防回归：仅默认配置会出现的 cancel 算取消）', () => {
    expect(isUserCancelled('close')).toBe(false)
  })
})
