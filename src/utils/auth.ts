/**
 * AUTH 域纯函数（从 Login.vue / Layout.vue / api/index.ts / router/index.ts 抽取）。
 *
 * 判据来源：docs/contracts/auth.md（AUTH-01..14，2026-11-09 裁决①确认）；
 * 故障回归：docs/faults/faults.md。本文件是被测实现；规则本身永远以契约为准。
 * 边界约定：禁止 import axios / vue-router / element-plus——
 * 副作用（发请求、导航、toast、localStorage 读写时机）全部由接线层施加。
 */
import md5 from 'crypto-js/md5'

// ---------- AUTH-02 / AUTH-07 / F-03：会话三键 ----------

export const SESSION_KEYS = ['token', 'userInfo', 'userRole'] as const

export interface LoginSuccess {
  access_token: string
  user: { role?: string; [key: string]: unknown }
}

/** [AUTH-02] 会话写入集合：token / userInfo / userRole 三键，形状锁定。 */
export function sessionWrites(result: LoginSuccess): Array<readonly [string, string]> {
  return [
    ['token', String(result.access_token ?? '')],
    ['userInfo', JSON.stringify(result.user ?? {})],
    ['userRole', String(result.user?.role ?? '')],
  ]
}

export interface SessionAction {
  clearKeys: readonly string[]
  redirect: '/login'
  confirm: boolean
}

/** [AUTH-07] 手动登出：清三键 + 跳 /login，需用户确认（纯前端，不调后端）。 */
export function logoutAction(): SessionAction {
  return { clearKeys: SESSION_KEYS, redirect: '/login', confirm: true }
}

/** [AUTH-08 / F-05] 改密成功后的强制登出：免确认——旧 token 留站是陷阱态。 */
export function forcedLogoutAction(): SessionAction {
  return { clearKeys: SESSION_KEYS, redirect: '/login', confirm: false }
}

// ---------- AUTH-01 / AUTH-08：凭证摘要与载荷 ----------

/** [AUTH-01] md5 32 位小写 hex；明文禁止出网。 */
export function digestPassword(plain: string): string {
  return md5(plain).toString()
}

/** [AUTH-01] 登录载荷。 */
export function buildLoginPayload(
  username: string,
  password: string,
): { username: string; password: string } {
  return { username, password: digestPassword(password) }
}

/** [AUTH-08] 改密载荷（userId 照现状取 userInfo.id——C19/Q15 OPEN，字段分歧未裁）。 */
export function buildChangePasswordPayload(
  userId: unknown,
  oldPassword: string,
  password: string,
): { userId: unknown; oldPassword: string; password: string } {
  return {
    userId,
    oldPassword: digestPassword(oldPassword),
    password: digestPassword(password),
  }
}

// ---------- AUTH-03：Bearer 附加 ----------

export type Headers = Record<string, string>

/** [AUTH-03] 有 token 附加 Bearer 头；无/空 token 不附加空头；不覆盖既有头。 */
export function attachAuthHeader(headers: Headers, token: string | null | undefined): Headers {
  if (!token) return { ...headers }
  return { ...headers, Authorization: `Bearer ${token}` }
}

// ---------- AUTH-04 / AUTH-13 / F-08：401 语义 ----------

export const UNAUTHORIZED_MESSAGE = '未授权，请重新登录'

/** [AUTH-04 / F-08] 401 跳转决策：已在 /login 页时不整页跳转（防 reload 抹提示与输入）。 */
export function redirectTargetOn401(currentPath: string): '/login' | null {
  return currentPath === '/login' ? null : '/login'
}

/** [AUTH-13] 并发 401 去重：窗口期（默认 1000ms）内仅首次需要提示/跳转。 */
export function shouldNotifyUnauthorized(
  now: number,
  lastNotifiedAt: number,
  windowMs = 1000,
): boolean {
  return now - lastNotifiedAt >= windowMs
}

// ---------- AUTH-05 / F-02：错误文案归一（跨域共用，暂挂 auth.md） ----------

const STATUS_FALLBACK: Readonly<Record<number, string>> = {
  400: '请求参数错误',
  403: '拒绝访问',
  404: '请求错误，未找到该资源',
  500: '服务器端出错',
}

export const NETWORK_ERROR_MESSAGE = '网络错误，请稍后重试'
export const UNKNOWN_ERROR_MESSAGE = '未知错误'

/**
 * [AUTH-05 / F-02] 错误文案决策（纯函数，不弹窗）：
 * string 直用；string[] join(', ')（双兼容，Q8 OPEN）；缺失/空走状态级兜底；
 * status 为 undefined（网络级错误）走固定文案。任何输入不抛错。
 */
export function resolveApiErrorMessage(
  status: number | undefined,
  body: { message?: unknown } | undefined,
): string {
  if (status === undefined) return NETWORK_ERROR_MESSAGE
  const m = body?.message
  if (typeof m === 'string' && m !== '') return m
  if (Array.isArray(m) && m.length > 0) {
    return m.filter((x): x is string => typeof x === 'string').join(', ')
  }
  return STATUS_FALLBACK[status] ?? UNKNOWN_ERROR_MESSAGE
}

// ---------- AUTH-06：路由守卫判定 ----------

export type GuardDecision = { allow: true } | { redirect: '/login' | '/devices' }

/**
 * [AUTH-06] /login 恒放行（已登录再访不重定向——C17 OPEN 锁现状）；
 * 无 token → /login；声明 requiredRoles 且当前角色不在其中 → /devices；其余放行。
 * 守卫是 UX 分流，非安全边界（auth.md 顶部声明）。
 */
export function resolveGuard(
  toPath: string,
  requiredRoles: readonly string[] | undefined,
  token: string | null,
  role: string,
): GuardDecision {
  if (toPath === '/login') return { allow: true }
  if (!token) return { redirect: '/login' }
  if (requiredRoles && !requiredRoles.includes(role)) return { redirect: '/devices' }
  return { allow: true }
}

// ---------- F-12：userInfo 防御性解析 ----------

/** [F-12] null / 非法 JSON / 非对象输入一律返回 {}，不抛错（原状顶层 parse 直接白屏）。 */
export function parseUserInfo(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
