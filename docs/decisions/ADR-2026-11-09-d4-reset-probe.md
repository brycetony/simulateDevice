# ADR：D4（resetForm 残留 role/status）探针关闭——不构成缺陷

- 日期：2026-11-09　裁决人：brycetony（owner 验收执行）　记录：agent
- 背景：AUTH 域考古（RESEARCH-auth-2026-11-09 D4）怀疑 `Users.vue` 的 `resetForm` 不重置
  role/status，上次编辑选择会带入下一次新增（`Object.assign` 清单缺两字段，`Users.vue:253-259`）。
  裁决①定为「探针实证后再裁」，探针列入 T-004 §8 人工判据第 7 条。
- 探针结果：编辑用户（选 role=admin）→ 关闭对话框 → 点新增 → **role/status 无残留**
  （element-plus `resetFields` 的初始值快照机制实际复位了这两个字段）。
- 决策：**D4 关闭，不修复，不占用 F 编号**（faults 库 F-04 空缺注记维持）。
  `Object.assign` 清单不含 role/status 的写法保留现状——显式补全属可选加固，无行为差异。
- 影响：AUTH-12 契约不增加 reset 相关条目；本 ADR 即「为什么 D4 没修」的出处。
