<template>
  <div class="devices-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <div>
            <el-button type="primary" @click="fetchDevices"><el-icon><Refresh /></el-icon> 刷新</el-button>
            <el-button type="primary" @click="handleAdd">新增设备</el-button>
          </div>
        </div>
      </template>

      <el-table :data="deviceList" v-loading="loading" style="width: 100%">
        <el-table-column prop="_id" label="设备ID" width="220" />
        <el-table-column prop="deviceName" label="设备名称"/>
        <el-table-column prop="deviceType" label="设备类型" />
        <el-table-column prop="protocol" label="设备协议" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.protocol }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="devicePort" label="设备端口" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.deviceStatus" @change="handleStatusChange(row._id, $event)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleMonitor(row)">监控</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            <el-button type="primary" link @click="handleCopy(row)">复制</el-button>
            <el-button type="success" link @click="handleCommands(row)">命令管理</el-button>
          </template>
        </el-table-column>  
      </el-table>

      <Pagination
        v-model:page="currentPage"
        v-model:limit="pageSize"
        :total="total"
        @pagination="handlePagination"
      />
    </el-card>

    <!-- 设备表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <div class="dialog-content">
        <el-form
          :model="deviceForm"
          :rules="rules"
          ref="deviceFormRef"
          label-width="100px"
      >
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="deviceForm.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-input v-model="deviceForm.deviceType" placeholder="请输入设备类型" />
        </el-form-item>
        <el-form-item label="设备协议" prop="protocol">
          <el-select v-model="deviceForm.protocol" placeholder="请选择设备协议" style="width: 100%">
            <el-option label="TCPServer" value="TCPServer" />
            <el-option label="UDPServer" value="UDPServer" />
            <!-- <el-option label="TCPClient" value="TCPClient" />
            <el-option label="UDPClient" value="UDPClient" />
            <el-option label="Modbus" value="Modbus" />
            <el-option label="Telnet" value="Telnet" />
            <el-option label="HTTP" value="HTTP" /> -->
          </el-select>
        </el-form-item>
        <el-form-item label="设备端口" prop="devicePort">
          <el-input-number v-model="deviceForm.devicePort" placeholder="请输入设备端口" />
        </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { getDevices, addDevice, editDevice, deleteDevice, startDevice, stopDevice, copyDevice } from '@/api'
import Pagination from '@/components/Pagination.vue'

interface DeviceForm {
  _id?: string
  deviceName: string
  deviceType: string
  protocol: string
  devicePort: number
}

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const deviceFormRef = ref<FormInstance>()
const deviceList = ref<DeviceForm[]>([])

const deviceForm = reactive<DeviceForm>({
  deviceName: '',
  deviceType: '',
  protocol: '',
  devicePort: 0
})

const rules = {
  deviceName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  deviceType: [
    { required: true, message: '请输入设备类型', trigger: 'blur' }
  ],
  protocol: [
    { required: true, message: '请选择设备协议', trigger: 'change' }
  ],
  devicePort: [
    { required: true, message: '请输入设备端口', trigger: 'blur' }
  ]
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取设备列表
const fetchDevices = async () => {
  loading.value = true
  try {
    const res = await getDevices({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    deviceList.value = res.data.items.map((item: any) => ({
      ...item,
      deviceStatus: item.deviceStatus === '1' ? true : false
    }))
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePagination = ({ page, limit }: { page: number; limit: number }) => {
  currentPage.value = page
  pageSize.value = limit
  fetchDevices()
}

// 处理设备状态变化
const handleStatusChange = async (deviceId: string, status: boolean) => {
  if (status) {
    handleStart(deviceId)
  } else {
    handleStop(deviceId)
  }
  fetchDevices()
}

// 新增设备
const handleAdd = () => {
  dialogTitle.value = '新增设备'
  dialogVisible.value = true
}

// 编辑设备
const handleEdit = (row: DeviceForm) => {
  dialogTitle.value = '编辑设备'
  Object.assign(deviceForm, row)
  dialogVisible.value = true
}

// 启动设备
const handleStart = async (deviceId: string) => {
  await startDevice(deviceId)
  ElMessage.success('启动成功')
  fetchDevices()
}

// 停止设备
const handleStop = async (deviceId: string) => {
  await stopDevice(deviceId)
  ElMessage.success('停止成功')
  fetchDevices()
}

// 监控设备
const handleMonitor = (row: DeviceForm) => {
  window.open(`/monitor/${row._id}`, '_blank')
  // router.push(`/monitor/${row._id}`)
}

// 删除设备
const handleDelete = async (row: DeviceForm) => {
  try {
    await ElMessageBox.confirm('确认删除该设备吗？', '提示', {
      type: 'warning'
    })
    // TODO: 实现删除设备API调用
    await deleteDevice(row._id as string)
    ElMessage.success('删除成功')
    fetchDevices()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleCopy = async (row: DeviceForm) => {
  try {
    await ElMessageBox.confirm('确认复制该设备吗？', '提示', {
      type: 'warning'
    })
    // TODO: 实现删除设备API调用
    await copyDevice({ deviceId: row._id as string })
    ElMessage.success('复制成功')
    fetchDevices()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '复制失败')
    }
  }
}

// 进入命令管理
const handleCommands = (row: DeviceForm) => {
  router.push(`/devices/${row._id}/commands`)
}

// 提交表单
const handleSubmit = async () => {
  if (!deviceFormRef.value) return
  
  await deviceFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (deviceForm._id) {
          await editDevice(deviceForm)
          ElMessage.success('编辑成功')
        } else {
          await addDevice(deviceForm)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchDevices()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }

    }
  })
}

// 重置表单
const resetForm = () => {
  if (deviceFormRef.value) {
    deviceFormRef.value.resetFields()
  }
  Object.assign(deviceForm, {
    _id: undefined,
    deviceName: '',
    deviceType: '',
    protocol: '',
    devicePort: 0,
    deviceStatus: undefined
  })
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
@import '@/styles/base.css';
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 