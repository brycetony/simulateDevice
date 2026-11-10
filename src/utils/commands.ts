/**
 * CMD 域纯函数（从 src/views/DeviceCommands.vue 抽取）。
 *
 * 判据来源：docs/contracts/commands.md 条目 CMD-02..09（2026-11-10 裁决①，版本 B/A 见各条）。
 * 本文件是被测实现；规则以契约为准。
 * 边界约定：禁止 import axios / vue-router / element-plus / Vue 组件。
 */

// ---------- CMD-03：枚举常量（现状锁定·回归钉，硬编码下拉抽常量） ----------

export const COMMAND_TYPES = ['GET', 'SET'] as const
export type CommandType = (typeof COMMAND_TYPES)[number]

export const STREAM_TYPES = ['ASCII', 'HEX'] as const
export type StreamType = (typeof STREAM_TYPES)[number]

export const PARAM_TYPES = ['string', 'number'] as const
export type ParamType = (typeof PARAM_TYPES)[number]

/** [CMD-03] 枚举谓词：大小写敏感（'get' 无效）。 */
export function isCommandType(value: unknown): value is CommandType {
  return (COMMAND_TYPES as readonly string[]).includes(value as string)
}

export function isStreamType(value: unknown): value is StreamType {
  return (STREAM_TYPES as readonly string[]).includes(value as string)
}

export function isParamType(value: unknown): value is ParamType {
  return (PARAM_TYPES as readonly string[]).includes(value as string)
}

// ---------- CMD-02：实体形状与种子 ----------

export interface CommandParam {
  paramName: string
  paramType: string
  paramKey: string
  paramLabel: string
  paramLength: number
  paramValue: string
  isUnique: boolean
}

export interface CommandForm {
  _id?: string
  deviceId: string
  commandName: string
  commandType: string
  streamType: string
  reqStream: string
  resStream: string
  storeKey: string
  params: CommandParam[]
}

/** [CMD-02] 新增对话框初始态：九字段、params 空、不含 _id 键（对齐原 reactive 初始态）。 */
export function buildEmptyCommandForm(deviceId: string): CommandForm {
  return {
    deviceId,
    commandName: '',
    commandType: '',
    streamType: '',
    reqStream: '',
    resStream: '',
    storeKey: '',
    params: [],
  }
}

/** [CMD-02] 占位符联动种子行（paramType='string'；与手工种子不一致为现状锁定，OPEN Q15）。 */
export function buildPlaceholderParam(paramLabel: string): CommandParam {
  return {
    paramName: '',
    paramType: 'string',
    paramKey: '',
    paramLabel,
    paramLength: 1,
    paramValue: '',
    isUnique: false,
  }
}

/** [CMD-02] 手工添加种子行（paramType=''；现状锁定，OPEN Q15 答复后统一）。 */
export function buildManualParam(): CommandParam {
  return {
    paramName: '',
    paramType: '',
    paramKey: '',
    paramLabel: '',
    paramLength: 1,
    paramValue: '',
    isUnique: false,
  }
}

/** [CMD-02] 对话框关闭终态：deviceId 保留、其余清空、_id 显式置 undefined（对齐原 resetForm）。 */
export function resetCommandForm(deviceId: string): CommandForm {
  return { ...buildEmptyCommandForm(deviceId), _id: undefined }
}

// ---------- CMD-05：占位符解析（版本 B，裁决①；D14 修复） ----------

// 非贪婪：一占位符一行（裁决①版本 B，替代贪婪 /\[\$(.+)\|(.+)\]/g 的并段行为）。
// 段内 A/B 两侧各至少 1 字符（.+?），空段 / 未闭合不匹配。
const PLACEHOLDER_RE = /\[\$(.+?)\|(.+?)\]/g

/** [CMD-05] 提取 reqStream 中全部占位符的整段匹配串（按出现顺序；无匹配返回空数组）。 */
export function parsePlaceholders(reqStream: string): string[] {
  return reqStream.match(PLACEHOLDER_RE) ?? []
}

// ---------- CMD-06：参数行联动（版本 B，裁决①；D15/D16 修复） ----------

/** [CMD-06] 行内已有用户输入（占位符种子字段被填过则不算孤儿空行）。 */
function hasUserInput(param: CommandParam): boolean {
  return param.paramName !== '' || param.paramKey !== '' || param.paramValue !== ''
}

/**
 * [CMD-06] reqStream 变化 → params 全量同步（纯函数，返回新数组，不改入参）：
 * - 每个占位符恰占一行：已有同 label 行保留（留首行，幂等去重），新 label 追加种子行；
 * - label 已不在 reqStream 的行：仍为空值的孤儿行删除（D15），已有输入的行保留；
 * - 手工行（paramLabel 为空串）不自动删。
 */
export function syncParams(reqStream: string, params: CommandParam[]): CommandParam[] {
  const labels = parsePlaceholders(reqStream)
  const labelSet = new Set(labels)
  const kept: CommandParam[] = []
  const seen = new Set<string>()
  for (const param of params) {
    if (param.paramLabel === '') {
      kept.push(param) // 手工行：保留
      continue
    }
    if (!labelSet.has(param.paramLabel)) {
      if (hasUserInput(param)) {
        kept.push(param) // 孤儿但有输入：保留
      }
      continue // 空值孤儿：删除（D15）
    }
    if (seen.has(param.paramLabel)) {
      continue // 同 label 重复行：留首行（幂等去重）
    }
    seen.add(param.paramLabel)
    kept.push(param)
  }
  for (const label of labels) {
    if (!seen.has(label)) {
      seen.add(label)
      kept.push(buildPlaceholderParam(label))
    }
  }
  return kept
}

// ---------- CMD-04：表单校验（版本 A，裁决①） ----------

export interface CommandFieldError {
  field: string
  message: string
}

/** [CMD-04] 主表单必填：commandName/commandType/streamType/reqStream；
 * resStream 非必填（版本 A，OPEN Q3）。空串判定不 trim（锁现状）。 */
export function validateCommandForm(form: CommandForm): CommandFieldError[] {
  const errors: CommandFieldError[] = []
  if (form.commandName === '') {
    errors.push({ field: 'commandName', message: '请输入命令名称' })
  }
  if (form.commandType === '') {
    errors.push({ field: 'commandType', message: '请选择命令类型' })
  }
  if (form.streamType === '') {
    errors.push({ field: 'streamType', message: '请选择码流类型' })
  }
  if (form.reqStream === '') {
    errors.push({ field: 'reqStream', message: '请输入请求码流' })
  }
  return errors
}

/** [CMD-04] 参数行必填：paramName/paramType/paramKey/paramLabel/paramLength；
 * paramValue/isUnique 非必填。文案与组件 el-form 规则双轨对齐（分歧即缺陷）。 */
export function validateCommandParam(param: CommandParam): CommandFieldError[] {
  const errors: CommandFieldError[] = []
  if (param.paramName === '') {
    errors.push({ field: 'paramName', message: '请输入参数名称' })
  }
  if (param.paramType === '') {
    errors.push({ field: 'paramType', message: '请输入参数类型' })
  }
  if (param.paramKey === '') {
    errors.push({ field: 'paramKey', message: '请输入参数键名' })
  }
  if (param.paramLabel === '') {
    errors.push({ field: 'paramLabel', message: '请输入参数标签' })
  }
  if (param.paramLength == null) {
    errors.push({ field: 'paramLength', message: '请输入参数长度' })
  }
  return errors
}

// ---------- CMD-07：提交分流（Q16 已裁：add 显式剥离 _id） ----------

export type SubmitMode = 'add' | 'edit'

export interface CommandSubmit {
  mode: SubmitMode
  payload: Record<string, unknown>
}

/** [CMD-07] _id 有值 → edit（整包含 _id）；无值或空串 → add（显式剥离 _id 键，Q16）。 */
export function buildCommandPayload(form: CommandForm): CommandSubmit {
  if (form._id) {
    return { mode: 'edit', payload: { ...form } }
  }
  const payload: Record<string, unknown> = { ...form }
  delete payload._id
  return { mode: 'add', payload }
}

// ---------- CMD-08：删除取消分流（F-13/D13 随行消解） ----------

/**
 * [CMD-08] ElMessageBox 用户取消判定：element-plus 2.9.2 默认
 * distinguishCancelAndClose=false，取消按钮与 X/ESC 均 reject 'cancel'
 * （源码实证见 RESEARCH-cmd §0.3）。'close' 仅在启用该选项时另现——按非取消严格
 * 处理（契约防回归注记：届时须重裁）。
 */
export function isUserCancelled(error: unknown): boolean {
  return error === 'cancel'
}

// ---------- CMD-09：列表消费 ----------

/** [CMD-09] 只读 data.items/data.total；code 零消费——200+非零 code 照常返回
 * （钉现状，OPEN B2 期间禁止改读 code）。 */
export function consumeListResponse(res: {
  code?: number
  data: { items: unknown[]; total: number }
}): { items: unknown[]; total: number } {
  return { items: res.data.items, total: res.data.total }
}
