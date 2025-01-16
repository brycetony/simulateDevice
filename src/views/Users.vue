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
            <el-tag>{{ roles[row.role as keyof Roles] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态" >
          <template #default="{ row }">
            <el-switch v-model="row.status" :disabled="row.role === 'superadmin'" active-value="1" inactive-value="0" @change="handleStatusChange(row, $event)"/>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link v-if="row.role !== 'superadmin'" @click="handleDelete(row)">删除</el-button>
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
              <el-option v-for="role in Object.keys(roles).filter(role => role !== 'superadmin')" :label="roles[role as keyof Roles]" :value="role" />
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

interface UserForm {
  _id?: string
  username: string
  // password: string
  nickName: string
  email: string
  role: string
  status: string
}

type Roles = {
  superadmin: string
  admin: string
  user: string
}

const roles: Roles = {
  superadmin: '超级管理员',
  admin: '管理员',
  user: '用户'
}

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
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
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

// 修改用户状态
const handleStatusChange = async (row: UserForm, status: string) => {
  console.log(row)
  await editUser({ ...row, status: status })
  fetchUsers()
}

// 新增用户
const handleAdd = () => {
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: UserForm) => {
  dialogTitle.value = '编辑用户'
  console.log(row)
 
  Object.assign(userForm, row)
  console.log(userForm)
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
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
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
          console.log(userForm)
          await editUser(userForm)
          ElMessage.success('编辑成功')
        } else {
          await addUser(userForm)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } catch (error: any) {
        console.log(error)
        // console.log(ElMessage.error)
        // ElMessage.error(error.message || '操作失败')
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