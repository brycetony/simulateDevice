<template>
  <div class="tools-container">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- 字符串转换 -->
        <el-tab-pane label="字符串转换" name="string">
          <el-form :model="stringForm" label-width="80px">
            <el-form-item label="数据">
              <el-input
                v-model="stringForm.input"
                type="textarea"
                :rows="4"
                :placeholder="stringForm.mode === 'hex' ? '请输入十六进制字符串' : '请输入文本'"
              />
              <div class="form-actions">
                <el-radio-group v-model="stringForm.mode" @change="handleModeChange">
                  <el-radio-button label="text">字符串</el-radio-button>
                  <el-radio-button label="hex">十六进制(HEX)</el-radio-button>
                </el-radio-group>
                <el-button type="primary" @click="handleFormatHex" v-if="stringForm.mode === 'hex'">格式化</el-button>
              </div>
            </el-form-item>
            <el-form-item label="Base64">
              <el-input
                v-model="stringForm.base64"
                type="textarea"
                :rows="4"
                placeholder="请输入Base64字符串"
              />
              <div class="form-actions">
                <el-button type="primary" @click="handleBase64ToHex">转换为十六进制</el-button>
                <el-button type="primary" @click="handleHexToBase64">十六进制转Base64</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 校验计算 -->
        <el-tab-pane label="校验计算" name="check">
          <el-form :model="checkForm" label-width="80px">
            <el-form-item label="十六进制">
              <el-input
                v-model="checkForm.hex"
                type="textarea"
                :rows="4"
                placeholder="请输入十六进制字符串"
              />
            </el-form-item>
            <el-form-item>
              <div class="check-buttons">
                <el-button type="primary" @click="handleCalculateChecksum">计算校验和</el-button>
                <el-button type="primary" @click="handleCalculateXOR">计算异或校验</el-button>
                <el-button type="primary" @click="handleCalculateCRC16Modbus">CRC16-Modbus</el-button>
                <el-button type="primary" @click="handleCalculateCRC16CCITT">CRC16-CCITT</el-button>
                <el-button type="primary" @click="handleCalculateCRC16XMODEM">CRC16-XMODEM</el-button>
                <el-button type="primary" @click="handleCalculateCRC32">CRC32</el-button>
              </div>
            </el-form-item>
            <el-form-item label="计算结果">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="校验和">{{ checkForm.checksum }}</el-descriptions-item>
                <el-descriptions-item label="异或校验">{{ checkForm.xor }}</el-descriptions-item>
                <el-descriptions-item label="CRC16-Modbus">{{ checkForm.crc16Modbus }}</el-descriptions-item>
                <el-descriptions-item label="CRC16-CCITT">{{ checkForm.crc16CCITT }}</el-descriptions-item>
                <el-descriptions-item label="CRC16-XMODEM">{{ checkForm.crc16XMODEM }}</el-descriptions-item>
                <el-descriptions-item label="CRC32">{{ checkForm.crc32 }}</el-descriptions-item>
              </el-descriptions>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 时间转换 -->
        <el-tab-pane label="时间转换" name="time">
          <el-form :model="timeForm" label-width="80px" style="width: 500px;">
            <el-form-item label="时间戳">
              <el-input
                v-model="timeForm.timestamp"
                type="text"
                placeholder="请输入时间戳（秒/毫秒）"
              />
              <div class="form-actions">
                <el-radio-group v-model="timeForm.unit" @change="handleTimestampToDateTime">
                  <el-radio-button label="s">秒</el-radio-button>
                  <el-radio-button label="ms">毫秒</el-radio-button>
                </el-radio-group>
                <el-button type="primary" @click="handleTimestampToDateTime">转换为日期时间</el-button>
              </div>
            </el-form-item>
            <el-form-item label="日期时间">
              <el-input
                v-model="timeForm.datetime"
                type="text"
                placeholder="YYYY-MM-DD HH:mm:ss"
              />
              <div class="form-actions">
                <el-button type="primary" @click="handleDateTimeToTimestamp">转换为时间戳</el-button>
                <el-button type="primary" @click="handleNowDateTime">当前时间</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- JSON格式化 -->
        <el-tab-pane label="JSON格式化" name="json">
          <el-form :model="jsonForm">
            <el-form-item >
              <div class="json-editor">
                <el-input
                  v-show="!jsonForm.isFormatted"
                  v-model="jsonForm.input"
                  type="textarea"
                  :rows="15"
                  placeholder="请输入JSON字符串"
                  :spellcheck="false"
                />
                <pre v-show="jsonForm.isFormatted" class="json-highlight" v-html="jsonForm.highlighted"></pre>
              </div>
              <div class="form-actions">
                <el-button type="primary" @click="handleFormatJSON">格式化</el-button>
                <el-button type="primary" @click="handleCompressJSON">压缩</el-button>
                <el-button @click="handleClearJSON">清空</el-button>
              </div>
            </el-form-item>
            
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  hexToText, textToHex, formatHex, hexToBase64, base64ToHex,
  calculateChecksum, calculateXOR, calculateCRC16Modbus,
  calculateCRC16CCITT, calculateCRC16XMODEM, calculateCRC32
} from '@/api'

const activeTab = ref('string')

// 字符串转换表单
const stringForm = reactive({
  mode: 'hex', // 'hex' | 'text'
  input: '',
  base64: ''
})

// 校验计算表单
const checkForm = reactive({
  hex: '',
  checksum: '',
  xor: '',
  crc16Modbus: '',
  crc16CCITT: '',
  crc16XMODEM: '',
  crc32: ''
})

// 时间转换表单
const timeForm = reactive({
  timestamp: '',
  datetime: '',
  unit: 's' // 's' | 'ms'
})

// JSON格式化表单
const jsonForm = reactive({
  input: '',
  isFormatted: false,
  highlighted: ''
})

// 处理模式切换
const handleModeChange = async (mode: 'hex' | 'text') => {
  if (!stringForm.input) return

  try {
    if (mode === 'text') {
      const res = await hexToText({ hex: stringForm.input })
      if (res.data.error) {
        ElMessage.error(res.data.error)
        // stringForm.mode = 'hex' // 转换失败时恢复模式
        return
      }
      stringForm.input = res.data.text
    } else {
      const res = await textToHex({ text: stringForm.input })
      if (res.data.error) {
        ElMessage.error(res.data.error)
        // stringForm.mode = 'text' // 转换失败时恢复模式
        return
      }
      stringForm.input = res.data.hex
    }
  } catch (error: any) {
    ElMessage.error(error.message || '转换失败')
    stringForm.mode = mode === 'text' ? 'hex' : 'text' // 转换失败时恢复模式
  }
}

const handleFormatHex = async () => {
  try {
    const res = await formatHex({ 
      hex: stringForm.input,
      bytesPerGroup: 1,
      uppercase: true
    })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    stringForm.input = res.data.formatted
  } catch (error: any) {
    ElMessage.error(error.message || '格式化失败')
  }
}

const handleHexToBase64 = async () => {
  if (stringForm.mode !== 'hex') {
    ElMessage.warning('请先将数据转换为十六进制格式')
    return
  }
  try {
    const res = await hexToBase64({ hex: stringForm.input })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    stringForm.base64 = res.data.base64
  } catch (error: any) {
    ElMessage.error(error.message || '转换失败')
  }
}

const handleBase64ToHex = async () => {
  try {
    const res = await base64ToHex({ base64: stringForm.base64 })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    stringForm.input = res.data.hex
    stringForm.mode = 'hex'
  } catch (error: any) {
    ElMessage.error(error.message || '转换失败')
  }
}

// 校验计算相关方法
const handleCalculateChecksum = async () => {
  try {
    const res = await calculateChecksum({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.checksum = res.data.checksum
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

const handleCalculateXOR = async () => {
  try {
    const res = await calculateXOR({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.xor = res.data.xor
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

const handleCalculateCRC16Modbus = async () => {
  try {
    const res = await calculateCRC16Modbus({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.crc16Modbus = res.data.crc
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

const handleCalculateCRC16CCITT = async () => {
  try {
    const res = await calculateCRC16CCITT({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.crc16CCITT = res.data.crc
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

const handleCalculateCRC16XMODEM = async () => {
  try {
    const res = await calculateCRC16XMODEM({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.crc16XMODEM = res.data.crc
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

const handleCalculateCRC32 = async () => {
  try {
    const res = await calculateCRC32({ hex: checkForm.hex })
    if (res.data.error) {
      ElMessage.error(res.data.error)
      return
    }
    checkForm.crc32 = res.data.crc
  } catch (error: any) {
    ElMessage.error(error.message || '计算失败')
  }
}

// 处理时间戳转日期时间
const handleTimestampToDateTime = () => {
  if (!timeForm.timestamp) {
    ElMessage.warning('请输入时间戳')
    return
  }

  try {
    let timestamp = Number(timeForm.timestamp)
    if (isNaN(timestamp)) {
      ElMessage.error('请输入有效的数字')
      return
    }

    // 如果是毫秒，转换为秒
    if (timeForm.unit === 'ms') {
      timestamp = Math.floor(timestamp / 1000)
    }

    const date = new Date(timestamp * 1000)
    if (date.toString() === 'Invalid Date') {
      ElMessage.error('无效的时间戳')
      return
    }

    timeForm.datetime = formatDateTime(date)
  } catch (error: any) {
    ElMessage.error(error.message || '转换失败')
  }
}

// 处理日期时间转时间戳
const handleDateTimeToTimestamp = () => {
  if (!timeForm.datetime) {
    ElMessage.warning('请输入日期时间')
    return
  }

  try {
    const date = new Date(timeForm.datetime)
    if (date.toString() === 'Invalid Date') {
      ElMessage.error('无效的日期时间格式')
      return
    }

    const timestamp = Math.floor(date.getTime() / 1000)
    timeForm.timestamp = timeForm.unit === 'ms' 
      ? String(timestamp * 1000)
      : String(timestamp)
  } catch (error: any) {
    ElMessage.error(error.message || '转换失败')
  }
}

// 获取当前时间
const handleNowDateTime = () => {
  const now = new Date()
  timeForm.datetime = formatDateTime(now)
  handleDateTimeToTimestamp()
}

// 格式化日期时间
const formatDateTime = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0')
  
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 处理JSON格式化
const handleFormatJSON = () => {
  if (!jsonForm.input) {
    ElMessage.warning('请输入JSON字符串')
    return
  }

  try {
    const obj = JSON.parse(jsonForm.input)
    jsonForm.input = JSON.stringify(obj, null, 2)
    jsonForm.isFormatted = true
    highlightJSON()
  } catch (error: any) {
    ElMessage.error('无效的JSON格式')
  }
}

// 处理JSON压缩
const handleCompressJSON = () => {
  if (!jsonForm.input) {
    ElMessage.warning('请输入JSON字符串')
    return
  }

  try {
    const obj = JSON.parse(jsonForm.input)
    jsonForm.input = JSON.stringify(obj)
    jsonForm.isFormatted = false
    jsonForm.highlighted = ''
  } catch (error: any) {
    ElMessage.error('无效的JSON格式')
  }
}

// 清空JSON输入
const handleClearJSON = () => {
  jsonForm.input = ''
  jsonForm.isFormatted = false
  jsonForm.highlighted = ''
}

// 高亮JSON
const highlightJSON = () => {
  const input = jsonForm.input
  if (!input) return

  try {
    // 格式化JSON
    const obj = JSON.parse(input)
    const formatted = JSON.stringify(obj, null, 2)

    // 转义HTML字符
    let highlighted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // 处理所有JSON元素的高亮
    highlighted = highlighted
      // 处理键名
      .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
      // 处理字符串值
      .replace(/:\s*"([^"]+)"/g, ': <span class="json-string">"$1"</span>')
      // 处理数字
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      // 处理布尔值和null
      .replace(/:\s*(true|false|null)\b/g, ': <span class="json-boolean">$1</span>')
      // 处理括号
      .replace(/([{}\[\]])/g, '<span class="json-bracket">$1</span>')
      // 处理逗号
      .replace(/,\n/g, '<span class="json-comma">,</span>\n')

    // 最后处理空格和换行
    highlighted = highlighted
      .replace(/\n/g, '<br>')
      .replace(/ {2}/g, '&nbsp;&nbsp;')

    jsonForm.highlighted = highlighted
    jsonForm.isFormatted = true
  } catch (error) {
    ElMessage.error('无效的JSON格式')
  }
}
</script>

<style>
/* 通用样式 */
.tools-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.check-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-tab-pane {
  padding-top: 10px;
}

.el-descriptions {
  margin-top: 10px;
}

.el-descriptions__cell {
  min-width: 150px;
}

/* JSON编辑器样式 */
.json-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f8f9fa;
  position: relative;
}

.json-editor textarea,
.json-editor pre {
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  padding: 16px;
  width: 100%;
  min-height: 300px;
  max-height: 600px;
  box-sizing: border-box;
  tab-size: 2;
  overflow: auto;
}

.json-highlight {
  background: #f8f9fa;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
  background-image: linear-gradient(to right, #e8e8e8 1px, transparent 1px);
  background-size: 24px 100%;
  background-position: 24px 0;
  overflow: auto;
}

/* JSON语法高亮颜色 */
.json-key {
  color: #881391;
  font-weight: bold;
}

.json-string {
  color: #22863a;
}

.json-number {
  color: #005cc5;
}

.json-boolean {
  color: #d73a49;
  font-weight: bold;
}

.json-bracket {
  color: #24292e;
  font-weight: bold;
}

.json-comma {
  color: #24292e;
}

/* 滚动条样式 */
.json-editor pre::-webkit-scrollbar,
.json-editor textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-editor pre::-webkit-scrollbar-track,
.json-editor textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.json-editor pre::-webkit-scrollbar-thumb,
.json-editor textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.json-editor pre::-webkit-scrollbar-thumb:hover,
.json-editor textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 