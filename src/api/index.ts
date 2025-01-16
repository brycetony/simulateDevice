import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { QueryParams, PageResult, ApiResponse } from '@/types/api'

const instance = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      console.log(error.response);
      switch (error.response.status) {
        case 400:
          ElMessage.error(error.response.data.message || '请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error(error.response.data.message || '拒绝访问')
          break
        case 404:
          ElMessage.error(error.response.data.message || '请求错误，未找到该资源')
          break
        case 500:
          ElMessage.error(error.response.data.message || '服务器端出错')
          break
        default:
          ElMessage.error(error.response.data.message.join(', ') || '未知错误')
      }
    } else {
      ElMessage.error('网络错误，请稍后重试')
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