# 约束考古报告：AUTH 域（登录与用户）

- 起草：agent（ZCode 会话 / 2026-11-09）—— **agent 只有起草权**
- 裁决人：____（brycetony）—— **只有人能把条目裁成 [确认]**
- 调研范围：`src/views/Login.vue`、`src/views/Users.vue`、`src/views/Layout.vue`、
  `src/api/index.ts`、`src/router/index.ts`、`src/types/api.ts`、`vite.config.ts`、
  git 全部 16 个 commit 历史、`docs/contracts/tools.md`、`docs/faults/`（空）、AGENTS.md §3
- 背景：AUTH 域契约冷启动（T-004，T-003 流水线首飞）。侦察由 Explore 子代理完成，
  本报告为蒸馏稿；原始事实清单见会话留痕。

## 候选约束清单（C 表）

| ID | 候选约束 | 类型 | 证据 | 置信 | 裁决（人填） |
|----|---------|------|------|------|------------|
| C1 | 密码在客户端做 `md5(password)` 摘要后提交（登录与改密），无盐 | 现状 | `Login.vue:29,49`、`Layout.vue:173-174` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C2 | 登录成功将 `access_token`/`user` 全量/`role` 分存 localStorage 三键 `token`/`userInfo`/`userRole` | 现状→提议规则 | `Login.vue:57-59` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C3 | 请求拦截器对所有请求自动附加 `Authorization: Bearer <token>` | 现状→提议规则 | `api/index.ts:11-22` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C4 | 响应拦截器剥壳返回 `{code,data,message}`；401 → 清 token + 整页跳 `/login` | 现状→提议规则 | `api/index.ts:27-40` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C5 | 路由守卫：无 token 一律 `/login`；`/users` 要求 `userRole==='superadmin'`，其余路由登录即可 | 现状→提议规则 | `router/index.ts:98-119` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C6 | 登出为纯前端行为：删 `token`+`userRole`、不调后端接口、不删 `userInfo` | 现状 | `Layout.vue:148-159` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C7 | 改密 `POST /auth/change-password`，`{userId, oldPassword:<md5>, password:<md5>}`，成功后自动走登出 | 现状 | `Layout.vue:165-185` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C8 | 用户管理四接口：`GET /users/list`（分页+search 封装未用）、`POST /users/add`（**无密码字段**）、`PUT /users/edit`（整对象回传）、`DELETE /users/delete/:id` | 现状→提议规则 | `api/index.ts:77-93`、`Users.vue:97-105,180-184,203-216` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C9 | 新增用户不发送密码，初始密码策略完全在后端（前端零线索） | 现状 | `Users.vue:97-105`（password 四处注释残骸） | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C10 | role 枚举 `superadmin/admin/user`；status 以字符串 `'1'/'0'` 表示 | 现状→提议规则 | `Users.vue:107-117,22,71-72` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C11 | superadmin 前端保护四处：状态开关禁用、删除按钮隐藏、角色下拉过滤、编辑禁改 username | 现状 | `Users.vue:22,28,56,66` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C12 | 表单校验：username/nickName 必填；email 格式校验但**非必填**；role/status 无 required | 现状→提议规则 | `Users.vue:135-148`、`Login.vue:40-43` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C13 | API 错误约定：400/403/404/500 取 `message` 单值兜底文案；default 分支按数组 `join`（两种类型并存） | 现状 | `api/index.ts:32-52` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |
| C14 | `register` 接口（`POST /auth/register`）导出但全仓库无调用方（4b02afd 后死代码） | 现状 | `api/index.ts:65-67` | 高·代码实证 | ☐确认 ☐否决 ☐OPEN |

## 缺陷候选清单（D 表——确认后进 `docs/faults/` 并修复，否决则记 ADR）

| ID | 缺陷描述 | 证据 | 与既有原则的关系 | 裁决（人填） |
|----|---------|------|----------------|------------|
| D1 | 认证域吞失败原因：登录失败只弹固定文案"登录失败"；用户新增/编辑失败提示被注释仅 `console.log`（后端 code 非法时用户零反馈） | `Login.vue:62-63`、`Users.vue:236-239` | 违反 TOOLS-04 显式失败精神 | ☐确认修复 ☐否决 ☐OPEN |
| D2 | default 错误分支 `message.join(', ')`：message 为字符串时抛 TypeError，吞掉真实错误 | `api/index.ts:51` | 违反 TOOLS-04 | ☐确认修复 ☐否决 ☐OPEN |
| D3 | 401 只清 `token`，残留 `userInfo`/`userRole`——跳转后仍可被读取 | `api/index.ts:36-40` vs `Login.vue:57-59` | 一致性缺陷 | ☐确认修复 ☐否决 ☐OPEN |
| D4 | `resetForm` 不重置 `role`/`status`，上次选择带入下一次"新增" | `Users.vue:249-260` | 疑似 bug（A30） | ☐确认修复 ☐否决 ☐OPEN |
| D5 | 改密成功后自动登出，但登出带"确认退出"框——点取消则**携旧 token 留在站内** | `Layout.vue:177-179,150-152` | 流程语义缺陷 | ☐确认修复 ☐否决 ☐OPEN |
| D6 | 调试输出泄漏：`console.log` 打印含 `access_token` 的完整登录响应与用户行数据（多处） | `Login.vue:56`、`Users.vue:181,195,198,227` | 生产残留 | ☐确认修复 ☐否决 ☐OPEN |
| D7 | 新增用户无初始密码知情渠道（后端黑箱策略 + 前端无展示/无邮件提示） | `Users.vue:97-105` + Q3 | 产品缺口 | ☐确认修复 ☐否决 ☐OPEN |

## 安全议题清单（S 表——多为跨仓库/部署层，裁决方向：本仓库修 / 挂 OPEN / 转后端仓库）

| ID | 议题 | 证据 | 边界判断 | 裁决（人填） |
|----|------|------|---------|------------|
| S1 | 无盐 MD5 作为密码摘要（md5 值即等价凭证；与 TOOLS-01 CSPRNG 精神相悖） | `Login.vue:29,49` | 改动取决于后端存储约定（Q1） | ☐本仓库处理 ☐转后端 ☐OPEN |
| S2 | dev 代理 HTTP 明文（Bearer token 与 md5 密码无 TLS） | `vite.config.ts:17` | 部署层，疑超本仓库边界 | ☐本仓库处理 ☐转部署 ☐OPEN |
| S3 | 鉴权数据源 localStorage 可篡改（改 `userRole` 即进 `/users`；C11 四处保护均为客户端装饰） | `router/index.ts:100,111` | 前端无法自证，需后端兜底（Q6） | ☐本仓库处理 ☐转后端 ☐OPEN |
| S4 | token 明文存 localStorage，无过期记录、无刷新机制 | `Login.vue:57` | 前端可缓解（改 httpOnly cookie 需后端配合） | ☐本仓库处理 ☐转后端 ☐OPEN |
| S5 | `editUser` 整行回传（含后端下发但未展示的字段）——若后端无白名单可越权改字段 | `Users.vue:226-228` | 前端可做字段拣选，根治需后端 | ☐本仓库处理 ☐转后端 ☐OPEN |

## 候选未决问题（Q 表——转负责人）

| ID | 问题 | 为什么无法自行判断 |
|----|------|------------------|
| Q1 | 密码 md5 是后端既有存储约定还是前端自作主张？改哈希方式是否可行？ | first commit 无说明，无 ADR；后端仓库不在本仓库边界 |
| Q2 | `4b02afd` 为何把新增用户从 `/auth/register` 切到 `/users/add`？两接口语义差异？ | commit message 完全未提 |
| Q3 | `/users/add` 的初始密码策略是什么？是否需要首登改密？ | 代码零线索，纯后端黑箱 |
| Q4 | role 为何在 `userInfo` 之外单独冗余存 `userRole` 键？ | 无出处 |
| Q5 | 401 只清 token / 登出不清 userInfo——遗漏还是有意（记住上次登录者）？ | 无出处 |
| Q6 | 后端对 `/users/*` 与角色越权是否有服务端校验？ | 前端无法证实 |
| Q7 | token 是否 JWT？有效期？有无刷新机制？ | 前端无解析、无过期处理 |
| Q8 | default 分支假设 message 为数组——后端哪个接口返回数组？ | `types/api.ts` 类型声明与实现矛盾 |
| Q9 | `register` 死代码：有意保留（未来开放注册）还是忘了删？ | 无出处 |
| Q10 | 已登录访问 `/login` 不跳转——允许多账号切换还是没写？ | 无出处 |
| Q11 | `resetForm` 漏 role/status 是 bug 还是有意？ | 无出处（D4 的定性前置） |
| Q12 | 本任务（T-004）范围边界：纯契约化 / 契约化+D 表修复 / 再加 S 表本仓库侧缓解？ | 范围栏由人拍板 |

## 建议验收判据（人裁决约束后，由这些判据生成不变量测试）

- C2/C3/C4 确认 → 拦截器逻辑抽纯函数：attach-token / unwrap / 401 语义的不变量测试
- C5 确认 → 守卫判定纯函数：无 token / 有 token 非 superadmin 访问 /users / superadmin 访问 等分支测试
- C8/C10 确认 → API 封装形状与枚举的契约测试
- C12 确认 → 校验规则纯函数测试
- D1–D6 确认 → 每项修复配回归测试 + `docs/faults/` 条目（失败原因必须到达 UI 的不变量）
- 测试文件头声明来源 ID（AUTH-xx / F-xx），gate 溯源校验已含 AUTH 前缀

---

## 三视角讨论补充（2026-11-09，主档在 T-004 §3，此处为归档版）

架构/测试/红队三子代理并行讨论后新增候选（证据格式同上）：

**新约束候选（C15–C20）**

| ID | 候选约束 | 证据 | 裁决（人填） |
|----|---------|------|------------|
| C15 | 业务 `code` 字段全仓库零消费，成功/失败判定完全依赖 HTTP status | `types/api.ts:14` 声明 vs grep 零读取 | ☐确认 ☐否决 ☐OPEN |
| C16 | 401 无并发去重：N 个并发请求同时 401 → N 个弹窗叠放 | `api/index.ts:36-40` 无 in-flight 标记 | ☐确认 ☐否决 ☐OPEN |
| C17 | 已登录访问 `/login` 不重定向，可静默覆盖三键切换账号 | `router/index.ts:102-103` | ☐确认 ☐否决 ☐OPEN |
| C18 | 守卫仅字符串真值检查，`"undefined"`/`"null"` 字符串放行 | `router/index.ts:105` | ☐确认 ☐否决 ☐OPEN |
| C19 | 主键字段名分歧：用户实体 `_id` vs 改密读 `userInfo.id` 发 `userId` | `Users.vue:98,208,254` vs `Layout.vue:172` | ☐确认 ☐否决 ☐OPEN |
| C20 | 守卫只在 `to.meta.roles` 存在时检查——新增子路由漏配 roles 即默认全员可进 | `router/index.ts:109` | ☐确认 ☐否决 ☐OPEN |

**新缺陷候选（D8–D13）**

| ID | 缺陷描述 | 证据 | 裁决（人填） |
|----|---------|------|------------|
| D8 | 登录失败若返回 401 → 拦截器对 /login 页整页 reload，抹掉错误提示与表单输入 | `api/index.ts:36-40` 不检查当前路径 [推断：后端 401 风格] | ☐确认修复 ☐否决 ☐OPEN |
| D9 | 登录响应零形状校验：`access_token` 缺失时写入字符串 `"undefined"` 假 token，守卫真值放行 → 假登录循环 | `Login.vue:57`、`router/index.ts:105` [推断：依赖后端 200+失败 code 风格] | ☐确认修复 ☐否决 ☐OPEN |
| D10 | 状态开关无 try/catch：`editUser` 失败 → unhandled rejection，switch 停在错误态、列表不刷新，UI 与服务端状态分裂 | `Users.vue:180-184`、`main.ts` 无 errorHandler | ☐确认修复 ☐否决 ☐OPEN |
| D11 | 调用方二次弹窗 + axios 英文技术文案兜底，与拦截器弹窗叠加双提示 | `Users.vue:166,213`、`Layout.vue:181` | ☐确认修复 ☐否决 ☐OPEN |
| D12 | `Layout.vue` 顶层 `JSON.parse(localStorage.userInfo)` 无防御，非法 JSON 即白屏 | `Layout.vue:119` | ☐确认修复 ☐否决 ☐OPEN |
| D13 | 改密表单无长度/强度校验，`md5('1')` 可提交（AUTH 版 TOOLS-09） | `Layout.vue:130-146` | ☐确认修复 ☐否决 ☐OPEN |

**新安全议题（S6）**

| ID | 议题 | 证据 | 裁决（人填） |
|----|------|------|------------|
| S6 | 登出纯前端 + 无服务端吊销通道：登出/改密后 token 服务端存活至自然过期 | C6 + api 层无 logout 封装；与 Q7 绑定 | ☐本仓库处理 ☐转后端 ☐OPEN |

**红队修正（对原表措辞的升级）**：D2 的 default 分支是**必崩**（TypeError 抛在 toast 参数求值时，default 分支自身永远弹不出任何提示），非"吞错"；S5 的爆炸半径在 role 字段（整行回传可直接把自己改成 superadmin，不依赖 /users 入口）；S2 补充证据 `vite.config.ts:14` host 绑定局域网 IP，S1+S2 组合（md5 重放 + 内网明文抓包）触发条件现实。

**架构切分方案**：C14 条 → AUTH-01..12（合并 C9 入 AUTH-09、拆 C13 出 AUTH-05、逐出 C14 死代码）+ 建议新增 AUTH-13（401 并发去重，目标行为）/AUTH-14（受限路由声明义务，防回归）。测试规划：契约 12 文件 ~54 例 + 故障回归 6 文件 ~18 例，基线 46 → ~118。
