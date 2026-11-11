# 历史故障库（F-xx）

- 编号规则（T-004 裁决；T-006 裁决②③修订）：**仅确认修复项占号；否决/未决项空缺保留**
  （防 ID 漂移，否决记 ADR 于 `docs/decisions/`）。AUTH 域先例 D1-D12 与 F-01..F-12 一一对应；
  自 CMD 域起 D 编号全局续排（D13+）、F 按确认修复登记顺序分配——D13 随 D17 消解、
  D14/D15/D16 判据随契约测试落地（commands.md CMD-05/06），均不占 F 号（PR16 审查 P1）。
- 来源：`docs/tasks/RESEARCH-auth-2026-11-09.md` D 表（2026-11-09 裁决①，owner 批复「全推荐」）。
- 回归测试文件头必须声明本库条目 ID（AGENTS.md §2，gate 溯源校验）。

## F-01 认证域吞失败原因（D1）[确认修复·批 1b Login 侧 / 批 2 Users 侧]

- 现状：登录失败只弹固定「登录失败」丢弃 `error.message`（`Login.vue:62-63`）；
  用户新增/编辑失败的 ElMessage 被注释仅 `console.log`（`Users.vue:236-239`）——
  后端拒绝时用户零反馈，违反 TOOLS-04 显式失败。
- 修复判据：失败原因必须到达 UI（拦截器归一文案直达，调用方不再吞/不再重复弹）。
- 回归测试：tests/faults/test_f_01.test.ts（拦截器层）；调用方侧人工/GUI 判据，批 2 补 Users 侧。

## F-02 default 分支 join 必崩（D2）[确认修复·批 1a]

- 现状：default 分支 `error.response.data.message.join(', ')`——message 为字符串时抛 TypeError
  （抛在 ElMessage 参数求值处，**该分支自身永远弹不出任何提示**），`api/index.ts:50-51`。
- 修复判据：string 直用、string[] join、其余兜底，任何输入不抛错。
- 回归测试：tests/faults/test_f_02.test.ts

## F-03 401 残留会话键（D3）[确认修复·批 1b]

- 现状：401 只清 `token`，残留 `userInfo`/`userRole`（`api/index.ts:36-40`）；
  登出同样残留 `userInfo`（`Layout.vue:153-154`）。
- 修复判据：401 与登出清键集合 = 三键全集（AUTH-02/07）。
- 回归测试：tests/faults/test_f_03.test.ts

## F-04 resetForm 残留（D4）[空缺——探针实证后再裁]

- 裁决①：先写探针测试实证复现路径，再定是否修复（裁决出处见 T-004 §6 裁决①行与 RESEARCH 裁决记录）。

## F-05 改密后登出可被取消（D5）[确认修复·批 1b]

- 现状：改密成功 → `handleLogout()` 内含确认框，点取消则**携旧 token 留在站内**
  （`Layout.vue:177-179,150-152`）。
- 修复判据：改密成功路径免确认强制登出（`forcedLogoutAction` confirm=false，AUTH-08）。
- 回归测试：tests/contracts/test_auth_02.test.ts（forcedLogoutAction 免确认断言）

## F-06 凭证泄漏日志（D6）[确认修复·批 1b Login/api 侧 / 批 2 Users 侧]

- 现状：`console.log` 打印含 `access_token` 的完整登录响应（`Login.vue:56`）、
  整个 error.response（`api/index.ts:31`）、用户行数据（`Users.vue:181,195,198,227`）。
- 修复判据：真实流程入口在 console.log 替换为抛错函数后不抛。
- 回归测试：tests/faults/test_f_06.test.ts（api 层）；组件侧人工/GUI 判据，批 2 补 Users 侧。

## F-07 初始密码黑箱（D7）[空缺——OPEN 待 Q3]

## F-08 登录页 401 整页 reload（D8）[确认修复·批 1b]

- 现状：登录失败若后端返 401 → 拦截器 `window.location.href='/login'` 对登录页整页 reload，
  抹掉错误提示与已输入表单（`api/index.ts:36-40` 不检查当前路径）。
- 修复判据：`redirectTargetOn401('/login')` → null（AUTH-04）。
- 回归测试：tests/faults/test_f_08.test.ts

## F-09 假登录循环（D9）[空缺——OPEN 待 Q13]

## F-10 状态开关假态（D10）[确认修复·批 2]

- 现状：`handleStatusChange` 无 try/catch，`editUser` 失败 → unhandled rejection，
  switch 停在错误态、列表不刷新（`Users.vue:180-184`；`main.ts` 无 errorHandler）。
- 修复判据：失败回滚 UI 状态并刷新；失败原因由拦截器 toast（F-01 单点）。
- 回归测试：tests/faults/test_f_10.test.ts（回滚翻转语义与角色禁用谓词）；
  回滚接线属组件层，人工/GUI 判据覆盖。

## F-11 双弹窗与技术文案（D11）[确认修复·批 1b Layout 侧 + 批 2 Users 侧]

- 现状：调用方二次弹窗 + axios 英文技术文案兜底与拦截器弹窗叠加
  （`Users.vue:166,213`、`Layout.vue:181`）。
- 修复判据：错误提示单点（拦截器），调用方只管 loading/关框。
- 回归测试：拦截器单点见 tests/faults/test_f_01.test.ts；Layout/Users 接线属组件层，
  人工/GUI 判据覆盖。

## F-12 Layout 顶层 JSON.parse 白屏（D12）[确认修复·批 1a]

- 现状：`Layout.vue:119` 顶层 `JSON.parse(localStorage.getItem('userInfo') || '{}')`
  无防御，非法 JSON 即整个 Layout 白屏。
- 修复判据：`parseUserInfo` 对 null/非法 JSON/非对象输入返回 `{}` 不抛错。
- 回归测试：tests/faults/test_f_12.test.ts

## F-13 CMD 侧调用方二次弹窗（D17）[确认修复·T-006 批 2]

- 现状：DeviceCommands.vue 三处 catch 自弹 `ElMessage.error(error.message || 中文兜底)`
  （修复前 :286,330,393），叠加拦截器单点 toast（AUTH-05）= 双弹窗；D13（原 :329 弱类型
  `error !== 'cancel'`）随本条消解——比较整体被 isUserCancelled 谓词取代（CMD-08）。
- 来源：CMD 域冷启动裁决①（2026-11-10，「全推荐」）；F-01/F-11 同型扩 CMD 侧，
  裁决③新开 F-13（不作 F-11 批注，防掩埋范围演变史）。
- 修复判据：三处调用方 ElMessage.error 移除，错误提示单点归拦截器；用户取消静默
  （GUI 人工判据：制造 API 失败仅一弹——docs/acceptance/gui-checklist-cmd.md 第 3 条）。
- 回归测试：拦截器单点见 tests/faults/test_f_01.test.ts；取消分流谓词见
  tests/contracts/test_cmd_08.test.ts；DeviceCommands 接线属组件层，人工/GUI 判据覆盖。
