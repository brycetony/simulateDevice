/**
 * Users 域纯函数（从 src/views/Users.vue 抽取）。
 *
 * 判据来源：docs/contracts/auth.md 条目 AUTH-09..12（2026-11-09 裁决①）；
 * 故障回归：docs/faults/faults.md F-10。本文件是被测实现；规则以契约为准。
 * 边界约定：禁止 import axios / vue-router / element-plus / Vue 组件。
 */

// ---------- AUTH-10：role / status 枚举 ----------

export const USER_ROLES = ['superadmin', 'admin', 'user'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  user: '用户',
}

export const STATUS_ENABLED = '1'
export const STATUS_DISABLED = '0'

/** [AUTH-10 / F-10] 状态翻转（'1'↔'0'，字符串；失败回滚时反向使用）。 */
export function nextStatus(status: string): string {
  return status === STATUS_ENABLED ? STATUS_DISABLED : STATUS_ENABLED
}

// ---------- AUTH-11：superadmin UI 保护谓词（合法 UI 便利，非安全边界） ----------

export function canToggleStatus(role: string): boolean {
  return role !== 'superadmin'
}

export function canDeleteUser(role: string): boolean {
  return role !== 'superadmin'
}

/** 角色下拉可选项：排除 superadmin（禁止经 UI 以 superadmin 角色新建）。 */
export function assignableRoles(): UserRole[] {
  return USER_ROLES.filter((role) => role !== 'superadmin')
}

/** [AUTH-11] 编辑态（已有 _id）禁改 username。 */
export function usernameEditable(hasId: boolean): boolean {
  return !hasId
}

// ---------- AUTH-12：用户表单校验（契约判据的纯函数形态） ----------
// 注意：空串判定不做 trim——「空格用户名」行为未裁决（OPEN），锁现状 ''。

export interface UserFormInput {
  username: string
  nickName: string
  email: string
}

export interface FormFieldError {
  field: keyof UserFormInput
  message: string
}

// email 正则与 element-plus（async-validator 4.x）的 type:'email' 规则对齐：
// TLD 须 ≥2 个字母（'a@b.c' 拒绝 / 'a@b.com' 通过）——隐性决策已登记 T-004 §7。
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** [AUTH-12] username/nickName 必填；email 非必填但非空时须过格式校验；role/status 无 required。 */
export function validateUserForm(form: UserFormInput): FormFieldError[] {
  const errors: FormFieldError[] = []
  if (form.username === '') {
    errors.push({ field: 'username', message: '请输入用户名' })
  }
  if (form.nickName === '') {
    errors.push({ field: 'nickName', message: '请输入姓名' })
  }
  if (form.email !== '' && !EMAIL_RE.test(form.email)) {
    errors.push({ field: 'email', message: '请输入正确的邮箱地址' })
  }
  return errors
}
