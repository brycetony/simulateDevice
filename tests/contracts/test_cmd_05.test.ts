/**
 * 契约测试：CMD-05 占位符解析（版本 B：一占位符一行，非贪婪）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-05（判据先于实现存在，禁止按实现反推）。
 * 期望值为独立复算（RESEARCH-cmd §0.2 防转义污染实测记录），非实现自产；
 * 版本 B 修复 D14：贪婪原行为将相邻及隔任意文本的多占位符并为一段。
 */

import { describe, expect, test } from 'vitest'
import { parsePlaceholders } from '../../src/utils/commands'

describe('CMD-05 占位符解析', () => {
  test('单占位符：前后有文本 → 恰一段整串', () => {
    expect(parsePlaceholders('AA[$p1|d1]BB')).toEqual(['[$p1|d1]'])
  })

  test('相邻两占位符：各自独立成段（D14 修复，原贪婪并为一行）', () => {
    expect(parsePlaceholders('[$a|1][$b|2]')).toEqual(['[$a|1]', '[$b|2]'])
  })

  test('隔文本两占位符：中间普通文本不吞入段（D14 波及面修复）', () => {
    expect(parsePlaceholders('[$a|1] mid [$b|2]')).toEqual(['[$a|1]', '[$b|2]'])
  })

  test('内嵌两占位符：前后加文本 → 仍两段', () => {
    expect(parsePlaceholders('x[$a|1]y[$b|2]z')).toEqual(['[$a|1]', '[$b|2]'])
  })

  test('空段不匹配：A 侧空与 B 侧空均无结果', () => {
    expect(parsePlaceholders('[$x|]')).toEqual([])
    expect(parsePlaceholders('[$|b]')).toEqual([])
  })

  test('未闭合不匹配', () => {
    expect(parsePlaceholders('[$a|1')).toEqual([])
  })

  test('无占位符：返回空数组（非 null）', () => {
    expect(parsePlaceholders('plain text')).toEqual([])
  })
})
