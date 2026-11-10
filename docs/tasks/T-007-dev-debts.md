# T-007 DEV 域欠账登记（旁域发现，未开工）

> **本卡是欠账登记卡，不是开工卡**：DEV 域（设备管理：Devices.vue / Monitor.vue 及设备相关 api）
> 尚无契约；正式开工须走冷启动（`domain-coldstart` → 裁决①），届时本卡条目并入考古输入，
> 另建正式任务卡执行。
> 来源：CMD 域冷启动（T-006 裁决①，2026-11-10）三视角/红队旁域发现，
> 裁决⑤「另起 DEV 欠账卡」——防 T-006 diff>800 硬卡 + 域边界干净。

## 1. 目标【登记卡，非开工】

登记 CMD 冷启动中发现的 DEV 域欠账与前置风险，防止遗失；DEV 域开工时作为考古输入。

## 2. 硬约束（本卡不触发实现，无业务契约约束）

- 无（DEV 域无契约——`docs/contracts/devices.md` 在 AGENTS.md §6 已注册但未回填，
  与 CMD 冷启动前同型）

## 3. 未决问题（欠账清单，行号为 2026-11-10 master@d166371 实测）

- **D18（=A9/A12）** Monitor sendData 无 try/catch、发送按钮无防重——连点 N 次即对设备发 N 次
  （`Monitor.vue:175-183`）；失败 unhandled rejection。红队定级 P1（设备为真实硬件则升）
- **A11** Monitor getDeviceInfo 无兜底（onMounted 失败即空白页）
- **A13** Devices 启停不 await 即刷新 / 无错误处理——假态（F-10 同型；`Devices.vue:198-209`）
- **A17** Monitor socket 硬编码 localhost:3000（`Monitor.vue:196` 附近）
- **A18** Monitor console.log 打印设备完整响应（F-06 同型）
- **前置风险（开工第一 PR）**：@vueuse/core 幻影依赖——`Monitor.vue:73` import 而
  package.json 未声明（仅 lock 传递依赖 9.13.0）——供应链高风险（AGENTS.md §3.4），
  DEV 域开工前必须先显式声明
- **联动**：若 Q10（命令库产品意图）裁决「命令实体应驱动下发」，Monitor 发送路径并入 CMD
  后续批，本卡相应缩围

## 4. 验收判据【登记卡，非开工】

- 无（开工时另建正式任务卡走 §7 流水线，本卡条目转为考古输入）

## 5. 范围边界

- IN：仅登记与证据留痕
- OUT：一切实现（含 @vueuse/core 显式化——随 DEV 开工首 PR 处理，不提前动手）

---

## 6. 执行记录（任务进行中填写）

| 日期 | 动作 | 耗时 | 备注 |
|------|------|------|------|
| 11-10 | CMD 冷启动三视角 + 红队旁域发现，T-006 裁决⑤批「另起 DEV 欠账卡」，本卡建立 | — | 证据出处：RESEARCH-cmd-2026-11-10.md §2/§5.3 |
