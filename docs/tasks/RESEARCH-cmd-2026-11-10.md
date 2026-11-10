# CMD 域契约冷启动 · RESEARCH 报告（T-006 归档版）

- 归档说明：2026-11-10 裁决①通过（owner 批复「全推荐」），本报告随 T-006 落库归档（AGENTS.md §5.5）。
- 产出方式：workflow `domain-coldstart`（run dwfrun-36fdf520，T-005 演练）——考古侦察 → 三视角并行
  （架构/测试/红队互不等待）→ 汇总出票，全程无人值守 1h16m / 3.42M tokens（详见 T-005 卡 §8）。
- 基线钉死：正文产出时基线为 master@3df7108（§0.1）；归档时实测 origin/master@d166371（PR15 后），
  五个关键文件（DeviceCommands.vue / api/index.ts / routes.ts / AGENTS.md / gate.yml）两基线零差异，
  正文全部行号引用在归档基线下同样成立（复测命令：git diff --stat 3df7108..d166371 -- <五文件> → 空输出）。
- 结构：正文（§0-§6 与诚实性声明）为汇总会话产出**原样归档**（仅去掉草稿标题行）；
  **附录 A** 为裁决①票拟包全文（原样）；**附录 B** 为裁决记录（六项流程裁决 + 政策 A 沿用 + OPEN 去向）。

---


- 域：CMD（设备命令：DeviceCommands.vue + api/index.ts 命令段）。调研模式产物：**全部条目为候选，无 [确认]**，状态留人裁决（AGENTS.md §5.2）。
- 输入：事实清单（C1-C19/A1-A10/Q1-Q14，由考古会话产出）+ 三视角交付（架构/测试/红队，由三会话产出）。本会话为汇总人，对全部 C/A 条目及关键争议项做了只读复核（见 §0）。
- 产出边界：到裁决①票拟包为止，不进入实现（pipeline-research.md 编排）。

## 0. 本会话复核实录（命令与输出留痕）

1. **仓库状态**：`git rev-parse --abbrev-ref HEAD`→master；`git rev-parse --short HEAD`→3df7108；`git status --short`→空（工作树干净）；`git log --oneline | wc -l`→42。与事实清单所记「t005-pipeline-stage2 @ adae6f8、39 commit」不符——实测 `git rev-parse --short t005-pipeline-stage2`→**ed86867**（adae6f8 未能复现，是否为分支历史提交未追查）；红队视角所述「master@3df7108、PR#14 合并后」与本次实测一致。**关键文件行号有效性**：`git diff --stat t005-pipeline-stage2 master -- src/views/DeviceCommands.vue src/api/index.ts src/router/routes.ts AGENTS.md .github/workflows/gate.yml`→零输出（两分支该 5 文件完全一致），本报告全部行号引用在两状态下均成立。票拟包留痕以 master@3df7108 为准。
2. **贪婪正则行为（争议项 A3 复测，防转义污染版）**：首批 `node -e` 直测因工具参数传输层将 `\$` 损坏为 `$`（正则中 `$` 变行尾锚点）而全部误报 null——该事故已识别，以下为权威结果：脚本 `/tmp/cmd_coldstart/micro2.mjs` 用 `String.fromCharCode(92)` 构造反斜杠杜绝传输损坏，并对仓库文件行做 charCode dump 确认 DeviceCommands.vue:337 源码确为 `/\[\$(.+)\|(.+)\]/g`（char 序列 92,91,92,36,...）。输出：`"AA[$p1|d1]BB"`→`["[$p1|d1]"]`（单占位符正常）；`"[$a|1][$b|2]"`→`["[$a|1][$b|2]"]`（相邻并段，=A3）；`"[$a|1] mid [$b|2]"`→`["[$a|1] mid [$b|2]"]`（**非相邻也并段，中间普通文本被吞进 paramLabel**——三视角之一致新发现，比 A3 原记载更广）；`"x[$a|1]y[$b|2]z"`→`["[$a|1]y[$b|2]"]`；`"[$x|]"`/`"[$|b]"`/`"[$a|1"`/无占位符→null。非贪婪变体 `/\[\$(.+?)\|(.+?)\]/g` 对相邻/隔文本输入均得 2 个独立匹配（D14 方案 A 实证可行）。
3. **ElMessageBox 取消语义（C18 定性争议裁决依据）**：读安装源码 `node_modules/element-plus/es/components/message-box/src/messageBox.mjs`（element-plus 2.9.2，node_modules/element-plus/package.json 核实）——`if (action === "cancel" || action === "close") { if (options.distinguishCancelAndClose && action !== "cancel") reject("close") else reject("cancel") }`。DeviceCommands.vue:322-324 的 confirm 未启用 distinguishCancelAndClose（默认 false）→ **取消按钮与 X/ESC 均 reject 字符串 'cancel'**，`error !== 'cancel'`（:329）对两条用户取消路径恰好正确。结论：测试视角对 C18 的修正成立；红队 K5「X/ESC reject 'close' → 用户取消也弹删除失败」的触发面在当前调用点**被源码否定**（仅当未来启用 distinguishCancelAndClose 才成立）。
4. **JSON 序列化**：`JSON.stringify({_id:undefined,a:1})`→`{"a":1}`（实测）——add 提交整对象时 `_id:undefined` 不上行，但依赖 axios 序列化隐式行为。
5. **消费面 grep（A2 复核）**：`grep -rn 'getDeviceCommands\|addCommand\|editCommand\|deleteCommand\|deviceSendData' src tests`（剔除 api/index.ts）→ 四命令 API 仅 DeviceCommands.vue:200,282,325,384,387；deviceSendData 仅 Monitor.vue:75,179。命令库实体零外部消费、与 Monitor 发送表单（type/payload，Monitor.vue:51-59）零关联——A2 成立。
6. **逐条行号核对**：C1-C19、A1-A10 全部属实。两处更正：① C2 笔误——CommandParam 实为 **7 字段**（DeviceCommands.vue:204-212 实读），非「八字段」；② A3 波及面扩大——见上条 2。
7. **git 考古复核**：触及 DeviceCommands.vue 恰 3 commit（bef1087/4b02afd/7fcfa5d，`git log --oneline --all -- <file>`）；4b02afd 为 4 文件混合域提交（--stat：api/index.ts +4、DeviceCommands.vue、Users.vue、tsconfig.node.json）；该 commit hunk `@@ -334,12 +334,7 @@` 同时删除旧正则旁 **3 行意图注释**（红队记 4 行，实数 3）与 2 处 console.log，换入新正则——意图随 commit 丢失，强化 Q1/A8；7fcfa5d 未触及该 handler（grep 计 0）。
8. **测试基线**：`npx vitest list | wc -l`→**121**（仅收集计数，与 T-005 卡基线记载一致）；**套件未运行**，pass/fail 未复核。
9. **其余核对**：vite proxy /api→localhost:3000（vite.config.ts）；package.json dependencies 无 @vueuse/core 而 Monitor.vue:73 import 之（幻影依赖属实）；docs/contracts/ 仅 auth.md、tools.md；tests/ 无 cmd 文件；docs/tasks/ 无 T-006；AGENTS.md:65/93、gate.yml PREFIXES/溯源/反链/800 行/vitest 四门、faults.md F-01:13/F-10/F-11 判据、auth.md AUTH-14 与 OPEN 挂账 C15/Q13——均已读原文核实。
10. **未做**：vitest run（套件未执行）；浏览器 GUI 实测（ElMessageBox 实际点击行为未验，以源码级证据替代）；后端任何联调（后端不可达且无契约，B 清单无从自答）。

## 1. 候选约束表（C1-C19，均经本会话复核）

| ID | 候选约束（现状陈述） | 证据 | 疑点/挂账 |
|----|----------------------|------|-----------|
| C1 | 命令四接口：GET `/api/devices/{deviceId}/commands`（query: page/pageSize/search）、POST/PUT `/api/devices/command`、DELETE `/api/devices/command/{id}`；GET 设备作用域，CUD 集合作用域（deviceId 仅在 body） | src/api/index.ts:144-164（本会话实读）；调用方 DeviceCommands.vue:282,325,384,387 | 作用域不对称定性→Q8/B1；响应形状为调用侧推断，无后端文档 |
| C2 | 命令实体 9 字段（_id?/deviceId/commandName/commandType/streamType/reqStream/resStream/storeKey/params[]）；参数行 **7 字段**（paramName/paramType/paramKey/paramLabel/paramLength/paramValue/isUnique）——原清单「八字段」为笔误，已更正 | DeviceCommands.vue:204-224（实读） | — |
| C3 | 枚举：commandType∈{GET,SET}、streamType∈{ASCII,HEX}、paramType∈{string,number}，硬编码下拉 | DeviceCommands.vue:82-85,88-92,127-130（实读） | 无外部规范源，现状锁定·回归钉 |
| C4 | 必填：commandName/commandType/streamType/reqStream；resStream 必填整段被注释；参数五字段必填，paramValue/isUnique 无规则 | DeviceCommands.vue:254-270（注释 267-269）、113-176（:min=1 在 159，paramValue 无规则 163-165，isUnique 171）（实读） | resStream 可空是否有因→Q3 |
| C5 | 占位符语法：reqStream 输入匹配 `/\[\$(.+)\|(.+)\]/g` 的片段自动追加参数行，paramLabel=整段匹配串，按 paramLabel 精确去重；两个捕获组弃用 | DeviceCommands.vue:336-355（实读+charCode 验证正则源码）；语法自 `/\[\$(\d+)\]/` 演变于 4b02afd（git show 复核） | 语义无档→Q1/Q2；贪婪缺陷→D14 |
| C6 | CRUD 交互：删除有 ElMessageBox 确认；提交按 _id 有无分流（整 reactive 回传，add 时 _id:undefined 一并发出但被 JSON 序列化隐式丢弃）；成功关框+刷新 | DeviceCommands.vue:320-333、376-400（实读）；JSON 丢键实测见 §0.4 | 显式剥离与否→Q16 |
| C7 | 列表：默认 page=1/pageSize=10，档位 [10,20,50,100]；搜索 enter/clear 触发并重置回第一页；search 空串照发 | DeviceCommands.vue:238-241,276-281,300-303；Pagination.vue:8-9,27-28（实读） | 后端匹配字段→Q7 |
| C8 | 路由 `/devices/:id/commands`，name DeviceCommands，无 meta.roles→按 AUTH-14 登录即可访问 | src/router/routes.ts:57-67（实读）；AUTH-14 语义 docs/contracts/auth.md:105-109 | 是否应限角色→S1 |
| C9 | 唯一入口：设备列表行操作 handleCommands → push `/devices/${row._id}/commands` | Devices.vue:251-253（grep+实读） | — |
| C10 | deviceId 取自 route.params.id 原样入 query 与表单，无存在性校验 | DeviceCommands.vue:228,243-252,277-278（实读） | 越权关注点→S1/B1 |
| C11 | 响应只消费 res.data.items/res.data.total；ApiResponse.code 零消费，成功判定纯 HTTP status | DeviceCommands.vue:283-284；types/api.ts:13-17（实读） | 与 AUTH C15/Q13 同判→Q9/B2 |
| C12 | 跨域契约生效：Bearer 附加（AUTH-03）、2xx 剥壳（AUTH-04）、错误文案归一 toast（AUTH-05）、401 去重（AUTH-04/13）；timeout 5000ms、baseURL /api | api/index.ts:13-67（实读）；auth.md:26-50,99-102 | 与调用方二次弹窗关系→D17 |
| C13 | 对话框关闭即 resetForm：resetFields + Object.assign 全字段清单（含 _id:undefined、params:[]）——清单覆盖全部声明字段，与 Users.vue D4 情形不同 | DeviceCommands.vue:64-70（@close 在 69）、403-418（实读）；ADR-d4 快照机制对照 | — |
| C14 | 表格列：六数据列+操作列；commandType 列 el-tag 硬编码 type="success"（GET/SET 同色） | DeviceCommands.vue:32-51（success 在 35）（实读） | 纯视觉，候选已知边界 |
| C15 | AGENTS.md §3.3 将「DeviceCommands.vue 的命令下发路径」列为高风险人工复核项 | AGENTS.md:65（实读） | 描述与代码现实不符→A1/D22 |
| C16 | CMD 前缀双处注册：AGENTS.md §6 域注册表（CMD→docs/contracts/commands.md）与 gate.yml PREFIXES 白名单 | AGENTS.md:93；gate.yml:34（实读） | 契约文件不存在（见 §6）→回填顺序硬约束 |
| C17 | 三处 catch 自弹 ElMessage.error(error.message||中文兜底) | DeviceCommands.vue:285-286,328-332,392-394（实读） | F-01/F-11 同型，CMD 未接线→D17 |
| C18 | 删除取消判定 `error !== 'cancel'` 弱类型比较 | DeviceCommands.vue:328-332（实读） | **定性修正**：element-plus 2.9.2 源码证实默认配置下 cancel 与 close 均 reject 'cancel'（§0.3），取消路径被正确静默；真实缺陷仅剩 API 失败对象→恒真→双弹窗（并入 D17） |
| C19 | storeKey/paramName/paramKey/paramValue 及 reqStream/resStream 全自由文本，无唯一性/格式/HEX 校验 | DeviceCommands.vue:78-101,104-178（实读） | 语义未知→Q4/Q5/Q6 |

## 2. 缺陷候选表（D 拟全局续排 D13+；编号方案本身待人裁）

| ID | 缺陷 | 来源 | 证据 | 分级（红队） | 修复方向 |
|----|------|------|------|--------------|----------|
| D13 | 删除取消判定弱类型比较——经 §0.3 修正后真实缺陷面收窄为「API 失败对象≠'cancel' 恒真→二次弹窗」 | C18 | DeviceCommands.vue:328-332 | P2（并入 K5） | 推荐随 D17 消解（删调用方弹窗后比较整个消失）；备选 isMessageBoxCancel 类型守卫 |
| D14 | 占位符贪婪并段：相邻**及隔任意文本**的多占位符被并为一个参数行，paramLabel 含普通文本（本会话实证，波及面大于原 A3 记载） | A3+三视角新发现 | DeviceCommands.vue:337 正则；实测见 §0.2 | P1（K2 链） | 非贪婪两字符改动（实测验证）或显式解析器 |
| D15 | 占位符只增不删：删掉占位符文本后参数行残留、文本变化旧行不更新（无删除分支） | A4 | DeviceCommands.vue:336-355（实读无删除分支） | P1（K2 链） | syncParams 全量同步：空值孤儿行删除、有输入行保留 |
| D16 | paramLabel 原样存储整段占位符串（含 [$ | ] 括号）作展示与去重键 | A10 | DeviceCommands.vue:340,347（实读） | 同 D14 | 随纯函数抽取定形；语义拆存等 Q1 |
| D17 | 三处调用方二次弹窗 + axios 英文技术文案，叠加 AUTH-05 单点 toast = 双弹窗（F-11 同型扩围） | C17/A5 | DeviceCommands.vue:286,330,393；faults.md F-01:13 判据、F-11:67-73 | P2（K5） | 删调用方弹窗，单点拦截器；登记机制（新 F-13 vs F-11 批注）待人裁 |
| D18 | Monitor sendData 无 try/catch、发送按钮无 :loading/禁用——连点 N 次即对设备发 N 次；失败 unhandled rejection（F-10 同型） | A9/A12 | Monitor.vue:63,175-183（实读） | P1（K3） | **域外**：DEV 域另卡（推荐），或本批顺手（+3 行） |
| D19 | resStream 必填被注释且 commit 无理由 | A6/Q3 | 4b02afd diff（git show 复核） | P2 | 锁非必填现状+OPEN Q3（推荐）；恢复等答复 |
| D20 | 自由文本零校验（唯一性/格式/HEX） | C19 | DeviceCommands.vue:78-178 | P2（K6） | 锁现状+OPEN Q4/Q5/Q6，禁止先行实现 |
| D21 | GET/SET 同色 tag（纯视觉） | C14 | DeviceCommands.vue:35 | P3 | 可选 +2 行映射，或不动 |
| D22 | AGENTS.md §3.3 高风险描述失实：所指「下发路径」在 DeviceCommands.vue 不存在，真实发送在 Monitor.vue deviceSendData | A1/Q11 | AGENTS.md:65；Monitor.vue:175-183；api/index.ts:139-141（均实读） | 流程 P1（K3/A14） | 改指 Monitor 发送路径+Devices 启停，独立 PR（规则文件变更须人批） |
| D23 | 列表请求竞态：搜索/翻页连发无守卫，先发后至覆盖最新列表（红队新发现） | K7 | DeviceCommands.vue:273-303（实读：无 AbortController/序号） | P2 | 批 2 可选：序号守卫 |
| D24 | 参数区 :key="index" × splice 删中间行→组件复用错位（红队新发现） | K8 | DeviceCommands.vue:110,371-373（实读） | P2 | 批 2 可选：稳定 key |
| D25 | 整包回传 mass-assignment 前瞻：后端未来加只读字段即被回写（红队新发现，当前无只读字段） | K9 | DeviceCommands.vue:312-317,383-389（实读） | 前瞻 | OPEN/可选：提交白名单 |

## 3. 安全议题表（S1-S9 ← 红队 K1-K9，经本会话复核与修正）

| ID | 议题 | 证据链 | 分级 | 前端可见性 |
|----|------|--------|------|------------|
| S1 | 越权读写：任意登录用户（无 roles，C8）改 URL 可读任意设备命令库；CUD 集合作用域+deviceId 仅在 body → console 可伪造对任意设备命令增删改 | K1←C1+C8+C10；routes.ts:57-67、api/index.ts:154-164、DeviceCommands.vue:228 | **P1（后端确认无归属/角色校验即 P0）** | 触发链纯前端可验，防护归后端（B1 必答）；前端缓解=meta.roles 收紧+载荷一致性断言（均待人裁） |
| S2 | 占位符缺陷链→脏参数入库（并段/残留×去重键=整段串→乱码行必填逼填→污染） | K2←C5/A3/A4/A10；实测 §0.2 | P1 | 前端可根治（D14/D15/D16）；无注入面（CMD 无 v-html） |
| S3 | 真实下发路径（Monitor send、Devices 启停）无防重无 catch，且高风险登记错位（AGENTS.md:65 指向不存在路径） | K3←A1+A9；Monitor.vue:63,175-183；Devices.vue:198-209 | P1（设备为真实硬件则升） | 前端可修但域外（DEV 另卡 D18 + 规则 PR D22） |
| S4 | ApiResponse.code 零消费→后端 200+失败 code 时四操作全弹成功（假成功面） | K4←C11；DeviceCommands.vue:283-284 | P1（跨全域模式） | 语义必答（B2，与 AUTH C15/Q13 合并）；修法=拦截器统一判定，两域同判同修 |
| S5 | 双弹窗+取消判定：API 失败恒弹二次+英文技术文案 | K5←C17/C18；**修正**：X/ESC 触发面经 element-plus 源码实证否定（§0.3），红队原推断仅在未来启用 distinguishCancelAndClose 时成立 | P2 | 前端修（D17/D13→F-13） |
| S6 | 零格式校验×后端语义未知（HEX 字符集/paramLength 字节义/storeKey 唯一性/search 字段） | K6←C19+Q4/Q6/Q7 | P2 | 格式校验前端可做但被 OPEN 禁先行；语义归 B3 必答 |
| S7 | 列表竞态：覆盖最新列表，用户在错位数据上操作 | K7；DeviceCommands.vue:273-303 | P2 | 前端可修（D23，批 2 可选） |
| S8 | 参数区 index key 删行错位：校验提示/组件内部状态可能挂错行（数据不错） | K8；DeviceCommands.vue:110,371-373 | P2 | 前端可修（D24，批 2 可选） |
| S9 | 整包回传 mass-assignment 前瞻 | K9；DeviceCommands.vue:312-317,383-389 | 前瞻 P2 | 白名单可选（D25）；根治归后端 |

现症 P0：零。S1 为唯一条件性 P0 候选（后端必答前悬置）。

## 4. 未决问题表（★=后端必答）

| ID | 问题 | 阻塞什么 | 来源 |
|----|------|----------|------|
| Q1 | 占位符 `[$A|B]` 的 A/B 段语义、捕获组弃用原因（意图注释已随 4b02afd 删除，git 复核属实） | CMD-05 终稿措辞、D14/D16 修法边界 | 事实清单+三视角一致 |
| Q2 | 多占位符输入（相邻/隔文本）是否合法输入——贪婪正则现将其并为一行（实测 §0.2） | CMD-05 版本 A/B 裁决 | 同上 |
| Q3 | resStream 为何自必填改非必填（4b02afd 无说明） | CMD-04 两版判据、D19 取舍 | 事实清单 |
| ★Q4 | storeKey 语义与唯一性（后端存储键冲突行为） | D20 校验规则 | C19 |
| Q5 | isUnique「是否唯一键」语义与消费方（前端零读取） | 同上 | C19 |
| Q6 | paramLength 字节还是字符；string/number 分别如何约束 | 同上 | C19 |
| ★Q7 | 后端 search 匹配哪些字段（placeholder 仅「搜索命令名称」） | CMD-01 判据补充分支 | C7 |
| ★Q8 | GET 设备作用域 vs CUD 集合作用域不对称是既有设计还是待修正（与 B1 归属校验同问） | CMD-01 措辞、S1 缓解方向 | C1 |
| ★Q9 | ApiResponse.code 成功/失败语义（是否存 200+失败 code）——与 AUTH 域 OPEN C15/Q13（auth.md:117）合并一次裁决 | CMD-09 判据走向、全域错误单点 | C11 |
| Q10 | 命令库产品意图：是否应驱动 Monitor 下发（当前零关联，A2 复核成立） | CMD 契约下游约束、S3/D22 方向 | A2 |
| Q11 | AGENTS.md §3.3 高风险条目修正方向（规则变更须 PR 人批） | D22 | A1 |
| ★Q12 | 编辑命令 params 整包回传=全量替换还是合并；删参数行副作用 | CMD-02/07 判据 | C6 |
| ★Q13 | 删除命令是否级联影响设备会话/别处 | 删除交互判据 | 红队 |
| Q14 | 落库顺序：gate 溯源（测试声明 ID 须已存在 docs/）+反链（docs 引用测试须存在）双向约束→先建 commands.md 条目再同批挂测试 | T-006 编排硬约束 | 流程事实（gate.yml 复核） |
| Q15 | 手工加参与占位符生成的 paramType 种子默认值不一致（'' vs 'string'，:361 vs :345 实读）是否统一 | CMD-02 判据 | 测试视角新发现 |
| Q16 | add 提交依赖 axios 序列化隐式丢 `_id:undefined`（实测 §0.4）——是否改显式剥离 | CMD-01/07 判据 | 测试视角新发现 |

## 5. 三视角补充节（新发现续编号，分歧逐列双方立场+推荐）

### 5.1 架构视角补充
- 契约切分方案：C1-C19 收敛为 9 条编号+背景段（明细见其交付）；纯函数抽取边界 5 项落 src/utils/commands.ts（禁 import axios/vue-router/element-plus，沿 auth.ts/users.ts 头注范式）；明确不抽薄逻辑（页码重置/tag 色）。
- **分歧 A（CMD-04/CMD-05 措辞基线）**：契约写修复后目标语义（架构推荐）vs 锁贪婪现状——推荐「两版判据就绪、裁决①选边后仅落所选版」（测试视角形态），语义 OPEN 不阻塞。
- diff 预算：总估 700-900 行贴 800 上限，建议拆两批（与测试视角一致，切法分歧见裁决包第四节）。

### 5.2 测试视角补充
- 判据形态：10 个测试文件 ≈41 用例（vitest 收集计数 121 本会话复测一致）；适配器级/纯函数/路由静态三层，组件层转 GUI 人工判据 ~7 条（沿 faults.md 先例）。
- **C18 定性修正（本会话源码级证实采纳）**：element-plus 2.9.2 messageBox.mjs 默认配置 cancel/close 均 reject 'cancel'——测试视角正确，红队 K5 X/ESC 推断在当前调用点不成立（记为分歧 B，推荐采测试视角+契约防回归注记）。
- 新发现：@vueuse/core 幻影依赖（Monitor.vue:73 import 而 package.json 无，仅 lock 传递依赖 9.13.0）——不阻塞本批，扩域至 Monitor 前必须先补显式声明（供应链高风险，AGENTS.md §3.4）。
- 防同源：期望值三独立源（第三方源码/独立复算/契约字面量），禁 import 实现常量断言自身；现状锁定型条目如实标注并优先用关系不变量（deviceId 进 path 不进 query、add body 无 _id 键、幂等）。
- 可测性障碍清单 9 项（node 环境 stubEnv、vi.mock hoisting、axios 单例 adapter 注入等，均有 AUTH 先例可循）。

### 5.3 红队视角补充（A11-A19）
- 静默失败旁域：A11 Monitor getDeviceInfo 无 catch；A12 sendData 无 catch+无防重（→D18）；A13 Devices 启停不 await 即刷新（F-10 同型，DEV 域未登记）。
- 覆盖缺失：A14 高风险登记错位（→D22）；A15 gate 盲区——注册表承诺的契约文件缺失无门禁拦截（T-006 须显式写回填顺序，Q14 再证实）；A16 占位符逻辑内联不可测（先抽纯函数才可挂测试）；A17 socket 硬编码 localhost:3000（Monitor.vue:196）；A18 Monitor console.log 设备完整响应（F-06 同型，修复范围不含 Monitor）；A19 search 空串语义未知（并入 Q7）。
- 新缺陷 D23/D24/D25（竞态/index key/mass-assignment，见 §2）。
- **分歧 C（旁域归属）**：红队推荐 DEV 域另卡 vs 顺手并入本批——推荐另卡（diff 预算+域边界干净）。
- 仓库状态分歧：红队实测 master@3df7108 与事实清单 t005-pipeline-stage2@adae6f8 不符——本会话复测证实红队观察（adae6f8 未能复现，branch tip 实为 ed86867），关键文件两分支一致，行号引用仍有效；留痕以当前 HEAD 为准。

## 6. 未找到（notFound，均经 ls/grep 复核）
docs/contracts/commands.md（AGENTS.md:93 已注册路径，文件不存在）；docs/contracts/devices.md（同型旁证：注册先行、契约后补是既有模式）；CMD 域任何测试文件；faults.md 中 CMD 相关条目（F-01..F-12 全 AUTH 域）；T-006 任务卡；任何后端契约/仓库/OpenAPI（全部 API 形状为调用侧推断）；占位符语法文档（仅 commit diff 可考，意图注释已删）；storeKey/isUnique/paramLength 语义文档；CMD 相关 ADR；需求工单出处（3 commit message 均无链接）；CMD 遗留 console.log（当前文件零命中，4b02afd 已删 2 处）。

---

**诚实性声明**：本报告全部代码行号/文件内容引用均为本会话实读；正则行为、JSON 序列化、ElMessageBox 源码语义、vitest 收集计数 121 为本会话实测；vitest 套件未运行（pass/fail 未复核）；后端行为全部不可见；分支状态存在事实清单与实测不符（已按实测定案并留痕，adae6f8 未追查是否为历史提交）；首批 node -e 正则误报事故已识别并以防污染复测覆盖（§0.2）。
---

## 附录 A：裁决①票拟包全文（原样归档）


> 使用方式：每项均附推荐，可整包批「**全推荐**」，或逐项点名改判。批完后按 AGENTS.md §5.4 回填契约/补 ADR/OPEN 挂账。
> 编号规则：CMD-xx 为契约条目拟用 ID；D13+ 为缺陷全局续排拟用号；S1-S9 安全议题；B1-B5 后端必答。所有行号引用均经本会话复核（见 researchDraft §0 复核实录）。

---

## 一、约束批量确认（10 条 + 头部声明）

**切分方案推荐**：采用测试视角的 10 条切分（每条 ↔ 一个测试文件，贴合 gate.yml 溯源按 ID 收口的机制），架构视角的 CMD-07（deviceId 信任边界）降为**契约头部边界声明**（仿 auth.md 顶部「越权防护责任在后端」范式，不占号），CMD-09（自由文本）并入 CMD-02 + OPEN 挂账。逐条如下：

| ID | 条目（一句话） | 判据形态 | 状态建议 | 推荐 |
|----|----------------|----------|----------|------|
| CMD-01 | 命令四接口形状：GET `/devices/{deviceId}/commands`（query 仅 page/pageSize/search，deviceId 只进 path）；POST/PUT `/devices/command`（deviceId 仅在 body）；DELETE `/devices/command/{id}`；search 空串照发 | 适配器级 5 用例（关系不变量：deviceId 不进 query、add body 无 `_id` 键——后者经 axios JSON 序列化隐式丢弃 undefined，是否改显式剥离见 Q16） | 草案[确认]+OPEN Q7/Q8 | **确认（现状锁定型·回归钉）；Q8 不对称单独走后端必答 B1，不改前端** |
| CMD-02 | 命令实体九字段+参数行七字段；全部自由文本输入、前端无唯一性/格式/HEX 合法性校验（现状） | 纯函数 4 用例（buildEmptyCommandForm 终态、buildPlaceholderParam 种子、reset 终态含 deviceId 保留） | 草案[确认]+OPEN Q4/Q5/Q6/Q15 | **确认（锁现状）；校验规则待 Q4/Q5/Q6 答复后另批** |
| CMD-03 | 枚举：commandType∈{GET,SET}、streamType∈{ASCII,HEX}、paramType∈{string,number}，大小写敏感，硬编码下拉抽常量 | 纯函数 4 用例（含 `'get'`→false 边界） | 草案[确认]（现状锁定·回归钉，无独立外部规范源） | **确认** |
| CMD-04 | 表单必填：commandName/commandType/streamType/reqStream 必填；resStream 非必填（4b02afd 注释，无理由）；参数行名称/类型/键名/标签/长度必填，paramValue/isUnique 非必填 | 纯函数 5 用例；**两版判据已就绪**（resStream 恢复必填则全空表单 4→5 条错误） | **待裁（Q3 二选一）** | **推荐版本 A：锁现状 resStream 非必填**（无业务证据支撑恢复；恢复等 Q3 答复，改 3 行即可） |
| CMD-05 | 占位符解析：reqStream 中 `[$A|B]` 片段 → 参数行（paramLabel=整段匹配串、按 paramLabel 精确去重、捕获组弃用） | 纯函数 7 用例（单符/相邻/隔文本/空段/未闭合/无符）；**A/B 两版判据已就绪**：A=锁贪婪并段现状，B=一占位符一行 | **待裁（Q1/Q2 二选一）** | **推荐版本 B：修为一占位符一行**（贪婪并段波及面本会话实测证实含非相邻场景，隔任意文本即并串，单字段多占位符全废；非贪婪两字符改动 + 非贪婪行为本会话实测通过；A/B 语义 OPEN 不阻塞此修——label 仍取整段匹配串，语义裁决后可再演进） |
| CMD-06 | 参数行联动：新占位符追加种子行、同 label 幂等去重；现状只增不删 | 纯函数 4 用例（追加/幂等/孤儿行/同名相邻） | **待裁（与 D15 联动）** | **推荐：随 CMD-05 版本 B 一并裁「全量同步、删空值孤儿行、已有输入的行不自动删」**（防脏数据堆积，K2 链条根因之一）；若人倾向最小冷启动则锁只增不删现状记已知边界 |
| CMD-07 | 提交分流：`_id` 有无 → edit/add，整表单对象回传 | 纯函数 3 用例（含 `_id===''` → add 边界） | 草案[确认] | **确认（现状锁定）**；显式剥离 `_id:undefined` 见 Q16（推荐剥离，消除对序列化隐式行为依赖，纯函数 buildCommandPayload 内 1 行） |
| CMD-08 | 删除确认与取消/错误分流：ElMessageBox 确认后发 DELETE；用户取消（按钮或 X/ESC）静默，API 失败单点 toast | 纯函数谓词 3 用例（isUserCancelled('cancel')→true、Error 对象→false）；**经本会话核实 element-plus 2.9.2 源码：默认 distinguishCancelAndClose=false 时 cancel 与 close 均 reject 'cancel'**（messageBox.mjs:54-58），故现状 `error !== 'cancel'` 对两条用户取消路径恰好正确——C18 真实缺陷仅剩「API 失败对象→恒真→双弹窗」，随 D17 消解 | 草案[确认]（目标态，随 D17 生效） | **确认**；红队 K5 的「X/ESC 误报删除失败」触发面经源码实证**否定**（仅当未来启用 distinguishCancelAndClose 才成立，契约加一条防回归注释即可） |
| CMD-09 | 列表消费：只读 data.items/data.total；code 零消费、成功判定纯 HTTP status（现状锁定）；搜索/翻页后 page 语义（搜索重置回 1）；初始查询 page=1/pageSize=10 | 纯函数 3 用例（含 200+非零 code 照常返回——钉住现状，OPEN 期间禁止改读 code） | 草案[确认]+OPEN Q9 | **确认（现状锁定）；Q9 与 AUTH C15/Q13 合并一次后端必答（B2），答复后全域同判同修** |
| CMD-10 | 路由与访问语义：`/devices/:id/commands` 未声明 meta.roles → 按 AUTH-14 登录即可访问（现状锁定）；唯一入口设备列表行操作 | 路由静态 3 用例（仿 test_auth_14：import routes.ts 纯数据） | 草案[确认]（现状锁定） | **确认**；是否收紧 roles 随 S1/B1 后端答复另裁（本批不动） |

**头部边界声明（不占号）**：① deviceId 取自路由参数原样入 query/表单、前端不做存在性校验——前端非安全边界，越权防护归后端（并入 B1）；② AUTH-03/04/05/13 跨域契约对 CMD 调用自动生效，不重复抄写；③ 命令库实体当前全仓零消费方、与 Monitor 发送零关联（A2/Q10，产品意图 OPEN）；④ 表格列/tag 色/monospace 为展示现状非业务规则。

---

## 二、缺陷修复范围

**编号推荐**：D 全局续排 D13+（与 faults.md D↔F 全局映射惯例一致）；D17 对应的故障登记推荐**新开 F-13**（faults.md F-01..F-12 均 AUTH 域，扩围用批注易掩埋范围演变史）——机制人选。

### 推荐包（随 T-006 实施）
| ID | 缺陷 | 修法 | 推荐 |
|----|------|------|------|
| D17（=C17/A5，→F-13） | 三处调用方二次弹窗 + axios 英文技术文案 | 删 DeviceCommands.vue:286,330,393 三处 ElMessage.error，错误单点归拦截器（F-01/F-11 已裁同型，faults.md:13 判据原文「调用方不再吞/不再重复弹」）；D13 随之消解（catch 区分取消/失败的比较整个消失） | **修**（-12 行） |
| D13（=C18） | `error !== 'cancel'` 弱类型比较 | 随 D17 消解（推荐）；备选拆 try + isMessageBoxCancel 守卫 | **随 D17 消解，不单独修** |
| D14（=A3） | 贪婪正则并段 | 非贪婪 `/\[$(.+?)\|(.+?)\]/g`（两字符；本会话实测非贪婪对相邻/隔文本均正确分行） | **修**（随 CMD-05 版本 B，+2 行） |
| D15（=A4） | 占位符只增不删 | syncParams 全量同步：删仍为空值的孤儿行（有输入的不自动删） | **修**（随 CMD-06，+15 行） |
| D16（=A10） | paramLabel 存整段含括号串 | 随纯函数抽取定形（label=匹配串，集中可测；语义字段拆存等 Q1） | **随抽取收编，不单独改行为** |

### 可选项（默认不做，点名才做）
| ID | 项 | 推荐 |
|----|----|------|
| D19（=A6/Q3） | resStream 恢复必填 | 不做，锁现状+OPEN Q3（CMD-04 推荐已含） |
| D20（=C19） | 自由文本加格式/唯一性校验 | 不做，OPEN Q4/Q5/Q6 禁先行 |
| D21（=C14） | GET/SET tag 分色 | 不做（纯视觉，+2 行随时可批） |
| D23（=K7） | 列表请求竞态守卫 | 不做，批 2 顺手可加（+8 行） |
| D24（=K8） | 参数区 :key=index 改稳定 key | 不做，批 2 顺手可加（+4 行） |
| D25（=K9） | 提交白名单防 mass-assignment | 不做，纯前瞻（实体尚无只读字段） |

### 域外登记（不并入本批）
| 项 | 归属 | 推荐 |
|----|------|------|
| D18（=A9/A12）Monitor sendData 无 catch、按钮无防重；A11 getDeviceInfo 无兜底；A13 Devices 启停假态（F-10 同型）；A17 socket 硬编码；A18 console.log | DEV 域另卡（红队推荐） | **另起 DEV 欠账卡**（防 diff>800 硬卡 + 域边界干净；Devices/Monitor 与 commands.md 无耦合） |
| D22（=A1/Q11）AGENTS.md §3.3 高风险条目失实 | 规则文件修正 PR | **改指 Monitor.vue:175-183 deviceSendData（api/index.ts:139-141）+ Devices.vue:198-209 启停**，独立 PR 走人工复核（AGENTS.md 头部条款）；不依赖本批 |
| A15 gate 盲区（注册表承诺的契约文件缺失无门禁拦截） | 流程改进 | 记入 T-006 卡备注，暂不改 gate（改 CI 属高风险变更须人批） |

---

## 三、安全分流（前端处理 | 转后端 | OPEN）

| ID | 议题（一句话/证据） | 分流 | 推荐 |
|----|------------------------|------|------|
| S1（=K1，含 C10） | 任意登录用户可读/改任意设备命令库：CMD 页无 roles（CMD-10 现状）+ deviceId 路由参数无校验（DeviceCommands.vue:228）+ CUD 集合作用域 deviceId 仅在 body（api/index.ts:154-164） | **转后端（必答 B1）** | 后端确认 /devices/command* 无归属/角色校验则升 P0；前端本批不动（加 meta.roles 会破坏 AUTH-14 现状锁定，等 B1+Q10 答复一起裁）；契约头部已声明边界 |
| S2（=K2→D14/D15/D16） | 占位符缺陷链→脏参数入库 | **前端处理** | 随推荐包 D14/D15/D16 一次修净 |
| S3（=K3+A12） | 真实下发路径（Monitor send）无防重无 catch，高风险登记错位 | **前端处理·域外** | DEV 域另卡（D18）+ AGENTS.md 修正 PR（D22）；若 Q10 裁决「命令库驱动下发」则升级并入 CMD 后续批 |
| S4（=K4/Q9） | 200+失败 code → 假成功 | **OPEN（后端必答 B2）** | 与 AUTH C15/Q13（auth.md OPEN 挂账）**合并一问一裁**，禁两域各判各修；CMD-09 判据已钉现状 |
| S5（=K5→D17/F-13） | 双弹窗+技术文案 | **前端处理** | 随 D17 修；K5 的 X/ESC 触发面经 element-plus 2.9.2 安装源码实证**不成立**（默认配置 cancel/close 同拒 'cancel'），契约留防回归注记即可 |
| S6（=K6/Q4/Q6/Q7） | 零格式校验×后端语义未知 | **OPEN** | D20 锁现状；HEX 合法性/paramLength 语义/storeKey 唯一性等 B 答复后补 validator |
| S7（=K7） | 列表竞态（先发后至覆盖） | **前端处理（可选）** | 不入推荐包；批 2 顺手项 D23 |
| S8（=K8） | 参数区 index key 删行错位 | **前端处理（可选）** | 不入推荐包；批 2 顺手项 D24 |
| S9（=K9/Q12 相关） | 整包回传 mass-assignment 前瞻 | **OPEN** | 后端引入只读字段时必答；可选 buildCommandPayload 白名单（D25） |

---

## 四、任务卡三栏草案（T-006）

### 目标
CMD 域契约冷启动落地：新建 `docs/contracts/commands.md`（CMD-01..10 + 头部边界声明 + OPEN 挂账 Q4/Q5/Q6/Q9 等），抽取 `src/utils/commands.ts` 纯函数层（占位符解析/参数联动/表单校验/提交分流/枚举常量；边界同 utils/users.ts:6 禁 import axios/vue-router/element-plus），挂 10 个契约测试文件（test_cmd_01..10），并完成已批缺陷修复（推荐包 D17/D13/D14/D15/D16 → F-13）。

### 验收
1. gate 全绿：溯源（测试头声明的 CMD-xx 已存在于 docs/contracts/commands.md）、反向链接（commands.md 引用的 tests/ 文件真实存在）、diff≤800、`npx vitest run tests/contracts tests/faults` 全绿；
2. 基线不破：旧 121 用例（本会话 `npx vitest list` 实测计数）零回归，新增约 41 用例（10 文件）；
3. F-13 判据：DeviceCommands.vue 三处调用方 ElMessage.error 移除，错误提示单点拦截器（GUI 人工判据：制造 API 失败仅一弹）；
4. GUI 人工清单约 7 条固化（确认框取消静默、enter/clear 搜索重置第一页、reset 探针、入口跳转、编辑分流、删除刷新、X/ESC 取消静默——最后一条留观察 distinguishCancelAndClose 恒 false）；
5. 组件接线改造仅调纯函数，逻辑零内联残留（占位符/校验/分流全部走 utils）。

### 范围
- **IN**：docs/contracts/commands.md、src/utils/commands.ts、tests/contracts/test_cmd_01..10、DeviceCommands.vue 接线改造、F-13 登记（faults.md）。
- **OUT**：Monitor.vue / Devices.vue 一切变更（DEV 另卡 D18）、后端、AGENTS.md 修正（独立 PR D22）、新增任何依赖、@vueuse/core 显式化（仅当扩域才触发）。
- **顺序硬约束**：裁决① → 回填 commands.md → 同批挂测试（gate.yml 溯源+反链双向约束契约与测试同 PR 一致，A15 盲区所致）。
- **批次（推荐，总估 ~860 行必拆）**：
  - 批 1（~640 行）：commands.md（~120）+ utils/commands.ts（~120）+ test_cmd_02..09 纯函数级 8 文件（~400，含 CMD-05/06 裁决后所选版判据）；
  - 批 2（~220 行）：DeviceCommands.vue 接线改造+D17/D13（~80）+ test_cmd_01 适配器级/test_cmd_10 路由静态（~100）+ GUI 清单（~40）。
  - 备选（测试视角切法）：批 1=契约+纯函数+接线，批 2=适配器/路由+GUI——两切法均可行，推荐前者（批 1 无组件改动、风险最小；D17 接线随批 2 落地时 F-13 判据同批可验）。

---

## 五、OPEN 与后端必答清单

### 后端必答（B1-B5，本仓库边界外）
| # | 问题 | 阻塞 |
|---|------|------|
| B1 | /devices/command* 四端点是否做归属（deviceId↔资源）与角色校验？（S1/K1） | S1 定级（无校验即 P0）、CMD-10 是否加 roles、Q8 作用域不对称定性 |
| B2 | 是否存在「HTTP 200 + 失败 code」？（Q9） | CMD-09 判据走向；**与 AUTH C15/Q13 合并一次问** |
| B3 | search 模糊匹配哪些字段？（Q7） | CMD-01 判据补充分支、placeholder 文案正误 |
| B4 | 编辑命令 params 数组整包回传=全量替换还是合并？（Q12） | CMD-02/07 判据、D25 白名单性价比 |
| B5 | 删除命令是否级联影响设备会话/别处引用？（Q13） | 删除交互判据完整性 |

### 前端域内 OPEN（答前禁止实现，AGENTS.md §1）
Q1 占位符 A/B 段语义与捕获组弃用原因（无文档，意图注释已随 4b02afd 删除）；Q2 相邻/多占位符合法性（CMD-05 版本裁决即 Q2 落地）；Q3 resStream 必填恢复与否；Q4 storeKey 语义/唯一性；Q5 isUnique 消费方；Q6 paramLength 字节/字符义；Q8 API 作用域不对称定性（并入 B1）；Q10 命令库产品意图（零消费方，A2——是否驱动下发，牵动 S3 与 D22 方向）；Q11 AGENTS.md §3.3 修正方向（D22）；Q15 paramType 种子默认值统一（手工 '' vs 占位符 'string'，建议统一 'string'）；Q16 add 载荷显式剥离 `_id:undefined`（建议剥离）。

### 流程裁决（一次点清）
① CMD-05/06 版本 B、CMD-04 版本 A（第一、二节推荐）；② D 全局续排 D13+；③ D17→新 F-13（非 F-11 批注）；④ 批次切法采「批 1 纯函数/批 2 接线」；⑤ 旁域发现归 DEV 另卡；⑥ D22 独立 PR。批「全推荐」= 以上六项 + 各表推荐列全部生效。

---

### 诚实性声明
本包所有代码行号、git 事实、element-plus 源码行为、正则行为、121 收集计数均经本会话独立复核（命令与输出见 researchDraft §0）；vitest 套件未运行（pass/fail 未复核）；后端行为全部不可见（B1-B5 无从自答）；ElMessageBox 实际 GUI 行为未浏览器实测（源码级证据替代，GUI 清单第 7 条留验）。
---

## 附录 B：裁决①记录（2026-11-10）

- 裁决人：owner（brycetony）；批复方式：「全推荐」——票拟包头部使用说明约定的整包批红
  （六项流程裁决 + 各表推荐列全部生效），或逐项点名改判（未发生）。
- 裁决材料：票拟包（附录 A）+ RESEARCH 草稿（正文），由本会话自 workflow 产物卡片取回后呈现。

| # | 裁决项 | 结果 |
|---|--------|------|
| ① | CMD-05/06 采**版本 B**：占位符修为一符一行（非贪婪正则）；参数行全量同步——删仍为空值的孤儿行、已有输入的行不自动删；CMD-04 采**版本 A**：resStream 锁非必填现状 | 生效 |
| ② | 缺陷编号全局续排 **D13+**（与 faults.md D↔F 映射惯例衔接：该一一对应仅适用 AUTH 域 D1-D12 先例；自 D13 起 D 全局续排、F 按确认修复登记顺序分配，faults.md 头部规则随批 2 同步修订——PR16 审查 P1） | 生效 |
| ③ | D17（CMD 侧双弹窗）登记为**新开 F-13**，不作 F-11 批注扩围 | 生效 |
| ④ | 批次切法：**批 1 = 契约 + 纯函数 + 纯函数级测试**（test_cmd_02..09）；**批 2 = 接线 + 适配器级/路由静态 + GUI 清单**（test_cmd_01/10） | 生效 |
| ⑤ | 旁域发现（D18/A11/A13/A17/A18）归 **DEV 域另卡登记**，不并入本批 | 生效（→ T-007） |
| ⑥ | D22（AGENTS.md §3.3 高风险条目失实）**独立 PR** 修正：改指 Monitor.vue 发送路径（Monitor.vue:175-183 → api/index.ts:139-141）+ Devices.vue 启停（Devices.vue:198-209） | 生效 |

其余各表推荐列同步生效的要点：契约 10 条切分（架构视角草案中的 deviceId 信任边界降为
契约头部边界声明、自由文本校验条目并入 CMD-02——终版 CMD-01..10 全部占号，以附录 A
第一节表为准，PR16 审查 P2）；
推荐修 D14/D15/D16（随 CMD-05/06 版本 B 与纯函数抽取落地）；D13 随 D17 消解；可选项 D19/D20/D21/D23/D24/D25
默认不做（点名才做）；安全分流 S1 转后端必答 B1、S4 转后端必答 B2（与 AUTH C15/Q13 合并一问一裁）、
S3 域外（T-007 + D22）；后端必答 B1-B5 转 owner 挂账。

- 政策 A 沿用（gate 绿 + 合并前审查无 P0/P1 即自动合并，T-004 起生效）：裁决①呈现时按「默认沿用」声明，
  owner 批复「全推荐」未提出异议——按沿用记录于 T-006 §3；owner 可随时改判。
- Q16（add 载荷显式剥离 `_id:undefined`）：票拟包中同时出现于 OPEN 清单（建议剥离）与 CMD-07 推荐列
  （推荐剥离，`buildCommandPayload` 纯函数内 1 行）——按「全推荐含推荐列」生效，随批 1 落地；
  该项视为已裁，不再挂 OPEN。
- Q15（paramType 种子默认值 '' vs 'string'）：无推荐列覆盖，维持 OPEN 锁现状（两种种子并存如实入契约），
  答复后另批。
- Q2（多占位符合法性）：随裁决①版本 B 落地为「合法输入、一符一行」，不再挂 OPEN；
  Q1（A/B 段语义）维持 OPEN——label 取整段匹配串的现状不阻塞，语义裁决后可再演进。
