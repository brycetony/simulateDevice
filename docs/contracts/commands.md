# CMD 域契约（设备命令：命令库 CRUD / 占位符参数 / 路由访问）

- 版本：v1.0（2026-11-10 裁决①确认，owner 批复「全推荐」；考古与裁决记录见
  `docs/tasks/RESEARCH-cmd-2026-11-10.md`、任务卡 `docs/tasks/T-006-cmd-contracts.md`）
- 状态标记：**[确认]** 生效；**[OPEN]** 等后端/产品答复，禁止作为实现依据（AGENTS.md §1）
- **安全边界声明**：deviceId 取自路由参数原样入 query 与表单，前端不做存在性/归属校验——
  前端非安全边界，越权防护（deviceId↔资源归属、角色校验）归后端（必答 B1）。
  AUTH-03/04/05/13 跨域契约对 CMD 调用自动生效，不重复抄写（Bearer 附加 / 2xx 剥壳 /
  错误文案单点 toast / 401 并发去重）。
- 命令库实体当前全仓零消费方、与 Monitor 发送零关联（产品意图 OPEN Q10：若裁「命令实体
  驱动下发」，本域范围扩至 send 路径，届时另批修订本文件）；表格列 / tag 色 / monospace
  为展示现状，非业务规则。

## CMD-01 命令四接口形状 [确认]

GET `/api/devices/{deviceId}/commands`（query 仅 page/pageSize/search，deviceId 只进 path）；
POST `/api/devices/command`、PUT `/api/devices/command`（deviceId 仅在 body）；
DELETE `/api/devices/command/{id}`；search 空串照发。
GET 设备作用域与 CUD 集合作用域的不对称按现状锁定（定性挂后端必答 B1，不改前端）。
判据：适配器级 5 用例，关系不变量 = deviceId 不进 query、add 载荷无 `_id` 键
（Q16 已裁显式剥离，见 CMD-07）。
测试：批 2 交付（适配器级，随接线改造）

## CMD-02 命令实体与种子 [确认]

实体九字段（`_id?`/deviceId/commandName/commandType/streamType/reqStream/resStream/storeKey/params[]）；
参数行七字段（paramName/paramType/paramKey/paramLabel/paramLength/paramValue/isUnique）。
全部自由文本输入，前端无唯一性/格式/HEX 合法性校验（现状锁定；校验规则待 Q4/Q5/Q6 答复后另批）。
占位符种子 paramType='string'、手工种子 paramType=''——不一致为现状锁定（OPEN Q15，答复后统一）。
判据：buildEmptyCommandForm / buildPlaceholderParam / buildManualParam / resetCommandForm
纯函数终态（reset 终态含 deviceId 保留）。
测试：tests/contracts/test_cmd_02.test.ts

## CMD-03 枚举 [确认]

commandType∈{GET,SET}、streamType∈{ASCII,HEX}、paramType∈{string,number}；
大小写敏感（'get' 无效）。下拉硬编码抽常量（现状锁定·回归钉，无独立外部规范源）。
判据：三组常量字面量 + isCommandType/isStreamType/isParamType 谓词（含小写拒绝边界）。
测试：tests/contracts/test_cmd_03.test.ts

## CMD-04 表单必填 [确认]（版本 A，裁决①）

commandName/commandType/streamType/reqStream 必填；resStream 非必填（4b02afd 起现状锁定，
恢复必填挂 OPEN Q3）。参数行 paramName/paramType/paramKey/paramLabel/paramLength 必填；
paramValue/isUnique 非必填。空串判定不 trim（沿 utils/users.ts 先例，未裁决行为锁现状）。
判据：validateCommandForm 全空表单恰 4 条错误（resStream 不在内）；
validateCommandParam 对种子行的空必填逐条报错、paramValue 空不报。
测试：tests/contracts/test_cmd_04.test.ts

## CMD-05 占位符解析 [确认]（版本 B，裁决①；D14 修复随本条生效）

reqStream 中 `[$A|B]` 片段**每处独立**解析为一个参数行依据（非贪婪匹配，一占位符一行——
裁决①版本 B，修复贪婪并段缺陷 D14：原 `/\[\$(.+)\|(.+)\]/g` 将相邻及隔任意文本的多占位符
并为一段）。段内 A/B 两侧各至少 1 字符：空段、未闭合不匹配；paramLabel=整段匹配串
（语义字段拆存挂 OPEN Q1）；按 paramLabel 精确去重；两个捕获组当前无消费方。
判据：parsePlaceholders 七类输入（单符/相邻/隔文本/内嵌/双空段/未闭合/无符），
期望值独立复算（RESEARCH §0.2 实测记录）。
测试：tests/contracts/test_cmd_05.test.ts

## CMD-06 参数行联动 [确认]（版本 B，裁决①；D15/D16 随本条生效）

reqStream 变化 → syncParams 全量同步：新占位符追加种子行（buildPlaceholderParam）、
同 label 幂等去重（留首行，reqStream 内同 label 出现两次也只占一行）；paramLabel 已不在
reqStream 的行——仍为空值的孤儿行自动删除（D15：修复只增不删导致的脏数据堆积）。
**空值定义**：paramName/paramKey/paramValue 三个文本字段全空即空值（仅调整过
paramType/paramLength/isUnique 的行仍视为空值孤儿行照删——种子可变字段不构成保留理由）；
任一文本字段非空 = 已有用户输入，不自动删；手工行（paramLabel 为空串）不自动删。
判据：syncParams 四类用例（追加/幂等/孤儿行/同名相邻）。
测试：tests/contracts/test_cmd_06.test.ts

## CMD-07 提交分流 [确认]

`_id` 有值（非空串）→ edit；无值或空串 → add（边界：`_id===''` 走 add）。
add 载荷**显式剥离 `_id` 键**（Q16 已裁：消除对 axios JSON 序列化隐式丢弃 undefined 的依赖）；
edit 载荷整包回传含 `_id`（mass-assignment 白名单为前瞻可选项 D25，挂后端必答 B4）。
判据：buildCommandPayload 三分支（edit 含 _id / add 无 _id 键 / `_id===''` 走 add 且无 _id 键）。
测试：tests/contracts/test_cmd_07.test.ts

## CMD-08 删除确认与取消分流 [确认]

ElMessageBox 确认后发 DELETE；用户取消（按钮或 X/ESC）静默；API 失败单点 toast 归拦截器
（AUTH-05 + F-13【批 2 登记】，调用方不再二次弹窗）。element-plus 2.9.2 默认
distinguishCancelAndClose=false：取消按钮与 X/ESC 均 reject 'cancel'（源码实证，
RESEARCH §0.3）。**防回归注记**：'close' 仅在启用 distinguishCancelAndClose 时另现，
届时须重裁本条（当前按非取消严格处理）。
判据：isUserCancelled('cancel')→true、Error 对象→false、'close'→false。
测试：tests/contracts/test_cmd_08.test.ts

## CMD-09 列表消费 [确认]

只读 `data.items` / `data.total`；ApiResponse.code 零消费、成功判定纯 HTTP status
（现状锁定——OPEN 期间禁止改读 code，Q9 与 AUTH C15/Q13 合并后端必答 B2，两域同判同修）；
搜索（enter/clear 触发）重置回第一页；初始查询 page=1/pageSize=10（档位 10/20/50/100 为
展示现状）。page 重置属组件接线（批 2 + GUI 判据）。
判据：consumeListResponse 三用例（正常消费 / 200+非零 code 照常返回钉现状 / 无 code 字段照常）。
测试：tests/contracts/test_cmd_09.test.ts

## CMD-10 路由与访问语义 [确认]

`/devices/:id/commands`（name DeviceCommands）未声明 meta.roles → 按 AUTH-14 登录即可访问
（现状锁定；是否收紧随 B1/Q10 答复另裁，本批不动）；唯一入口为设备列表行操作跳转
（组件接线，批 2 + GUI 判据）。
判据：路由静态 3 用例（路由存在 / 无 roles / name）。
测试：批 2 交付（路由静态，随接线改造）

---

## OPEN 挂账（答前禁止实现，AGENTS.md §1）

| 项 | 内容 | 阻塞 |
|----|------|------|
| Q1 | 占位符 A/B 段语义与捕获组弃用原因（意图注释随 4b02afd 删除，git 考古属实） | CMD-05 语义字段拆存、D16 演进 |
| Q3 | resStream 必填是否恢复（4b02afd 无说明） | CMD-04 版本切换（改 3 行） |
| Q4 | storeKey 语义与唯一性（后端存储键冲突行为） | CMD-02 校验规则另批 |
| Q5 | isUnique 语义与消费方（前端零读取） | 同上 |
| Q6 | paramLength 字节还是字符；string/number 分别如何约束 | 同上 |
| Q15 | paramType 种子默认值统一（手工 '' vs 占位符 'string'） | CMD-02 种子统一 |
| Q10 | 命令库产品意图（实体全仓零消费，是否应驱动 Monitor 下发） | 域范围是否扩至 send 路径 |
| B1/Q8 | /devices/command* 归属（deviceId↔资源）与角色校验；GET 设备作用域 vs CUD 集合作用域不对称定性 | S1 定级（无校验即 P0）、CMD-10 是否加 roles、CMD-01 措辞 |
| B2/Q9 | 是否存在 HTTP 200+失败 code（**与 AUTH C15/Q13 合并一问，两域同判同修**） | CMD-09 判据走向、全域错误单点 |
| B3/Q7 | search 模糊匹配哪些字段 | CMD-01 判据补充分支、placeholder 文案正误 |
| B4/Q12 | 编辑命令 params 整包回传=全量替换还是合并 | CMD-07 白名单性价比（D25） |
| B5/Q13 | 删除命令是否级联影响设备会话/别处引用 | 删除交互判据完整性 |
