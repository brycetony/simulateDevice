/**
 * 契约测试：AUTH-02 会话三键（token/userInfo/userRole 形状锁定）
 * 及 AUTH-07/08 登出与强制登出决策。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-02 / AUTH-07 / AUTH-08
 * （判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import {
  SESSION_KEYS,
  sessionWrites,
  logoutAction,
  forcedLogoutAction,
} from '../../src/utils/auth'

describe('AUTH-02 会话三键', () => {
  test('写入集合 = token/userInfo/userRole 三键，形状锁定', () => {
    const writes = sessionWrites({
      access_token: 't1',
      user: { id: 'u1', role: 'admin', username: 'bob' },
    })
    expect(writes).toEqual([
      ['token', 't1'],
      ['userInfo', '{"id":"u1","role":"admin","username":"bob"}'],
      ['userRole', 'admin'],
    ])
  })

  test('键名常量恰为三键（守卫/拦截器/Layout 的共同接口）', () => {
    expect([...SESSION_KEYS]).toEqual(['token', 'userInfo', 'userRole'])
  })

  test('role 缺失 → userRole 写空串（禁止字符串 "undefined"）', () => {
    const writes = sessionWrites({ access_token: 't1', user: { id: 'u1' } })
    expect(writes[2]).toEqual(['userRole', ''])
  })

  test('access_token 缺失 → token 写空串（不产生 "undefined" 假 token）', () => {
    const writes = sessionWrites({
      access_token: undefined as unknown as string,
      user: { role: 'admin' },
    })
    expect(writes[0]).toEqual(['token', ''])
  })
})

describe('AUTH-07 / AUTH-08 登出决策', () => {
  test('手动登出：清三键 + 跳 /login + 需确认', () => {
    expect(logoutAction()).toEqual({
      clearKeys: ['token', 'userInfo', 'userRole'],
      redirect: '/login',
      confirm: true,
    })
  })

  test('改密后强制登出：清三键 + 跳 /login + 免确认（F-05 陷阱态消除）', () => {
    expect(forcedLogoutAction()).toEqual({
      clearKeys: ['token', 'userInfo', 'userRole'],
      redirect: '/login',
      confirm: false,
    })
  })
})
