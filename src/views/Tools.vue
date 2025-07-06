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
                <el-button type="primary" @click="handleCopy">复制</el-button>
                <el-button @click="handleClearJSON">清空</el-button>
              </div>
            </el-form-item>
            
          </el-form>
        </el-tab-pane>

        <!-- 新增哈希生成器标签页 -->
        <el-tab-pane label="哈希生成器" name="hash">
          <el-form :model="hashForm" label-width="120px">
            <el-form-item label="输入文本">
              <el-input
                v-model="hashForm.input"
                type="textarea"
                :rows="5"
                placeholder="请输入要计算哈希的文本"
              />
            </el-form-item>
            <el-form-item label="哈希算法">
              <el-select v-model="hashForm.algorithm" style="width: 200px">
                <el-option label="MD5" value="md5" />
                <el-option label="SHA-1" value="sha1" />
                <el-option label="SHA-256" value="sha256" />
                <el-option label="SHA-512" value="sha512" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleGenerateHash">生成哈希</el-button>
              <el-button @click="handleCopyHash" v-if="hashForm.result">复制结果</el-button>
            </el-form-item>
            <el-form-item label="哈希结果" v-if="hashForm.result">
              <el-input v-model="hashForm.result" readonly />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 新增密码生成器标签页 -->
        <el-tab-pane label="密码生成器" name="password">
          <el-form :model="passwordForm" label-width="120px">
            <el-form-item label="密码长度">
              <el-input-number v-model="passwordForm.length" :min="6" :max="64" />
            </el-form-item>
            <el-form-item label="包含字符">
              <el-checkbox-group v-model="passwordForm.options">
                <el-checkbox label="uppercase">大写字母</el-checkbox>
                <el-checkbox label="lowercase">小写字母</el-checkbox>
                <el-checkbox label="numbers">数字</el-checkbox>
                <el-checkbox label="symbols">特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleGeneratePassword">生成密码</el-button>
              <el-button @click="handleCopyPassword" v-if="passwordForm.result">复制密码</el-button>
            </el-form-item>
            <el-form-item label="生成的密码" v-if="passwordForm.result">
              <el-input v-model="passwordForm.result" readonly />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 新增加密解密工具标签页 -->
        <el-tab-pane label="加密解密" name="crypto">
          <el-form :model="cryptoForm" label-width="120px">
            <el-form-item label="操作类型">
              <el-radio-group v-model="cryptoForm.mode">
                <el-radio label="encrypt">加密</el-radio>
                <el-radio label="decrypt">解密</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="加密算法">
              <el-select v-model="cryptoForm.algorithm" style="width: 200px">
                <el-option label="AES" value="aes" />
                <el-option label="DES" value="des" />
                <el-option label="3DES" value="tripledes" />
              </el-select>
            </el-form-item>
            <el-form-item label="密钥">
              <el-input v-model="cryptoForm.key" placeholder="请输入密钥" show-password />
            </el-form-item>
            <el-form-item :label="cryptoForm.mode === 'encrypt' ? '明文' : '密文'">
              <el-input
                v-model="cryptoForm.input"
                type="textarea"
                :rows="5"
                :placeholder="cryptoForm.mode === 'encrypt' ? '请输入要加密的文本' : '请输入要解密的文本'"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCrypto">
                {{ cryptoForm.mode === 'encrypt' ? '加密' : '解密' }}
              </el-button>
              <el-button @click="handleCopyCrypto" v-if="cryptoForm.result">复制结果</el-button>
            </el-form-item>
            <el-form-item :label="cryptoForm.mode === 'encrypt' ? '密文' : '明文'" v-if="cryptoForm.result">
              <el-input
                v-model="cryptoForm.result"
                type="textarea"
                :rows="5"
                readonly
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 正则表达式测试器 -->
        <el-tab-pane label="正则测试" name="regex">
          <el-form :model="regexForm" label-width="120px">
            <el-form-item label="测试文本">
              <el-input
                v-model="regexForm.input"
                type="textarea"
                :rows="5"
                placeholder="请输入要测试的文本"
              />
            </el-form-item>
            <el-form-item label="正则表达式">
              <el-input
                v-model="regexForm.pattern"
                placeholder="请输入正则表达式，例如：\w+"
              >
                <template #prepend>/</template>
                <template #append>/</template>
              </el-input>
            </el-form-item>
            <el-form-item label="选项">
              <el-checkbox-group v-model="regexForm.flags">
                <el-checkbox label="g">全局匹配</el-checkbox>
                <el-checkbox label="i">忽略大小写</el-checkbox>
                <el-checkbox label="m">多行匹配</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleTestRegex">测试匹配</el-button>
              <el-button @click="handleClearRegex">清空</el-button>
            </el-form-item>
            <el-form-item label="匹配结果" v-if="regexForm.matches.length > 0">
              <el-table :data="regexForm.matches" style="width: 100%">
                <el-table-column prop="index" label="序号" width="80" />
                <el-table-column prop="match" label="匹配内容" />
                <el-table-column prop="position" label="位置" width="120" />
              </el-table>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 编码解码工具 -->
        <el-tab-pane label="编码解码" name="encode">
          <el-form :model="encodeForm" label-width="120px">
            <el-form-item label="输入文本">
              <el-input
                v-model="encodeForm.input"
                type="textarea"
                :rows="5"
                placeholder="请输入要处理的文本"
              />
            </el-form-item>
            <el-form-item>
              <div class="form-actions">
                <el-button-group>
                  <el-button type="primary" @click="handleURLEncode">URL编码</el-button>
                  <el-button type="primary" @click="handleURLDecode">URL解码</el-button>
                </el-button-group>
                <el-button-group>
                  <el-button type="primary" @click="handleBase64Encode">Base64编码</el-button>
                  <el-button type="primary" @click="handleBase64Decode">Base64解码</el-button>
                </el-button-group>
                <el-button @click="handleCopyEncode" v-if="encodeForm.result">复制结果</el-button>
                <el-button @click="handleClearEncode">清空</el-button>
              </div>
            </el-form-item>
            <el-form-item label="处理结果" v-if="encodeForm.result">
              <el-input
                v-model="encodeForm.result"
                type="textarea"
                :rows="5"
                readonly
              />
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
} from '../api'
import CryptoJS from 'crypto-js'

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

// 哈希生成器表单
const hashForm = reactive({
  input: '',
  algorithm: 'md5',
  result: ''
})

// 密码生成器表单
const passwordForm = reactive({
  length: 16,
  options: ['uppercase', 'lowercase', 'numbers', 'symbols'],
  result: ''
})

// 加密解密表单
const cryptoForm = reactive({
  mode: 'encrypt',
  algorithm: 'aes',
  key: '',
  input: '',
  result: ''
})

// 正则表达式测试表单
const regexForm = reactive({
  input: '',
  pattern: '',
  flags: ['g'],
  matches: [] as { index: number; match: string; position: string }[]
})

// 编码解码表单
const encodeForm = reactive({
  input: '',
  result: ''
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

const handleCopy = () => {
  if (jsonForm.input) {
    navigator.clipboard.writeText(jsonForm.input)
    ElMessage.success('复制成功')
  }
}

// 生成哈希
const handleGenerateHash = () => {
  if (!hashForm.input) {
    ElMessage.warning('请输入要计算哈希的文本')
    return
  }

  try {
    switch (hashForm.algorithm) {
      case 'md5':
        hashForm.result = CryptoJS.MD5(hashForm.input).toString()
        break
      case 'sha1':
        hashForm.result = CryptoJS.SHA1(hashForm.input).toString()
        break
      case 'sha256':
        hashForm.result = CryptoJS.SHA256(hashForm.input).toString()
        break
      case 'sha512':
        hashForm.result = CryptoJS.SHA512(hashForm.input).toString()
        break
    }
    ElMessage.success('哈希生成成功')
  } catch (error) {
    ElMessage.error('哈希生成失败')
  }
}

// 生成密码
const handleGeneratePassword = () => {
  if (passwordForm.options.length === 0) {
    ElMessage.warning('请至少选择一种字符类型')
    return
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let chars = ''
  if (passwordForm.options.includes('uppercase')) chars += uppercase
  if (passwordForm.options.includes('lowercase')) chars += lowercase
  if (passwordForm.options.includes('numbers')) chars += numbers
  if (passwordForm.options.includes('symbols')) chars += symbols

  let password = ''
  for (let i = 0; i < passwordForm.length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  passwordForm.result = password
  ElMessage.success('密码生成成功')
}

// 加密解密
const handleCrypto = () => {
  if (!cryptoForm.input || !cryptoForm.key) {
    ElMessage.warning('请输入完整信息')
    return
  }

  try {
    const key = CryptoJS.enc.Utf8.parse(cryptoForm.key)
    
    if (cryptoForm.mode === 'encrypt') {
      switch (cryptoForm.algorithm) {
        case 'aes':
          cryptoForm.result = CryptoJS.AES.encrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString()
          break
        case 'des':
          cryptoForm.result = CryptoJS.DES.encrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString()
          break
        case 'tripledes':
          cryptoForm.result = CryptoJS.TripleDES.encrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString()
          break
      }
    } else {
      switch (cryptoForm.algorithm) {
        case 'aes':
          cryptoForm.result = CryptoJS.AES.decrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString(CryptoJS.enc.Utf8)
          break
        case 'des':
          cryptoForm.result = CryptoJS.DES.decrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString(CryptoJS.enc.Utf8)
          break
        case 'tripledes':
          cryptoForm.result = CryptoJS.TripleDES.decrypt(cryptoForm.input, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          }).toString(CryptoJS.enc.Utf8)
          break
      }
    }
    ElMessage.success(cryptoForm.mode === 'encrypt' ? '加密成功' : '解密成功')
  } catch (error) {
    ElMessage.error(cryptoForm.mode === 'encrypt' ? '加密失败' : '解密失败')
    cryptoForm.result = ''
  }
}

// 复制结果
const handleCopyHash = () => {
  navigator.clipboard.writeText(hashForm.result)
    .then(() => ElMessage.success('复制成功'))
    .catch(() => ElMessage.error('复制失败'))
}

const handleCopyPassword = () => {
  navigator.clipboard.writeText(passwordForm.result)
    .then(() => ElMessage.success('复制成功'))
    .catch(() => ElMessage.error('复制失败'))
}

const handleCopyCrypto = () => {
  navigator.clipboard.writeText(cryptoForm.result)
    .then(() => ElMessage.success('复制成功'))
    .catch(() => ElMessage.error('复制失败'))
}

// 处理正则表达式测试
const handleTestRegex = () => {
  if (!regexForm.input || !regexForm.pattern) {
    ElMessage.warning('请输入测试文本和正则表达式')
    return
  }

  try {
    const flags = regexForm.flags.join('')
    const regex = new RegExp(regexForm.pattern, flags)
    const matches: { index: number; match: string; position: string }[] = []
    let match

    if (flags.includes('g')) {
      let index = 1
      while ((match = regex.exec(regexForm.input)) !== null) {
        matches.push({
          index,
          match: match[0],
          position: `${match.index}-${match.index + match[0].length}`
        })
        index++
      }
    } else {
      match = regex.exec(regexForm.input)
      if (match) {
        matches.push({
          index: 1,
          match: match[0],
          position: `${match.index}-${match.index + match[0].length}`
        })
      }
    }

    regexForm.matches = matches
    if (matches.length === 0) {
      ElMessage.info('未找到匹配项')
    }
  } catch (error: any) {
    ElMessage.error('正则表达式语法错误：' + error.message)
  }
}

// 清空正则表达式测试
const handleClearRegex = () => {
  regexForm.input = ''
  regexForm.pattern = ''
  regexForm.flags = ['g']
  regexForm.matches = []
}

// URL编码
const handleURLEncode = () => {
  if (!encodeForm.input) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  try {
    encodeForm.result = encodeURIComponent(encodeForm.input)
    ElMessage.success('URL编码成功')
  } catch (error) {
    ElMessage.error('URL编码失败')
  }
}

// URL解码
const handleURLDecode = () => {
  if (!encodeForm.input) {
    ElMessage.warning('请输入要解码的文本')
    return
  }
  try {
    encodeForm.result = decodeURIComponent(encodeForm.input)
    ElMessage.success('URL解码成功')
  } catch (error) {
    ElMessage.error('URL解码失败')
  }
}

// Base64编码
const handleBase64Encode = () => {
  if (!encodeForm.input) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  try {
    encodeForm.result = btoa(encodeURIComponent(encodeForm.input))
    ElMessage.success('Base64编码成功')
  } catch (error) {
    ElMessage.error('Base64编码失败')
  }
}

// Base64解码
const handleBase64Decode = () => {
  if (!encodeForm.input) {
    ElMessage.warning('请输入要解码的文本')
    return
  }
  try {
    encodeForm.result = decodeURIComponent(atob(encodeForm.input))
    ElMessage.success('Base64解码成功')
  } catch (error) {
    ElMessage.error('Base64解码失败')
  }
}

// 复制编码结果
const handleCopyEncode = () => {
  navigator.clipboard.writeText(encodeForm.result)
    .then(() => ElMessage.success('复制成功'))
    .catch(() => ElMessage.error('复制失败'))
}

// 清空编码表单
const handleClearEncode = () => {
  encodeForm.input = ''
  encodeForm.result = ''
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

.el-form {
  max-width: 800px;
  margin: 0 auto;
}

.el-checkbox-group {
  display: flex;
  gap: 20px;
}
</style> 