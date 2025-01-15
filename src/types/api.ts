export interface QueryParams {
  deviceId?: string
  page?: number
  pageSize?: number
  search?: string
}

export interface PageResult<T> {
  items: T[]
  total: number
}

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
} 