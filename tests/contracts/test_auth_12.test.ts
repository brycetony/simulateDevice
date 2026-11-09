/**
 * 契约测试：AUTH-12 用户表单校验（username/nickName 必填；email 非必填须过格式；role/status 无 required）。
 * 断言来源: docs/contracts/auth.md 条目 AUTH-12（判据先于实现存在，禁止按实现反推）。
 * 空串判定不做 trim（「空格用户名」行为 OPEN，锁现状 ''）。
 */

import { describe, expect, test } from 'vitest'
import { validateUserForm } from '../../src/utils/users'

describe('AUTH-12 表单校验', () => {
  test('username 空 → 必填错误', () => {
    expect(validateUserForm({ username: '', nickName: 'B', email: '' })).toEqual([
      { field: 'username', message: '请输入用户名' },
    ])
  })

  test('nickName 空 → 必填错误', () => {
    expect(validateUserForm({ username: 'bob', nickName: '', email: '' })).toEqual([
      { field: 'nickName', message: '请输入姓名' },
    ])
  })

  test('email 非必填：空串合法', () => {
    expect(validateUserForm({ username: 'bob', nickName: 'B', email: '' })).toEqual([])
  })

  test('email 非空须过格式校验：非法报错 / 合法通过（与 el-form async-validator 对齐）', () => {
    expect(validateUserForm({ username: 'bob', nickName: 'B', email: 'abc' })).toEqual([
      { field: 'email', message: '请输入正确的邮箱地址' },
    ])
    // TLD ≥2 字母：'a@b.c' 拒绝（与线上 el-form 行为一致），'a@b.com' 通过
    expect(validateUserForm({ username: 'bob', nickName: 'B', email: 'a@b.c' })).toEqual([
      { field: 'email', message: '请输入正确的邮箱地址' },
    ])
    expect(validateUserForm({ username: 'bob', nickName: 'B', email: 'a@b.com' })).toEqual([])
  })

  test('role/status 无 required：空值不产生校验错误', () => {
    // validateUserForm 契约上只校验三个字段——role/status 空不应出现任何报错
    expect(validateUserForm({ username: 'bob', nickName: 'B', email: '' })).toEqual([])
  })
})
