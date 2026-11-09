<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>

      <el-table :data="userList" v-loading="loading" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickName" label="姓名" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag>{{ roles[row.role as (typeof USER_ROLES)[number]] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态" >
          <template #default="{ row }">
            <el-switch v-model="row.status" :disabled="!canToggleStatus(row.role)" active-value="1" inactive-value="0" @change="handleStatusChange(row, $event)"/>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link v-if="canDeleteUser(row.role)" @click="handleDelete(row)">删除</el-button>
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

    <!-- 用户表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <div class="dialog-content">
        <el-form
          :model="userForm"
          :rules="rules"
          ref="userFormRef"
          label-width="80px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username"  :disabled="!!userForm._id" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="姓名" prop="nickName">
            <el-input v-model="userForm.nickName" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="userForm.role" placeholder="请选择角色">
              <el-option v-for="role in assignableRoles()" :label="roles[role]" :value="role" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="userForm.status" placeholder="请选择状态">
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
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
import type { FormInstance } from 'element-plus'
import { getUserList, addUser, editUser, deleteUser } from '@/api'
import Pagination from '@/components/Pagination.vue'
import {
  ROLE_LABELS,
  USER_ROLES,
  canToggleStatus,
  canDeleteUser,
  assignableRoles,
  nextStatus,
} from '@/utils/users'

interface UserForm {
  _id?: string
  username: string
  // password: string
  nickName: string
  email: string
  role: string
  status: string
}

// AUTH-10：标签映射的唯一来源在 utils/users.ts（枚举与标签锁定）
const roles = ROLE_LABELS

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const userFormRef = ref<FormInstance>()
const userList = ref<UserForm[]>([])

const userForm = reactive<UserForm>({
  username: '',
  // password: '',
  nickName: '',
  email: '',
  role: '',
  status: '1'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  // password: [
  //   { required: true, message: '请输入密码', trigger: 'blur' }
  // ],
  nickName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    userList.value = res.data.items
    total.value = res.data.total
  } catch {
    // F-11：失败原因已由拦截器统一 toast，不再二次弹窗
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePagination = ({ page, limit }: { page: number; limit: number }) => {
  currentPage.value = page
  pageSize.value = limit
  fetchUsers()
}

// 修改用户状态（F-10：失败回滚开关状态——v-model 先翻转，失败时翻回并刷新）
const handleStatusChange = async (row: UserForm, status: string) => {
  try {
    await editUser({ ...row, status })
    fetchUsers()
  } catch {
    row.status = nextStatus(status)
    fetchUsers()
  }
}

// 新增用户
const handleAdd = () => {
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: UserForm) => {
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (row: UserForm) => {
  try {
    await ElMessageBox.confirm('确认删除该用户吗？', '提示', {
      type: 'warning'
    })
    await deleteUser(row._id as string)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    // F-11：真实失败已由拦截器 toast；cancel 是用户关闭确认框，静默
    if (error !== 'cancel') {
      // no-op
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (userForm._id) {
          await editUser(userForm)
          ElMessage.success('编辑成功')
        } else {
          await addUser(userForm)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch {
        // F-01/F-11：失败原因已由拦截器统一 toast，此处不再吞掉也不再重复弹窗
      } finally {
        submitting.value = false
      }

    }
  })
}

// 重置表单
const resetForm = () => {
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
  Object.assign(userForm, {
    _id: undefined,
    username: '',
    // password: '',
    nickName: '',
    email: ''
  })
}

onMounted(() => {
  fetchUsers()
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