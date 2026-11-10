/**
 * 契约测试：CMD-06 参数行联动（版本 B：全量同步，D15/D16 修复）。
 * 断言来源: docs/contracts/commands.md 条目 CMD-06（判据先于实现存在，禁止按实现反推）。
 * 孤儿行判定：paramLabel 不在 reqStream 且 paramName/paramKey/paramValue 全空 → 删；
 * 期望行对象为字面量构造，不 import 实现的种子函数作期望值。
 */

import { describe, expect, test } from 'vitest'
import { syncParams } from '../../src/utils/commands'

const SEED_A = {
  paramName: '',
  paramType: 'string',
  paramKey: '',
  paramLabel: '[$a|1]',
  paramLength: 1,
  paramValue: '',
  isUnique: false,
}

describe('CMD-06 参数行联动', () => {
  test('追加：空 params + 一个占位符 → 追加一行种子（字面量断言）', () => {
    expect(syncParams('[$a|1]', [])).toEqual([SEED_A])
  })

  test('幂等：同 label 已有带输入的行 → 保留原行不重复追加，重复调用结果稳定', () => {
    const existing = { ...SEED_A, paramName: 'N', paramKey: 'k', paramLength: 2, paramValue: 'v', isUnique: true }
    const once = syncParams('[$a|1]', [existing])
    expect(once).toEqual([existing])
    expect(syncParams('[$a|1]', once)).toEqual([existing])
  })

  test('孤儿行：label 消失且无输入 → 删；有输入 → 留；手工行（label 空）→ 不删（D15 判据）', () => {
    const orphanEmpty = { ...SEED_A, paramLabel: '[$b|2]' }
    const orphanFilled = { ...SEED_A, paramLabel: '[$c|3]', paramName: 'N' }
    const manual = { ...SEED_A, paramLabel: '', paramName: 'M' }
    const next = syncParams('[$a|1]', [orphanEmpty, orphanFilled, manual])
    expect(next.map((p) => p.paramLabel)).toEqual(['[$c|3]', '', '[$a|1]'])
  })

  test('同名相邻：params 已有两行同 label → 留首行（幂等去重）', () => {
    const first = { ...SEED_A, paramName: 'A' }
    const second = { ...SEED_A, paramName: 'B' }
    expect(syncParams('[$a|1]', [first, second])).toEqual([first])
  })
})
