/**
 * 契约测试：TOOLS-07 JSON 高亮输出必须保持 HTML 转义（XSS 不变量）。
 * 断言来源: docs/contracts/tools.md 条目 TOOLS-07（判据先于实现存在，禁止按实现反推）。
 */

import { describe, expect, test } from 'vitest'
import { highlightJson } from '../../src/utils/tools'

describe('TOOLS-07 XSS 不变量', () => {
  test('值中含 <script> → 输出中是 &lt;script，无裸 <script', () => {
    const html = highlightJson('{"a":"<script>alert(1)</script>"}')
    expect(html).toContain('&lt;script')
    expect(html).not.toContain('<script')
  })

  test('值中含 "><img onerror=...>（JSON 转义引号）→ 无裸 <img', () => {
    const html = highlightJson('{"a":"\\"><img src=x onerror=alert(1)>"}')
    expect(html).not.toContain('<img')
  })

  test('值中含 & 与 <> 混合 → 除高亮 span/br 外无任何裸标签', () => {
    const html = highlightJson('{"a":"<b>&amp;</b>"}')
    expect(html).not.toMatch(/<(?!\/?(span|br)\b)/)
  })

  test('非法 JSON → 抛错（调用方负责提示，不产出半截 HTML）', () => {
    expect(() => highlightJson('{"a":}')).toThrow()
  })

  test('正常输出含高亮 span（确保不变量测试测的是高亮路径，不是转义空转）', () => {
    const html = highlightJson('{"key":"value"}')
    expect(html).toContain('json-key')
    expect(html).toContain('json-string')
  })
})
