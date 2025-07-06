<template>
  <div class="device-commands-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="title">设备命令管理</span>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索命令名称"
              class="search-input"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleAdd">新增命令</el-button>
          </div>
        </div>
      </template>

      <el-table :data="commandList" v-loading="loading" style="width: 100%">
        <el-table-column prop="commandName" label="命令名称" width="200"/>
        <el-table-column prop="commandType" label="命令类型" width="120">
          <template #default="{ row }">
            <el-tag type="success">{{ row.commandType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="streamType" label="码流类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.streamType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reqStream" label="请求码流" show-overflow-tooltip />
        <el-table-column prop="resStream" label="响应码流" show-overflow-tooltip />
        <el-table-column prop="storeKey" label="存储键" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <!-- 命令表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <div class="dialog-content">
        <el-form
          :model="commandForm"
          :rules="rules"
          ref="commandFormRef"
          label-width="100px"
      >
        <el-form-item label="命令名称" prop="commandName">
          <el-input v-model="commandForm.commandName" placeholder="请输入命令名称" />
        </el-form-item>
        <el-form-item label="命令类型" prop="commandType">
          <el-select v-model="commandForm.commandType" placeholder="请选择命令类型" style="width: 100%">
            <el-option label="GET" value="GET" />
            <el-option label="SET" value="SET" />
          </el-select>
        </el-form-item>
        <el-form-item label="码流类型" prop="streamType">
          <el-select v-model="commandForm.streamType" placeholder="请选择码流类型" style="width: 100%">
            <el-option label="ASCII" value="ASCII" />
            <el-option label="HEX" value="HEX" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求码流" prop="reqStream">
          <el-input class="monospace-input" v-model="commandForm.reqStream" placeholder="请输入请求码流" @input="handleReqStreamChange" />
        </el-form-item>
        <el-form-item label="响应码流" prop="resStream">
          <el-input class="monospace-input" v-model="commandForm.resStream" placeholder="请输入响应码流" />
        </el-form-item>
        <el-form-item label="存储键" prop="storeKey">
          <el-input v-model="commandForm.storeKey" placeholder="请输入存储键" />
        </el-form-item>

        <!-- 参数列表 -->
        <div class="params-section">
          <div class="params-header">
            <span>参数列表</span>
            <el-button type="primary" @click="addParam">添加参数</el-button>
          </div>
          
          <div v-for="(param, index) in commandForm.params" :key="index" class="param-item">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item
                  label="参数名称" label-width="80px"
                  :prop="'params.' + index + '.paramName'"
                  :rules="{ required: true, message: '请输入参数名称', trigger: 'blur' }"
                >
                  <el-input v-model="param.paramName" placeholder="参数名称" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  label="参数类型" label-width="80px"
                  :prop="'params.' + index + '.paramType'"
                  :rules="{ required: true, message: '请输入参数类型', trigger: 'blur' }"
                >
                  <el-select v-model="param.paramType" placeholder="请选择参数类型" style="width: 100%">
                    <el-option label="string" value="string" />
                    <el-option label="number" value="number" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  label="参数键名" label-width="80px"
                  :prop="'params.' + index + '.paramKey'"
                  :rules="{ required: true, message: '请输入参数键名', trigger: 'blur' }"
                >
                  <el-input v-model="param.paramKey" placeholder="参数键名" />
                </el-form-item>
              </el-col>
              </el-row>
              <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item
                  label="参数标签" label-width="80px"
                  :prop="'params.' + index + '.paramLabel'"
                  :rules="{ required: true, message: '请输入参数标签', trigger: 'blur' }"
                >
                  <el-input v-model="param.paramLabel" placeholder="参数标签" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  label="参数长度" label-width="80px"
                  :prop="'params.' + index + '.paramLength'"
                  :rules="{ required: true, message: '请输入参数长度', trigger: 'blur' }"
                >
                  <el-input-number v-model="param.paramLength" :min="1" placeholder="长度" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="参数值" label-width="80px" :prop="'params.' + index + '.paramValue'">
                  <el-input v-model="param.paramValue" placeholder="参数值" />
                </el-form-item>
              </el-col>
            </el-row>
              <el-row :gutter="20">
                <el-col :span="17"></el-col>
              <el-col :span="4">
                <el-checkbox v-model="param.isUnique" label="是否唯一键" />
              </el-col>
              <el-col :span="3">
                <el-button type="danger" @click="removeParam(index)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </el-col>
            </el-row>
          </div>
        </div>
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
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { getDeviceCommands, addCommand, editCommand, deleteCommand } from '@/api'
import type { QueryParams } from '@/types/api'
import Pagination from '@/components/Pagination.vue'

interface CommandParam {
  paramName: string
  paramType: string
  paramKey: string
  paramLabel: string
  paramLength: number
  paramValue: string
  isUnique: boolean
}

interface CommandForm {
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

const router = useRouter()
const route = useRoute()
const deviceId = route.params.id as string

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const commandFormRef = ref<FormInstance>()
const commandList = ref<CommandForm[]>([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')

const commandForm = reactive<CommandForm>({
  deviceId,
  commandName: '',
  commandType: '',
  streamType: '',
  reqStream: '',
  resStream: '',
  storeKey: '',
  params: []
})

const rules = {
  commandName: [
    { required: true, message: '请输入命令名称', trigger: 'blur' }
  ],
  commandType: [
    { required: true, message: '请选择命令类型', trigger: 'blur' }
  ],
  streamType: [
    { required: true, message: '请选择码流类型', trigger: 'change' }
  ],
  reqStream: [
    { required: true, message: '请输入请求码流', trigger: 'blur' }
  ],
  // resStream: [
  //   { required: true, message: '请输入响应码流', trigger: 'blur' }
  // ]
}

// 获取命令列表
const fetchCommandList = async () => {
  loading.value = true
  try {
    const params: QueryParams = {
      deviceId,
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value
    }
    const res = await getDeviceCommands(params)
    commandList.value = res.data.items;
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取命令列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePagination = ({ page, limit }: { page: number; limit: number }) => {
  currentPage.value = page
  pageSize.value = limit
  fetchCommandList()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 重置到第一页
  fetchCommandList()
}

// 新增命令
const handleAdd = () => {
  dialogTitle.value = '新增命令'
  dialogVisible.value = true
}

// 编辑命令
const handleEdit = (row: CommandForm) => {
  dialogTitle.value = '编辑命令' 
  const data = JSON.parse(JSON.stringify(row))
  Object.assign(commandForm, data)
  dialogVisible.value = true
}

// 删除命令
const handleDelete = async (row: CommandForm) => {
  try {
    await ElMessageBox.confirm('确认删除该命令吗？', '提示', {
      type: 'warning'
    })
    await deleteCommand(row._id as string)
    ElMessage.success('删除成功')
    fetchCommandList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 处理请求码流变化
const handleReqStreamChange = (value: string) => {
  const matches = value.match(/\[\$(.+)\|(.+)\]/g) 
  if (matches) {
    matches.forEach(match => {
      const paramLabel = match
      const paramIndex = commandForm.params.findIndex(param => param.paramLabel === paramLabel)
      if (paramIndex === -1) {
        commandForm.params.push({
          paramName: '',
          paramType: 'string',
          paramKey: '',
          paramLabel: paramLabel,
          paramLength: 1,
          paramValue: '',
          isUnique: false
        })
      }
    })
  }
}

// 添加参数
const addParam = () => {
  commandForm.params.push({
    paramName: '',
    paramType: '',
    paramKey: '',
    paramLabel: '',
    paramLength: 1,
    paramValue: '',
    isUnique: false
  })
}

// 删除参数
const removeParam = (index: number) => {
  commandForm.params.splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!commandFormRef.value) return
  
  await commandFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (commandForm._id) {
          await editCommand(commandForm)
          ElMessage.success('编辑成功')
        } else {
          await addCommand(commandForm) 
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchCommandList()
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
  if (commandFormRef.value) {
    commandFormRef.value.resetFields()
  }
  Object.assign(commandForm, {
    _id: undefined,
    deviceId,
    commandName: '',
    commandType: '',
    streamType: '',
    reqStream: '',
    resStream: '',
    storeKey: '',
    params: []
  })
}

onMounted(() => {
  fetchCommandList()
})
</script>

<style scoped>
@import '@/styles/base.css';
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 250px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.params-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.params-header span {
  font-weight: bold;
}

.param-item {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #dcdfe6;
}

.param-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.monospace-input :deep(.el-input__inner) {
  font-family: 'Courier New', Courier, monospace !important;
  letter-spacing: 0.1em;
  font-size: 14px !important;
  font-weight: bold !important;
}
</style> 