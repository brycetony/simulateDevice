# simulateDevice

设备模拟平台前端（Vue 3 + TypeScript + Vite）。

## 开发流程（契约制）

**任务卡是需求进入本仓库的唯一形态**——没有卡不开工（`AGENTS.md §0`，PR 阶段由 gate 强制）。

新需求进门两步：

1. **建卡**：复制 `docs/tasks/T-template.md` → `T-<下一个编号>-<短名>.md`。
   可以自己填，也可以对 agent 说「为 XXX 需求按 T-template 起草任务卡」——
   但目标 / 验收判据 / 范围边界三栏必须由人拍板。
   卡里「硬约束」栏引用不到契约条目？说明该域还没有契约，
   先让 agent 出约束考古报告（`docs/tasks/RESEARCH-template.md`），人裁决后回填契约，再建卡。
2. **开工**：对 agent 说「按 docs/tasks/T-xxx.md 实现，先遵守 AGENTS.md」。

关键文档：

- `AGENTS.md` —— agent 工作规则（入口决策树、高风险范围、域前缀注册表）
- `docs/contracts/` —— 契约（验收判据的唯一源头，变更须 owner 复核；`.github/CODEOWNERS` 标注复核责任人——单人仓库不设 GitHub 侧评审强制，防自批死锁）
- `docs/tasks/` —— 任务卡 + 考古报告；`docs/faults/` —— 历史故障库
- `.github/workflows/gate.yml` —— 质量门禁：任务卡存在性、测试溯源 ID 真实性、
  契约↔测试双向链接、diff 尺寸、契约测试

测试：`npm test`（契约测试位于 `tests/contracts/`，文件头必须声明断言来源的契约/故障 ID）。

## 技术栈

Vue 3 `<script setup>` SFCs —— 参见 [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup)
与 [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup)。
