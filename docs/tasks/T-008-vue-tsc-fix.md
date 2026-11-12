# T-008 vue-tsc 构建类型检查修复 + 类型门禁

> 工程自身变更（AGENTS.md §0 豁免条款）：不涉业务域，§2 记豁免，不走调研模式。
> 来源：交接待办 5（master 既有）+ T-006 PR19 审查附带发现（tsconfig 缺 `@/` 映射，
> 全仓 TS2307 从未被查出）。

## 1. 目标【方向经 owner 确认（2026-11-11「继续」），三栏随 PR 呈批】

修复 `npm run build` 的 vue-tsc 类型检查（自仓库初始化起从未通过——TS6306/6310 挡在
最前，`@/` 别名无映射），并把类型检查纳入 gate 门禁：`.vue`/TS 变更自此有类型安全网
（T-006 批 2 改 500 行组件仅靠人眼审查的敞口补上）。

## 2. 硬约束

- 无业务契约约束（流程自身变更，AGENTS.md §0 豁免条款）
- AGENTS.md §3.1：`src/api/index.ts` 拦截器属高风险类变更——本任务触及该文件 **1 行**
  （类型断言，零运行时变更），PR 转**人工复核/owner 人批合并**，不走政策 A
- T-006 裁决记录：改 gate.yml（CI）须人批（批 2 PR 单独走）

## 3. 未决问题

- `@types/vue@^2` （Vue 2 类型包）疑似误装于 devDependencies——本次不动
  （skipLibCheck 掩盖无害；删除属依赖变更 §3.4 高风险，点名才做）
- **esbuild 转码目标隐式漂移**（PR22 审查 P2）：根 solution 化后 esbuild/vite 不再读到旧根
  tsconfig 的 target ES2021（它只认 tsconfig.json 文件名，现根为纯 solution）——本仓 src 零
  class/装饰器无可触发差异（build+162 全绿实证），但引入 class fields/装饰器前须显式钉住
  vite 侧 esbuild target；批 2 或后续任务裁决
- **utils/auth.ts:75 `export type Headers` 成死导出**（PR22 审查 P2）：签名内联后零引用方，
  按「OUT 风格性重构」保守保留——下个触及 auth.ts 的任务裁决去留

## 4. 验收判据

- [x] `npm run build` 全绿（vue-tsc -b 0 errors + vite build 成功）✅ 2026-11-11（10.2s）；master 复验 ✅ 2026-11-12（14.2s，f79022f）
- [x] vitest 162/162 零回归 ✅ master 复验（f79022f）
- [x] gate 新增类型检查步骤并全绿（PR23 run 实证：新步骤在 CI 执行且绿，29s——gate 仅 pull_request 触发，以 PR 终态 run 为证据）✅
- [x] §8 回填 ✅ 2026-11-12

## 5. 范围边界

- IN：tsconfig 三件套重构（根 solution 化 / app 收编 src 检查 + `@/` paths /
  node 补 composite）、8 处类型错误（错误实例口径；位置 5 处）修复（类型级零运行时变更，清单见 PR）、
  gate.yml 类型检查步骤（批 2）
- OUT：任何运行时行为变更、风格性重构、@types/vue 清理、vitest 的 tsconfig 接入
  （vitest 走 vite 别名解析，现状正确）

---

## 6. 执行记录（任务进行中填写）

| 日期 | 动作 | 耗时 | 备注 |
|------|------|------|------|
| 11-11 | 复现（TS6306/6310）→ tsconfig 三件套重构（根 solution 化，app 收编 src + paths，node 补 composite）→ 逼出并修复 8 处真实类型错误（错误实例口径；位置 5 处——初检记 9 系误计，PR24 审查重构现场复现为 8）（**本仓首次全量类型检查**）；build 10.2s + 162/162 | 35m | agent |
| 11-11 | PR22 审查（兼 §3.1 人工复核）：0×P0+0×P1+2×P2（esbuild target 隐式漂移/Headers 死导出，挂 §3）——axios dispatchRequest 源码实证 headers 再归一；**待 owner 人批合并** | 8m | code-reviewer |
| 11-11 | 批 2：gate.yml 增类型检查步骤（vue-tsc -b，npm ci 后测试前——比测试便宜） | 5m | agent；改 CI 须人批 |
| 11-12 | owner 人批 → PR22（ea20053）/ PR23（f79022f）依序合并；master 复验 build + 162/162 全绿 | — | owner 1 次 + agent |
| 11-12 | §4/§8 回填，T-008 Done | — | agent |

## 7. 新增决策（实现中发现契约没写的，等人确认后回填契约）

- 拦截器 headers 的类型口径：utils 边界（禁 import axios）与 axios InternalAxiosRequestConfig
  的 AxiosHeaders 类无法同时满足，采调用点 `as typeof config.headers` 断言对齐——
  运行时 axios 本就会再次归一 headers，断言只对齐类型。

## 8. 整体验收与运行反馈（合并后回填，**不回填不算 Done**——AGENTS.md §7）

### 可自动判据
- [x] `npm run build` 全绿（master@f79022f：vue-tsc 0 errors + vite build 14.2s）✅ 2026-11-12
- [x] vitest 162/162（master@f79022f）✅ 2026-11-12
- [x] gate 含类型检查步骤且全绿（PR23 终态 run 29s 实证；gate 仅 pull_request 触发，master 无直接 run——以合并 PR 的绿 run 为证据口径）✅

### 人工判据
- 无独立 GUI 判据（工程变更）；高风险 1 行（api/index.ts:24 断言（PR22 前行号 :22，加注后移））经 PR22 审查（axios dispatchRequest 源码实证）+ owner 人批覆盖 ✅

### 运行反馈
- 本仓**首次**全量类型检查即逼出 9 处真实错误（含 1 处签名与调用侧本就不兼容、1 处联合类型误访问、1 处渲染期可抛 TypeError 的 unknown 访问）——印证「类型检查进 CI」的必要性：这些错误全部存活于已合并的 162 绿基线上，纯靠 vitest 与人眼拦截不住。
- 工程教训（后续任务可用）：仓库源码为 CRLF、配置为 LF 的混合行尾——python 文本模式整文件重写会把 diff 从 ~12 行膨胀到 3400+ 行（gate 800 硬卡会拦），二进制模式 CR 感知替换是正解。
- 遗留：§3 三条未决（@types/vue 误装 / esbuild target 隐式漂移 / Headers 死导出）待点名裁决。
