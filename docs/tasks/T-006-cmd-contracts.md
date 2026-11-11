# T-006 CMD 域契约化与缺陷修复（domain-coldstart 首个真实冷启动）

> 建卡完成：裁决①于 2026-11-10 通过（owner 批复「全推荐」），三栏定稿。
> 材料出处：workflow dwfrun-36fdf520（T-005 演练产物）——RESEARCH 报告、票拟包全文与
> 裁决记录见 `docs/tasks/RESEARCH-cmd-2026-11-10.md`（正文 + 附录 A/B）。

## 1. 目标（一句话，含业务目的）【2026-11-10 裁决①确认】

为 CMD 域（设备命令：DeviceCommands.vue 与设备命令相关 api）建立契约并配套不变量测试，
按裁决修复确认缺陷（占位符缺陷链 D14/D15/D16 + 双弹窗 D17→F-13），使该域获得与
TOOLS/AUTH 域同等的「契约可执行」保障；本任务同时是 `domain-coldstart` workflow 的
首个真实冷启动落地。

## 2. 硬约束（引用契约条目 ID，不重抄内容）

- `docs/contracts/commands.md`：CMD-01..10 + 头部边界声明 + OPEN 挂账（v1.0，
  2026-11-10 裁决①）——**批 1 PR 交付**
- `docs/faults/faults.md`：F-13（D17，CMD 侧双弹窗）——**批 2 PR 交付**；随批 2 同步修订
  faults.md 头部编号规则（PR16 审查 P1）：「D↔F 一一对应」仅适用 AUTH 域 D1-D12 先例；
  自 D13 起 D 全局续排、F 按确认修复登记顺序分配（D13 随 D17 消解、D14/D15/D16 随契约
  版本 B 修复判据入契约测试，均不占 F 号——空缺原因随批 2 注明）
- 跨域自动生效（commands.md 头部声明，不重复抄写）：AUTH-03/04/05/13
  （Bearer 附加 / 2xx 剥壳 / 错误文案归一单点 / 401 并发去重）
- AGENTS.md §3 高风险类变更：现行条目 3「DeviceCommands.vue 的命令下发路径」经裁决①认定失实
  （A1/D22，该路径在本文件不存在）——D22 独立 PR 修正后，本任务批 2 的 DeviceCommands.vue
  接线改造不属高风险；本任务全程不触及 Monitor.vue 发送路径与 Devices.vue 启停（真高风险面）。

## 3. 未决问题（本任务不做 / 需要澄清的）【2026-11-10 裁决①：owner 批复「全推荐」】

**分歧六项已裁**（详录：RESEARCH-cmd 附录 B）：① CMD-05/06 版本 B + CMD-04 版本 A；
② D 全局续排 D13+；③ D17→新开 F-13；④ 批 1 纯函数 / 批 2 接线；⑤ 旁域发现归 DEV 另卡（T-007）；
⑥ D22 独立 PR。Q16（add 载荷显式剥离 `_id:undefined`）按 CMD-07 推荐列随批 1 生效；Q2 随版本 B 落地。

**政策**：政策 A 沿用（gate 绿 + 审查无 P0/P1 即自动合并，T-004 起生效）——裁决①时按
「默认沿用」声明，owner 未提出异议，可随时改判。口径出处：裁决①呈现文本
（本卡与 RESEARCH 附录 B 为该口径的首个仓内落库记录，PR16 审查 P2-4）。

**OPEN（答前禁止实现，AGENTS.md §1；详表见 commands.md 末表与 RESEARCH §4）**：

- 前端域内：Q1 占位符 A/B 段语义、Q3 resStream 必填恢复、Q4 storeKey 唯一性、Q5 isUnique 语义、
  Q6 paramLength 字节/字符义、Q15 paramType 种子默认值统一（现状 '' 与 'string' 并存如实锁定）
- 后端必答（转 owner 挂账，答后回填）：B1 /devices/command* 归属与角色校验（定 S1 定级与
  CMD-10 是否加 roles）；B2 是否存在 200+失败 code（**与 AUTH C15/Q13 合并一问，两域同判同修**）；
  B3 search 匹配字段；B4 params 整包回传=全量替换还是合并；B5 删除是否级联
- Q10 命令库产品意图（实体全仓零消费、与 Monitor 发送零关联）：若裁「命令实体应驱动下发」，
  CMD 契约范围扩至 send 路径（另批），本任务判据不覆盖该分支

## 4. 验收判据（照抄契约判据 + 本任务补充）【2026-11-10 裁决①确认】

- [x] gate 全绿：溯源（测试头声明的 CMD-xx 已存在于 commands.md）/ 反链（commands.md 引用的
      测试文件真实存在；未交付批以批注代路径）/ diff≤800 / `npx vitest run tests/contracts tests/faults` 全绿
      ✅ PR16/17/18/19（批 2）全过
- [x] 基线不破：旧 121 例零回归；新增约 41 例（批 1 交付 test_cmd_02..09 共 33 例，
      批 2 交付 test_cmd_01/10 共 8 例；合计 121→162）✅ 162/162（37 文件）
- [x] F-13 判据：DeviceCommands.vue 三处调用方 ElMessage.error（:286,330,393）移除，
      错误提示单点归拦截器（GUI 人工判据：制造 API 失败仅一弹）✅ 代码侧随批 2；GUI 判据
      → ✅ 2026-11-11 GUI 8/8（见 §8）
- [x] GUI 人工清单固化 `docs/acceptance/gui-checklist-cmd.md`（8 条：删除确认框取消静默+确认删除刷新 /
      X-ESC 静默 / API 失败单弹 / 占位符联动一符一行 / 表单校验双轨 / 搜索重置第一页 / reset 探针 /
      编辑新增分流+入口——PR19 审查 P1 后补回删除成功刷新路径）
      ✅ 随批 2 落库 → ✅ 2026-11-11 owner 执行 8/8 通过（见 §8）
- [x] 组件接线仅调纯函数，逻辑零内联残留（占位符解析 / 参数联动 / 表单校验 / 提交分流 /
      枚举常量全部走 src/utils/commands.ts；边界同 utils/users.ts 头注）✅ 批 2
- [x] §8 整体验收回填（不回填不算 Done——AGENTS.md §7）✅ 2026-11-11 GUI 8/8 后回填

## 5. 范围边界【2026-11-10 裁决①确认】

- IN：`docs/contracts/commands.md`、`src/utils/commands.ts`、`tests/contracts/test_cmd_01..10`、
  DeviceCommands.vue 接线改造（含 D17/D13 随行消解、D14/D15/D16 随版本 B 落地）、
  F-13 登记（faults.md）、`docs/acceptance/gui-checklist-cmd.md`、
  D22 规则修正（AGENTS.md §3.3，独立 PR）
- OUT：Monitor.vue / Devices.vue 一切变更（DEV 另卡 T-007）、后端一切变更、新增任何依赖
  （含 @vueuse/core 显式化——扩域至 Monitor 才触发）、可选项 D19/D20/D21/D23/D24/D25
  （默认不做，点名才做）、gate.yml 修改（A15 盲区仅记备注）
- 顺序硬约束：裁决① → 回填 commands.md → 同批挂 CMD-xx 测试（gate.yml 溯源 + 反链双向约束
  契约与测试同 PR 一致性，A15 盲区所致）
- 顺序约束 2：D22 规则 PR 先于批 2 合并（执行序：批 1 → D22 → 批 2）；若倒置，批 2 触及
  DeviceCommands.vue 须按 AGENTS.md 现行 §3.3 留人工复核，不走政策 A 自动合并（PR16 审查 P2）

---

## 6. 执行记录（任务进行中填写）

| 日期 | 动作 | 耗时 | 备注 |
|------|------|------|------|
| 11-10 | 需求来源：CMD 域冷启动（domain-coldstart run dwfrun-36fdf520，T-005 演练产出票拟包） | 1h16m（无人值守） | 考古 19 候选 + 三视角 32 分歧 + OPEN 21 |
| 11-10 | 裁决①：owner 批复「全推荐」——契约 CMD-01..10 / 修 D14·D15·D16·D17（D13 随消解）/ 编号 D13+ / F-13 新开 / 两批切法 / 旁域归 T-007 / D22 独立 PR；政策 A 沿用 | <5m | owner；记录见 RESEARCH-cmd 附录 B |
| 11-10 | PR16（建卡：RESEARCH 归档 + 卡 + T-007）审查 1×P1+5×P2 全修后政策 A 合并 | 12m | code-reviewer 第 2 轮起 0×P0 |
| 11-10 | 批 1 执行：commands.md + utils/commands.ts + test_cmd_02..09（33 例）；本地 154/154 | 35m | agent |
| 11-10 | PR17（批 1）审查：0×P0+0×P1+2×P2（CMD-06 空值定义 / F-13 前向引用限定词）全修后政策 A 合并；682 行 | 10m | code-reviewer |
| 11-10 | PR18（D22 规则修正）审查：0×P0+1×P1（流程：规则 PR 须 owner 人批，不走政策 A）+1×P2（能力锚定，已修）；**待 owner 人批合并** | 10m | code-reviewer；批 2 合并的前置 |
| 11-10 | 批 2 执行：DeviceCommands.vue 接线（枚举常量/syncParams/双轨校验/buildCommandPayload/isUserCancelled/consumeListResponse/reset，三处 ElMessage.error 移除=F-13）+ test_cmd_01/10（8 例）+ F-13 登记 + faults 编号规则修订 + GUI 清单 8 条 | 30m | agent |
| 11-10 | PR19（批 2）审查：0×P0+1×P1+3×P2（GUI 判据删除刷新被丢 / add 载荷空约束 / test_cmd_10 判据错位 / 2xx 无 data 静默挂 B2）修复后待序 | 10m | code-reviewer |
| 11-11 | PR18 owner 人批合并（规则 PR 例外路径）→ PR19 政策 A 合并（ad00f2c / a408d93），162/162 | — | owner 1 次 + agent |
| 11-11 | owner GUI 验收 8/8 通过 → §8 回填 | ~5m | owner；**T-006 Done** |

## 7. 新增决策（实现中发现契约没写的，等人确认后回填契约）

- **2xx 无 data 体的静默边界**（PR19 审查 P2-3，2026-11-10 agent 登记）：列表加载 catch {}
  会吞掉「HTTP 2xx 但 body 无 data」的 TypeError（代理返 HTML / B2 场景），用户零提示；
  与 Users.vue:166 既有模式同型。**不单独修**（只改一处即造成两域不对称），随 B2/Q9 后端
  答复与 AUTH C15/Q13 同判同修，届时在拦截器或 consume 层统一兜底。等 owner 确认方向。
- 编辑残留的额外后端字段（createdAt/__v 等）随整包回传进入 add 载荷——既有行为（reset 只重置
  九字段），与 D25 白名单相关，随 B4 答复一并裁。

## 8. 整体验收与运行反馈（合并后回填，**不回填不算 Done**——AGENTS.md §7）

### 可自动判据（命令 / 脚本；逐步固化为 GUI 自动化）

- [x] `npx vitest run` → 162/162 全绿（27→37 文件；基线 121 之上只增不减）✅ 2026-11-11 master@a408d93 复验
- [x] gate 五项在本任务各 PR 全部通过 ✅ PR16/17/18/19（含两次审查修复后的重跑）
- [ ] GUI 自动化固化（web-gui-tester 跑下方人工判据 1-8）——阶段任务，不阻塞 Done

### 人工判据（步骤化；视觉 / 手感 / 联调必须人眼）

**owner 于 2026-11-11 执行，8/8 通过 ✅**（清单 `docs/acceptance/gui-checklist-cmd.md`）

1. [x] 删除确认框：取消静默 + 确认「删除成功」+ 列表刷新 ✅
2. [x] X / ESC 关确认框同样静默 ✅
3. [x] API 失败单点一弹（F-13：列表/新增/删除各仅一弹，无双弹无英文技术文案）✅
4. [x] 占位符联动一符一行（相邻两行 / 隔文本两行 / 删文本空行消失、填过行保留）✅
5. [x] 空表单恰 4 条必填（响应码流不在内）；参数行必填拦截 ✅
6. [x] 搜索回车 / 清空均重置回第一页 ✅
7. [x] reset 探针：表单全空、deviceId 保留、无编辑残留 ✅
8. [x] 编辑 PUT 含 _id / 新增 POST 无 _id；「命令管理」入口跳转正常 ✅

### 运行反馈

- **domain-coldstart 冷启动 → 会话接手实现段全程跑通**：owner 介入 3 次（裁决①「全推荐」<5m；
  PR18 规则 PR 人批 1 次——裁决记录要求的例外路径，政策 A 正确让位；GUI 验收 ~5m），
  合计约 10 分钟；实现段 agent 全自动：4 PR 均过 code-reviewer 四样审查，累计逮出
  **3×P1+11×P2**（PR16：1+5 / PR17：0+2 / PR18：1+1 / PR19：1+3；处置：9 项随 PR 修复、
  PR18 的 P1 为流程约束以 owner 人批让位、PR19 的 P2-3 挂 §7 随 B2 裁——含「判据被静默删掉」
  「测试空约束」两类高危问题，四样审查制度价值再证），政策 A 自动合并 3 个 PR
  （PR18 规则 PR 例外人批）。测试 121→162（+41），契约 CMD-01..10，F-13，D13-D17 清账。
- workflow 产物质量：票拟包直接可执行（裁决→实现零返工）；两处事实笔误由汇总复核自纠
  （参数八字段→七字段、基线 3df7108→d166371 钉死）。
- 遗留移交：后端必答 B1-B5（B2 与 AUTH C15/Q13 合并一问，答后两域同判同修）；
  可选项 D19/D20/D21/D23/D24/D25 待点名；T-007 DEV 欠账卡（DEV 冷启动时并入考古）。

