<template>
  <div class="monitor-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="device-name">设备名称：{{ deviceInfo.deviceName }}</span>
          </div>
          <div class="header-right">
            <el-tag :type="isConnected ? 'success' : 'danger'" class="connection-status">
              {{ isConnected ? '已连接' : '未连接' }}
            </el-tag>
            <el-button type="primary" @click="clearLogs">清空日志</el-button>
            <el-button type="primary" @click="handleSendData">发送数据</el-button>
          </div>
        </div>
      </template>

      <div class="monitor-content" ref="monitorContentRef">
        <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
          <span class="time">{{ log.time }}</span>
          <span class="protocol">{{ log.data.protocol }}</span>
          <span class="address" :style="{ color: getColor(log.type) }" >{{ log.data.address }}</span>
          <span class="message" v-if="log.type === 'connect'">已连接</span>
          <span class="message" v-if="log.type === 'disconnect'">已断开</span>
          <template v-if="log.type === 'receive' || log.type === 'send'">
            <span class="direction" :style="{ color: log.type === 'receive' ? '#4ec9b0' : '#569cd6' }">{{ log.type === 'receive' ? '收到数据 « ' : '发送数据 » ' }}</span>
            <span class="size" :style="{ color: log.type === 'receive' ? '#4ec9b0' : '#569cd6' }">size: {{ log.data.stream ? log.data.stream?.length / 2 : 0 }}</span>
            <span class="stream" :style="{ color: log.type === 'receive' ? '#4ec9b0' : '#569cd6' }">data: {{ log.data.stream }}</span>
          </template>
        </div>
      </div>
    </el-card>

    <el-dialog
      title="发送数据"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        :model="deviceForm"
        :rules="rules"
        ref="deviceFormRef"
        label-width="100px"
      >
        <el-form-item label="类型" prop="type">
          <el-select v-model="deviceForm.type" placeholder="请选择类型">
            <el-option label="十六进制" value="HEX" />
            <el-option label="字符串" value="ASCII" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据" prop="data">
          <el-input v-model="deviceForm.payload" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendData">发送</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, onMounted, onUnmounted, nextTick } from 'vue'
import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'
import { useDateFormat } from '@vueuse/core'
import { useRouter, useRoute } from 'vue-router'
import { getDevice, deviceSendData } from '@/api'
import { FormInstance } from 'element-plus'

interface LogData {
  address: string
  stream?: string
  protocol: string
}

interface Log {
  type: 'connect' | 'disconnect' | 'receive' | 'send'
  time: string
  data: LogData
}

interface DeviceForm {
  type: string
  payload: string
}
const router = useRouter()
const logs = ref<Log[]>([])
const monitorContentRef = ref<HTMLElement>()
const isConnected = ref(false)
let socket: Socket | null = null
const route = useRoute()
const deviceId = route.params.id as string
const deviceInfo = ref({
  deviceName: '',
  protocol: ''
})
const dialogVisible = ref(false)
const deviceForm = ref<DeviceForm>({
  type: '',
  payload: ''
})
const deviceFormRef = ref<FormInstance>()

const rules = {
  type: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  payload: [
    { required: true, message: '请输入数据', trigger: 'blur' }
  ]
}

// 获取颜色
const getColor = (type: string) => {
  switch(type) {
    case 'receive':
      return '#4ec9b0'
    case 'send':
      return '#569cd6'
    case 'connect':
      return '#16b516'
    case 'disconnect':
      return '#f44336'
    default:
      return '#888'
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  return useDateFormat(date, 'YYYY-MM-DD HH:mm:ss.SSS').value
}

// 获取设备信息
const getDeviceInfo = async () => {
  const res = await getDevice(deviceId)
  console.log(res)
  deviceInfo.value = res.data
}


// 添加日志
const addLog = (log: Log) => {
  logs.value.push(log)
  // 保持最新的1000条记录
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000)
  }
  // 滚动到底部
  nextTick(() => {
    if (monitorContentRef.value) {
      monitorContentRef.value.scrollTop = monitorContentRef.value.scrollHeight
    }
  })
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}


const handleSendData = async () => {
  dialogVisible.value = true
}
// 发送数据
const sendData = async () => {
  if (!deviceFormRef.value) return
  await deviceFormRef.value.validate(async (valid) => {
    if (valid) {
      await deviceSendData(deviceId, deviceForm.value)
      ElMessage.success('发送成功')
    }
  })
}

// 重置表单
const resetForm = () => {
  deviceForm.value = {
    type: '',
    payload: ''
  }
  deviceFormRef.value?.resetFields()
}

// 连接Socket.IO
const connectSocketIO = () => {
  socket = io('http://localhost:3000', {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 3000,
    reconnectionAttempts: Infinity
  })

  // 连接成功
  socket.on('connect', () => {
    console.log('Socket.IO连接已建立')
    isConnected.value = true
    ElMessage.success('监控服务已连接')
    socket?.emit('subscribeDevice', deviceId)
  })

  // 连接断开
  socket.on('disconnect', () => {
    console.log('Socket.IO连接已断开')
    isConnected.value = false
    ElMessage.warning('监控服务已断开')
  })

  // 连接错误
  socket.on('connect_error', (error) => {
    console.error('Socket.IO连接错误:', error)
    isConnected.value = false
  })

  // 设备连接事件
  socket.on('device:connect', (data) => {
    console.log(data)
    addLog({
      type: 'connect',
      time: formatTime(data.timestamp),
      data: {
        ...data,
        protocol: deviceInfo.value.protocol
      }
    })
  })

  // 设备断开事件
  socket.on('device:disconnect', (data) => {
    addLog({
      type: 'disconnect',
      time: formatTime(data.timestamp),
      data: {
        ...data,
        protocol: deviceInfo.value.protocol
      }
    })
  })

  // 设备数据接收事件
  socket.on('device:receive', (data) => {
    addLog({
      type: 'receive',
      time: formatTime(data.timestamp),
      data: {
        ...data,
        protocol: deviceInfo.value.protocol
      }
    })
  })

  // 设备数据发送事件
  socket.on('device:send', (data) => {
    addLog({
      type: 'send',
      time: formatTime(data.timestamp),
      data: {
        ...data,
        protocol: deviceInfo.value.protocol
      }
    })
  })
}

onBeforeMount(() => {
  getDeviceInfo()
})

onMounted(() => {
  connectSocketIO()
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
})
</script>

<style scoped>
.monitor-container {
  height: calc(100vh - 140px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.device-name {
  font-size: 16px;
  color: #888;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-status {
  min-width: 60px;
  text-align: center;
}

.monitor-content {
  height: calc(100vh - 220px);
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  padding: 10px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
}

.log-item {
  padding: 4px 8px;
  border-radius: 2px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.log-item .time {
  color: #888;
  min-width: 120px;
}

.log-item .protocol {
  color: #cdccce;
  min-width: 60px;
}

.log-item .address {
  color: #569cd6;
  min-width: 120px;
}

.log-item .direction {
  color: #4ec9b0;
  min-width: 60px;
}

.log-item .stream {
  color: #ce9178;
  word-break: break-all;
}

.log-item.connect {
  border-left: 3px solid #16b516;
  color: #16b516;
}

.log-item.disconnect {
  border-left: 3px solid #f44336;
  color: #f44336;
}

.log-item.receive {
  border-left: 3px solid #4ec9b0;
}

.log-item.send {
  border-left: 3px solid #569cd6;
}

/* 滚动条样式 */
.monitor-content::-webkit-scrollbar {
  width: 8px;
}

.monitor-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.monitor-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.monitor-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style> 