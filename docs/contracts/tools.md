# 工具页契约 TOOLS

- 状态：已确认（v1，2026-11-05）
- 资料责任人（owner）：@brycetony —— 本文件唯一维护人，规则变更走 PR + owner 复核
- 关联任务：T-001
- 约束来源：docs/tasks/RESEARCH-tools-2026-11-04.md 考古 + 裁决（2026-11-05，C1–C8 全部确认）

## 背景

工具页（`src/views/Tools.vue`，纯函数已抽取至 `src/utils/tools.ts`）提供转换、校验、
哈希、密码、加密、编码等工具。本契约锁定其行为判据。

## 业务规则

每条规则有唯一 ID 和状态。`[确认]` = 可作为实现与测试依据；`[OPEN]` = 未决，实现时禁止自行决定。

| ID | 状态 | 规则 |
|----|------|------|
| TOOLS-01 | [确认] | 密码生成必须使用密码学安全随机源（`crypto.getRandomValues`），**禁止 `Math.random()`**（裁决自 C1） |
| TOOLS-02 | [确认] | 生成的密码必须覆盖所选的每一类字符各至少 1 个（长度须 ≥ 所选类别数）（裁决自 C2） |
| TOOLS-03 | [确认] | 对称加密（AES/DES/3DES）使用 ECB 模式 + PKCS7 填充，密钥取 UTF-8 字节。**有意保留现状**（设备端互操作背景由裁决人确认）；相同明文+密钥的密文确定性一致（裁决自 C3） |
| TOOLS-04 | [确认] | 解密失败必须显式返回失败原因（格式错误 / 解密失败），**禁止静默返回空串**（裁决自 C4） |
| TOOLS-05 | [确认] | Base64 编解码采用 `encodeURIComponent + btoa` 变体（**非 RFC 4648**，确认为有意行为）：外部互操作不要求标准编码，但编解码必须自洽可逆（裁决自 C5） |
| TOOLS-06 | [确认] | 校验和/CRC（Modbus/CCITT/XMODEM/CRC32）计算结果必须与标准测试向量一致。**验证层在后端**（`src/api/index.ts:191-211` 经 `/api` 调用），本仓库不持有实现（裁决自 C6） |
| TOOLS-07 | [确认] | JSON 高亮输出必须保持 HTML 转义：任意输入的高亮 HTML 不得包含未转义的用户内容（XSS 不变量，`v-html` 渲染前提）（裁决自 C7） |
| TOOLS-08 | [确认] | 哈希输出为小写十六进制字符串（裁决自 C8） |
| TOOLS-09 | [确认] | 密钥长度按 **UTF-8 字节数**校验：AES 16/24/32、DES 8、3DES 24 字节；不满足时加密显式报错、解密返回 `invalid-key`（2026-11-05 裁决，来源 T-001 §7 新决策项） |

## 验收判据（测试必须逐条覆盖）

| 判据 | 场景 | 对应测试 |
|------|------|----------|
| TOOLS-01 | `Math.random` 被替换为抛错函数后生成密码仍成功；随机源来自 `crypto.getRandomValues` | `tests/contracts/test_tools_01.test.ts` |
| TOOLS-02 | 任意勾选 k 类 × 长度 ≥ k，重复生成，每次每类 ≥1 字符且不包含未选类别字符 | `tests/contracts/test_tools_02.test.ts` |
| TOOLS-03 | 含两个相同 16 字节块的明文 → 密文原始字节对应块相同（ECB 指纹）；同输入确定性；三种算法 round-trip | `tests/contracts/test_tools_03.test.ts` |
| TOOLS-04 | 错误密钥解密 → 显式 `{ok:false}`；非法 Base64 → `invalid-input`；正确密钥 → 还原 | `tests/contracts/test_tools_04.test.ts` |
| TOOLS-05 | `é`/`中`/`A` 编码等于变体的已知字面值（`JUMzJUE5` 等，非 RFC4648 值）；round-trip 自洽 | `tests/contracts/test_tools_05.test.ts` |
| TOOLS-06 | 标准向量：CRC16-Modbus("123456789")=0x4B37 等 —— **后端验证层，不在本仓库测试** | （外部：后端测试/联调） |
| TOOLS-07 | 值含 `<script>`/`<img onerror>` 的 JSON → 高亮输出含 `&lt;script`、不含裸 `<script`；非法 JSON 抛错 | `tests/contracts/test_tools_07.test.ts` |
| TOOLS-08 | 公开标准向量：MD5/SHA-1/SHA-256/SHA-512("abc") 的小写 hex 精确匹配 | `tests/contracts/test_tools_08.test.ts` |
| TOOLS-09 | 字节数≠字符数：`é`×8（16 字节）AES 有效；15 字节密钥加密抛错、解密 `invalid-key`；DES/3DES 各自边界 | `tests/contracts/test_tools_09.test.ts` |

## 已知边界（如实记录，非规则）

1. TOOLS-03 锁定 ECB 是裁决结果：若未来发现设备端并无此约定，按 ADR 流程改判，届时规则与测试同步变更。
2. TOOLS-04 的"解密失败"语义在 ECB + 无完整性校验下无法密码学地区分"密钥错误"与"密文损坏"，
   两者归并为 `failed`；`invalid-input` 仅指格式（非 Base64）错误。空明文加密后解密的歧义不在判据内。
3. 密钥长度校验：原为已知缺口（沿用任意长度密钥），2026-11-05 经裁决补为规则 TOOLS-09。

## 变更记录

- v1.1 2026-11-05：新增 TOOLS-09（密钥长度校验）。来源：T-001 §7 新决策项，@brycetony 裁决。
- v1 2026-11-05：初版。RESEARCH-tools-2026-11-04 考古报告 C1–C8 经 @brycetony 全部裁决为确认，回填成 TOOLS-01..08。
