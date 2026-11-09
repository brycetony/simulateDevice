/**
 * 契约测试：AUTH-01 凭证摘要（md5 32 位小写 hex，明文禁止出网）+ AUTH-08 改密载荷。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-01 / AUTH-08（判据先于实现存在，禁止按实现反推）。
 * 向量说明：期望值为 macOS md5 命令独立生成的 RFC 1321 公开向量，非本实现自产。
 */

import { describe, expect, test } from 'vitest'
import {
  digestPassword,
  buildLoginPayload,
  buildChangePasswordPayload,
} from '../../src/utils/auth'

const MD5_EMPTY = 'd41d8cd98f00b204e9800998ecf8427e'
const MD5_ABC = '900150983cd24fb0d6963f7d28e17f72'
const MD5_SECRET = '5ebe2294ecd0e0f08eab7690d2a6ee69'
const MD5_PASSWORD = '5f4dcc3b5aa765d61d8327deb882cf99'

describe('AUTH-01 凭证摘要', () => {
  test('公开向量：空串 → d41d8cd…8427e（32 位小写 hex）', () => {
    expect(digestPassword('')).toBe(MD5_EMPTY)
    expect(digestPassword('')).toMatch(/^[0-9a-f]{32}$/)
  })

  test('公开向量：abc → 900150…17f72', () => {
    expect(digestPassword('abc')).toBe(MD5_ABC)
  })

  test('摘要不等于明文，且不同输入摘要不同', () => {
    const a = digestPassword('secret')
    const b = digestPassword('password')
    expect(a).not.toBe('secret')
    expect(a).toBe(MD5_SECRET)
    expect(b).toBe(MD5_PASSWORD)
    expect(a).not.toBe(b)
  })

  test('登录载荷：username 原样、password 为摘要（AUTH-01）', () => {
    expect(buildLoginPayload('bob', 'secret')).toEqual({
      username: 'bob',
      password: MD5_SECRET,
    })
  })

  test('改密载荷：两摘要独立且均为 32 位小写 hex（AUTH-08）', () => {
    const payload = buildChangePasswordPayload('u1', 'password', 'secret')
    expect(payload).toEqual({
      userId: 'u1',
      oldPassword: MD5_PASSWORD,
      password: MD5_SECRET,
    })
    expect(payload.oldPassword).toMatch(/^[0-9a-f]{32}$/)
    expect(payload.password).toMatch(/^[0-9a-f]{32}$/)
  })
})
