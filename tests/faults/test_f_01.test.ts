/**
 * 故障回归：F-01 认证域吞失败原因（拦截器层——失败原因必须以归一文案直达 UI）。
 * 断言来源: docs/faults/faults.md 条目 F-01（复现判据先于修复存在，禁止按修复后实现反推）。
 * Login.vue/Users.vue 调用方侧（不再吞掉/不再二次弹窗）属接线改动，人工/GUI 判据覆盖。
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { stubEnv, httpError } from '../helpers/harness'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))
const { ElMessage } = await import('element-plus')
const { instance } = await import('../../src/api')

beforeEach(() => {
  ElMessage.error = vi.fn()
  stubEnv('/login')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('F-01 失败原因直达 UI（拦截器归一）', () => {
  test('登录失败 400 + 后端 message → toast 该 message（原状：调用方弹固定「登录失败」）', async () => {
    instance.defaults.adapter = () => Promise.reject(httpError(400, { message: '用户名或密码错误' }))
    await expect(instance.post('/auth/login', {})).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('用户名或密码错误')
  })

  test('message 缺失 → 状态级兜底文案仍达 UI', async () => {
    instance.defaults.adapter = () => Promise.reject(httpError(400, {}))
    await expect(instance.post('/auth/login', {})).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('请求参数错误')
  })

  test('网络级错误（无响应）→ 固定文案达 UI', async () => {
    instance.defaults.adapter = () => Promise.reject(httpError(undefined))
    await expect(instance.post('/auth/login', {})).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('网络错误，请稍后重试')
  })

  test('default 状态码（502）+ message 字符串 → 文案达 UI 不崩（F-02 关联）', async () => {
    instance.defaults.adapter = () => Promise.reject(httpError(502, { message: '后端重启中' }))
    await expect(instance.put('/users/edit', {})).rejects.toBeTruthy()
    expect(ElMessage.error).toHaveBeenCalledWith('后端重启中')
  })
})
