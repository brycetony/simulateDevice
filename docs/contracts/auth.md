# AUTH 域契约（登录 / 会话 / 路由守卫 / 用户管理）

- 版本：v1.0（2026-11-09 裁决①确认，owner 批复「全推荐」；考古与裁决记录见
  `docs/tasks/RESEARCH-auth-2026-11-09.md`、任务卡 `docs/tasks/T-004-auth-contracts.md`）
- 状态标记：**[确认]** 生效；**[OPEN]** 等后端/产品答复，禁止作为实现依据（AGENTS.md §1）
- **安全边界声明（S3/S5/S6 裁决）**：本域所有前端角色控制仅为 UX 分流，**非安全边界**；
  越权防护责任在后端。转后端必答清单：`/users/*` 角色校验、edit 的 role 字段白名单、
  登出/改密后的 token 吊销。

## AUTH-01 凭证摘要 [确认]

登录与改密提交的密码字段一律为 `md5(明文)` 的 32 位小写 hex 串；明文禁止出网。
无盐为现状锁定（同 TOOLS-03「有意保留」先例）：md5 值本身等价于可重放凭证（已知弱点），
升级路径挂 [OPEN] Q1（后端存储约定，答前前端单方面改哈希 = 破坏登录）。
判据：`buildLoginPayload` / `buildChangePasswordPayload` 输出匹配 `/^[0-9a-f]{32}$/`（RFC 1321 公开向量）。
测试：tests/contracts/test_auth_01.test.ts

## AUTH-02 会话三键 [确认]

登录成功原子写入 localStorage 三键：`token`=`access_token` 字符串、`userInfo`=user 的 JSON 串、
`userRole`=`String(user.role ?? '')`。键名与形状是守卫/拦截器/Layout 的共同接口（改动即破坏三方）。
`user.role` 缺失时写空串（原状会写入字符串 `"undefined"`，随本条修正；D9 联动项 [OPEN]）。
判据：`sessionWrites` 返回的三键集合与上述形状严格一致。
测试：tests/contracts/test_auth_02.test.ts

## AUTH-03 Bearer 附加 [确认]

有 `token` 时所有 `/api` 请求自动附加 `Authorization: Bearer <token>`；
无 token 或空串**不得附加空头**；已有自定义头不被覆盖；`Authorization` 头碰撞时
**以会话 token 为准**（显式覆盖调用方值）。
判据：`attachAuthHeader` 对空/null token 的输出不含 Authorization 键。
测试：tests/contracts/test_auth_03.test.ts

## AUTH-04 响应剥壳与 401 语义 [确认]

2xx 响应剥 axios 壳，直接返回 `{code,data,message}`（调用方写 `res.data.xxx`）。
401 → 提示「未授权，请重新登录」+ **清三键（AUTH-02 全集）** + 跳 `/login`；
当前已在 `/login` 页时**不整页跳转**（防 reload 抹掉错误提示与表单输入——F-08）。
判据：401 决策 = 清键集合等于三键全集；`redirectTargetOn401('/login')` 返回 null。
测试：tests/contracts/test_auth_04.test.ts

## AUTH-05 错误文案归一 [确认]（跨域共用约定，暂挂本文件）

4xx/5xx 取 `body.message`：string 直用；string[] 以 `', '` join（**双兼容**——
[OPEN] Q8 答复「无数组实例」后收敛为仅 string）；缺失/空给状态级兜底：
400「请求参数错误」/ 403「拒绝访问」/ 404「请求错误，未找到该资源」/ 500「服务器端出错」/
其余「未知错误」。网络级错误固定「网络错误，请稍后重试」。
**default 分支禁止抛 TypeError**（F-02：原状 `message.join` 遇字符串必崩且自身零提示）。
判据：`resolveApiErrorMessage` 对 string / string[] / 缺失 / 网络四种输入的输出为上述字面值。
测试：tests/contracts/test_auth_05.test.ts

## AUTH-06 路由守卫 [确认]

`/login` 恒放行（已登录再访不重定向——C17 [OPEN] 悬空，锁现状）；其余路由无 token → `/login`；
声明 `meta.roles` 且 `userRole` 不在其中 → 回默认页 `/devices`；其余放行。
守卫是 UX 分流，非安全边界（见顶部声明）。
判据：`resolveGuard` 四分支（无 token / 越权 / superadmin / /login 恒放行）。
测试：tests/contracts/test_auth_06.test.ts

## AUTH-07 登出语义 [确认]

登出为纯前端行为：清三键（AUTH-02 全集，**不再残留 userInfo/userRole**——F-03）+ 跳 `/login`，
不调任何后端接口（服务端吊销挂 S6 转后端必答）。手动登出需用户确认。
判据：`logoutAction()` 清键集合 = 三键全集、redirect='/login'、confirm=true。
测试：tests/contracts/test_auth_02.test.ts

## AUTH-08 改密流程 [确认]

`POST /auth/change-password`，payload `{userId, oldPassword:<md5>, password:<md5>}`；
`userId` 照现状取 `userInfo.id`（字段分歧 `_id`/`id` 挂 [OPEN] C19/Q15）。
成功后**必须终结会话且不可被确认框打断**（F-05：免确认直接登出——旧 token 留站是陷阱态）。
判据：`forcedLogoutAction()` confirm=false；`buildChangePasswordPayload` 两摘要独立且为 md5 hex。
测试：tests/contracts/test_auth_01.test.ts（payload）/ tests/contracts/test_auth_02.test.ts（强制登出）

## AUTH-09 用户管理接口形状 [确认]

四接口：`GET /users/list`（page/pageSize/search）、`POST /users/add`、`PUT /users/edit`、
`DELETE /users/delete/:id`。**add 与 edit 的请求体不含密码字段**；初始密码策略完全归属后端
（[OPEN] Q3/D7），前端零假设。
测试：批 2 交付。

## AUTH-10 role/status 枚举 [确认]

`role ∈ {superadmin, admin, user}`；`status` 为字符串 `'1'/'0'`（禁止数字形态混用）。
测试：批 2 交付。

## AUTH-11 superadmin UI 保护 [确认]

superadmin 账户不可经 UI：禁用状态开关、删除、以 superadmin 角色新建、编辑时改 username。
四处模板保护是该策略的当前实现；属**合法 UI 便利**，非安全边界（见顶部声明）。
测试：批 2 交付。

## AUTH-12 表单校验 [确认]

用户表单：username/nickName 必填；email 非必填但须过格式校验；role/status 无前端 required。
改密表单仅 required + 两次一致（强度校验挂 [OPEN] D13/Q1，与后端策略捆绑裁决）。
测试：批 2 交付。

## AUTH-13 401 并发去重 [确认]（目标行为，随批 1b 生效）

多个请求并发 401 = **一次提示 + 一次跳转**（原状：N 个弹窗叠放 + N 次跳转赋值）。
判据：`shouldNotifyUnauthorized` 窗口期（默认 1000ms）内仅首次为 true；哨兵值 0 = 从未提示。
测试：tests/contracts/test_auth_13.test.ts

## AUTH-14 受限路由声明义务 [确认]

需要角色限制的路由**必须**声明 `meta.roles`；未声明视为「登录即可访问」（现状锁定 + 防回归：
新增子路由漏配 roles 不会静默放开——守卫与路由表分离后可静态检查）。
测试：批 1b 接线 PR 交付。

---

## OPEN 挂账（答前禁止实现，AGENTS.md §1）

| 项 | 内容 | 阻塞 |
|----|------|------|
| C15/Q13 | `ApiResponse.code` 全仓库零消费，成功/失败判定纯 HTTP status；后端是否存在「200+失败 code」未知 | D9 真伪、code 类型去留 |
| C17/Q10 | 已登录访问 `/login` 不重定向（锁现状） | 行为是否要改 |
| C18 | 守卫仅真值检查，`"undefined"` 字符串放行 | token 有效性语义 |
| C19/Q15 | 改密 `userId` 取 `userInfo.id` 与用户主键 `_id` 分歧，功能是否实测可用 | AUTH-08 字段对齐 |
| D7/Q3 | 新增用户初始密码黑箱 | 产品缺口 |
| D13/Q1 | 改密强度校验 | 与后端密码策略捆绑 |
| S1/Q1 | 无盐 md5 升级路径 | 后端存储约定 |
| S4/Q7 | token 过期/刷新机制 | 后端 token 形态 |
