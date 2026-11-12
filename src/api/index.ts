import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { QueryParams, PageResult, ApiResponse } from '@/types/api'
import {
  SESSION_KEYS,
  UNAUTHORIZED_MESSAGE,
  attachAuthHeader,
  redirectTargetOn401,
  resolveApiErrorMessage,
  shouldNotifyUnauthorized,
} from '@/utils/auth'

export const instance = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器（AUTH-03）：决策在 utils/auth.ts，此处只读键→附加头。
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    // 类型注记：拦截器内 headers 已归一为 AxiosHeaders；attachAuthHeader 返回普通记录
    // （utils 边界禁止 import axios），axios 侧会再次归一，断言只对齐类型不改行为
    config.headers = attachAuthHeader({ ...config.headers }, token) as typeof config.headers
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 401 并发去重窗口（AUTH-13）：模块级时间戳，窗口期内只提示/跳转一次。
let lastUnauthorizedNotifiedAt = 0

// 响应拦截器（AUTH-04/05/13，F-01/02/03/06/08）：
// 文案决策在 utils/auth.ts resolveApiErrorMessage；此处只施加 toast/清键/跳转副作用。
instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const status: number = error.response.status
      if (status === 401) {
        // F-03：清三键（token/userInfo/userRole），不再只清 token
        for (const key of SESSION_KEYS) {
          localStorage.removeItem(key)
        }
        // AUTH-13：窗口期内仅首次提示 + 跳转
        const now = Date.now()
        if (shouldNotifyUnauthorized(now, lastUnauthorizedNotifiedAt)) {
          lastUnauthorizedNotifiedAt = now
          ElMessage.error(UNAUTHORIZED_MESSAGE)
          // F-08：已在 /login 页时不整页跳转（防 reload 抹掉错误提示与表单输入）
          const target = redirectTargetOn401(window.location.pathname)
          if (target) {
            window.location.href = target
          }
        }
      } else {
        // F-01：失败原因必须到达 UI；F-02：任何输入不抛 TypeError
        ElMessage.error(resolveApiErrorMessage(status, error.response.data))
      }
    } else {
      ElMessage.error(resolveApiErrorMessage(undefined, undefined))
    }
    return Promise.reject(error)
  }
)

// 用户相关接口
export const login = (data: { username: string; password: string }) => {
  return instance.post('/auth/login', data)
}

export const register = (data: any) => {
  return instance.post('/auth/register', data)
}

export const changePassword = (data: any) => {
  return instance.post('/auth/change-password', data)
}

export const addUser = (data: any) => {
  return instance.post('/users/add', data)
}

export const editUser = (data: any) => {
  return instance.put(`/users/edit`, data)
}

export const deleteUser = (id: string) => {
  return instance.delete(`/users/delete/${id}`)
}

export const getUserList = (params: QueryParams): Promise<ApiResponse<PageResult<any>>> => {
  return instance.get('/users/list', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search
    }
  })
}

// 设备相关接口
export const getDevice = (id: string) => {
  return instance.get(`/devices/${id}`)
}

export const getDevices = (params: QueryParams): Promise<ApiResponse<PageResult<any>>> => {
  return instance.get(`/devices`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search
    }
  })
}

export const addDevice = (data: any) => {
  return instance.post('/devices', data)
}

export const editDevice = (data: any) => {
  return instance.put(`/devices`, data)
}

export const deleteDevice = (id: string) => {
  return instance.delete(`/devices/${id}`)
}

export const startDevice = (id: string) => {
  return instance.post(`/devices/${id}/start`)
}

export const stopDevice = (id: string) => {
  return instance.post(`/devices/${id}/stop`)
}

export const deviceSendData = (deviceId: string, data: any) => {
  return instance.post(`/devices/${deviceId}/send`, data)
}

// 设备命令相关接口
export const getDeviceCommands = (params: QueryParams): Promise<ApiResponse<PageResult<any>>> => {
  return instance.get(`/devices/${params.deviceId}/commands`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search
    }
  })
}

export const addCommand = (data: any) => {
  return instance.post('/devices/command', data)
}

export const editCommand = (data: any) => {
  return instance.put(`/devices/command`, data)
}

export const deleteCommand = (id: string) => {
  return instance.delete(`/devices/command/${id}`)
}

// 统计相关接口
export const getStatistics = () => {
  return instance.get('/statistics')
}

export const getRecentDevices = () => {
  return instance.get('/devices/recent')
}

// 工具相关接口
export const hexToText = (data: { hex: string }) => {
  return instance.post('/tools/hex2text', data)
}

export const textToHex = (data: { text: string }) => {
  return instance.post('/tools/text2hex', data)
}

export const formatHex = (data: { hex: string; bytesPerGroup?: number; uppercase?: boolean }) => {
  return instance.post('/tools/format-hex', data)
}

export const hexToBase64 = (data: { hex: string }) => {
  return instance.post('/tools/hex2base64', data)
}

export const base64ToHex = (data: { base64: string }) => {
  return instance.post('/tools/base642hex', data)
}

export const copyDevice = (data: { deviceId: string }) => {
  return instance.post('/devices/copy', data)
}

export const calculateChecksum = (data: { hex: string }) => {
  return instance.post('/tools/checksum', data)
}

export const calculateXOR = (data: { hex: string }) => {
  return instance.post('/tools/xor', data)
}

export const calculateCRC16Modbus = (data: { hex: string }) => {
  return instance.post('/tools/crc16-modbus', data)
}

export const calculateCRC16CCITT = (data: { hex: string }) => {
  return instance.post('/tools/crc16-ccitt', data)
}

export const calculateCRC16XMODEM = (data: { hex: string }) => {
  return instance.post('/tools/crc16-xmodem', data)
}

export const calculateCRC32 = (data: { hex: string }) => {
  return instance.post('/tools/crc32', data)
} 