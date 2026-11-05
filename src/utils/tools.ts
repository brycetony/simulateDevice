/**
 * 工具页纯函数（从 src/views/Tools.vue 抽取）。
 *
 * 判据来源：docs/contracts/tools.md（TOOLS-01..08，2026-11-05 裁决确认）。
 * 本文件是被测实现；规则本身永远以契约为准，此处注释只标注对应条目。
 */

import CryptoJS from 'crypto-js'

// ---------- TOOLS-01：密码学安全随机源 ----------

/**
 * [TOOLS-01] 返回 [0, maxExclusive) 的均匀随机整数。
 * 使用 crypto.getRandomValues + 拒绝采样消除模偏差。禁止 Math.random。
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0 || !Number.isInteger(maxExclusive)) {
    throw new Error('maxExclusive 必须是正整数')
  }
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
  const buf = new Uint32Array(1)
  do {
    globalThis.crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return buf[0] % maxExclusive
}

// ---------- TOOLS-01 / TOOLS-02：密码生成 ----------

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const CHAR_CLASSES: Record<Exclude<keyof PasswordOptions, 'length'>, string> = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

/**
 * [TOOLS-01] 随机源为 CSPRNG；[TOOLS-02] 所选每类字符至少出现 1 个。
 * 保底字符经 Fisher-Yates 均匀洗牌，避免类别字符固定出现在头部。
 * @param randomInt 随机源注入点（默认 CSPRNG；测试可替换）
 */
export function generatePassword(
  options: PasswordOptions,
  randomInt: (maxExclusive: number) => number = secureRandomInt,
): string {
  const selected: string[] = []
  for (const key of Object.keys(CHAR_CLASSES) as (keyof typeof CHAR_CLASSES)[]) {
    if (options[key]) selected.push(CHAR_CLASSES[key])
  }
  if (selected.length === 0) {
    throw new Error('至少选择一种字符类型')
  }
  if (options.length < selected.length) {
    throw new Error('密码长度不能小于所选字符类别数')
  }

  const pool = selected.join('')
  const chars: string[] = selected.map((cs) => cs[randomInt(cs.length)])
  while (chars.length < options.length) {
    chars.push(pool[randomInt(pool.length)])
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

// ---------- TOOLS-08：哈希（小写 hex） ----------

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512'

/** [TOOLS-08] 输出小写十六进制（CryptoJS toString 默认）。 */
export function generateHash(input: string, algorithm: HashAlgorithm): string {
  switch (algorithm) {
    case 'md5':
      return CryptoJS.MD5(input).toString()
    case 'sha1':
      return CryptoJS.SHA1(input).toString()
    case 'sha256':
      return CryptoJS.SHA256(input).toString()
    case 'sha512':
      return CryptoJS.SHA512(input).toString()
  }
}

// ---------- TOOLS-03 / TOOLS-04：对称加密（ECB，有意保留，见契约已知边界 1） ----------

export type SymmetricAlgorithm = 'aes' | 'des' | 'tripledes'

const ECB_OPTIONS = {
  mode: CryptoJS.mode.ECB,
  padding: CryptoJS.pad.Pkcs7,
}

// ---------- TOOLS-09：密钥长度校验（按 UTF-8 字节数） ----------

const KEY_BYTE_LENGTHS: Record<SymmetricAlgorithm, readonly number[]> = {
  aes: [16, 24, 32],
  des: [8],
  tripledes: [24],
}

/** [TOOLS-09] 密钥的 UTF-8 字节数（注意：非字符数，é=2 字节、密=3 字节）。 */
export function keyByteLength(key: string): number {
  return new TextEncoder().encode(key).length
}

function assertKeyLength(key: string, algorithm: SymmetricAlgorithm): void {
  const n = keyByteLength(key)
  if (!KEY_BYTE_LENGTHS[algorithm].includes(n)) {
    throw new Error(`密钥长度须为 ${KEY_BYTE_LENGTHS[algorithm].join('/')} 字节（UTF-8），当前 ${n} 字节`)
  }
}

/** [TOOLS-03] ECB + PKCS7，密钥取 UTF-8 字节。同明文+密钥 → 密文确定性一致。 */
export function encryptText(input: string, key: string, algorithm: SymmetricAlgorithm): string {
  assertKeyLength(key, algorithm)
  const parsedKey = CryptoJS.enc.Utf8.parse(key)
  switch (algorithm) {
    case 'aes':
      return CryptoJS.AES.encrypt(input, parsedKey, ECB_OPTIONS).toString()
    case 'des':
      return CryptoJS.DES.encrypt(input, parsedKey, ECB_OPTIONS).toString()
    case 'tripledes':
      return CryptoJS.TripleDES.encrypt(input, parsedKey, ECB_OPTIONS).toString()
  }
}

export type DecryptResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'invalid-input' | 'invalid-key' | 'failed' }

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

/**
 * [TOOLS-04] 解密失败显式返回原因，禁止静默空串。
 * invalid-input = 密文不是合法 Base64；failed = 解密不成立
 * （ECB 无完整性校验，密钥错误与密文损坏归并，见契约已知边界 2）。
 */
export function decryptText(
  ciphertext: string,
  key: string,
  algorithm: SymmetricAlgorithm,
): DecryptResult {
  // [TOOLS-09] 密钥长度不合法 → 显式 invalid-key（先于格式检查，成本最低且信息最明确）
  if (!KEY_BYTE_LENGTHS[algorithm].includes(keyByteLength(key))) {
    return { ok: false, reason: 'invalid-key' }
  }
  const compact = ciphertext.replace(/\s+/g, '')
  if (compact.length === 0 || compact.length % 4 !== 0 || !BASE64_PATTERN.test(compact)) {
    return { ok: false, reason: 'invalid-input' }
  }
  try {
    const parsedKey = CryptoJS.enc.Utf8.parse(key)
    let plain: string
    switch (algorithm) {
      case 'aes':
        plain = CryptoJS.AES.decrypt(compact, parsedKey, ECB_OPTIONS).toString(CryptoJS.enc.Utf8)
        break
      case 'des':
        plain = CryptoJS.DES.decrypt(compact, parsedKey, ECB_OPTIONS).toString(CryptoJS.enc.Utf8)
        break
      case 'tripledes':
        plain = CryptoJS.TripleDES.decrypt(compact, parsedKey, ECB_OPTIONS).toString(
          CryptoJS.enc.Utf8,
        )
        break
    }
    if (!plain) {
      return { ok: false, reason: 'failed' }
    }
    return { ok: true, value: plain }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

// ---------- TOOLS-05：Base64 变体（非 RFC 4648，有意行为） ----------

/** [TOOLS-05] encodeURIComponent + btoa 变体。é → "JUMzJUE5"（标准 RFC4648 为 "w6k="，差异是有意的）。 */
export function encodeBase64(text: string): string {
  return btoa(encodeURIComponent(text))
}

/** [TOOLS-05] 上述变体的逆运算，与 encodeBase64 自洽可逆。 */
export function decodeBase64(encoded: string): string {
  return decodeURIComponent(atob(encoded))
}

// ---------- TOOLS-07：JSON 高亮（XSS 不变量） ----------

/**
 * [TOOLS-07] 生成 JSON 语法高亮 HTML。非法 JSON 抛错（调用方负责提示）。
 * 安全性依赖：先整体 HTML 转义（& < >），再插入高亮 span，最后交给 v-html——
 * 任意输入的输出不得包含未转义的用户内容。重构此函数必须保持该顺序。
 */
export function highlightJson(input: string): string {
  const obj = JSON.parse(input)
  const formatted = JSON.stringify(obj, null, 2)

  // 1) 先转义（TOOLS-07 的关键顺序：转义在前，插 span 在后）
  let highlighted = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 2) 再插入高亮 span（span 内容来自已转义文本）
  highlighted = highlighted
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
    .replace(/:\s*"([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false|null)\b/g, ': <span class="json-boolean">$1</span>')
    .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>')
    .replace(/,\n/g, '<span class="json-comma">,</span>\n')

  // 3) 最后处理空白
  return highlighted.replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;')
}
