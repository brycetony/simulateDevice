<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside-container">
      <div class="logo-container">
        <span class="logo-text">SIMULATEDEVICE</span>
      </div>
      <el-menu
        router
        :default-active="route.path"
        class="el-menu-vertical"
        background-color="transparent"
        text-color="rgba(255,255,255,0.85)"
        active-text-color="#67e8f9"
      >
        <!-- <el-menu-item index="/dashboard" class="menu-item">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item> -->
        <el-menu-item v-if="userRole === 'superadmin'" index="/users" class="menu-item">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/devices" class="menu-item">
          <el-icon><Monitor /></el-icon>
          <span>设备列表</span>
        </el-menu-item>
        <el-menu-item index="/tools" class="menu-item">
          <el-icon><Tools /></el-icon>
          <span>工具</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container class="main-container">
      <el-header class="header-container">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <template v-if="route.meta.breadcrumb">
              <el-breadcrumb-item 
                v-for="(item, index) in route.meta.breadcrumb" 
                :key="index"
                :to="item.path ? { path: item.path } : ''"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </template>
            <el-breadcrumb-item v-else-if="route.meta.title">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar :size="32" class="user-avatar">
                {{ userInfo.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userInfo.username }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">
                  <el-icon><Key /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <el-dialog v-model="dialogVisible" title="修改密码" width="400px" class="password-dialog">
        <div class="dialog-content">
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="form.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="password">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password />
          </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitChangePassword">确定</el-button>
        </template>
      </el-dialog>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { changePassword } from '@/api'
import md5 from 'crypto-js/md5'

const route = useRoute()
const router = useRouter()
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userRole = ref(localStorage.getItem('userRole') || '')

const dialogVisible = ref(false)
const form = ref({
  oldPassword: '',
  password: '',
  confirmPassword: ''
})
const formRef = ref<FormInstance>()

const rules = ref({
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== form.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确认退出登录吗？', '提示', {
      type: 'warning'
    })
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    router.push('/login')
  } catch {
    // 用户取消退出
  }
}

const handleChangePassword = () => {
  dialogVisible.value = true
}

const submitChangePassword = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          userId: userInfo.id,
          oldPassword: md5(form.value.oldPassword).toString(),
          password: md5(form.value.password).toString()
        }
        await changePassword(data)
        ElMessage.success('修改密码成功')
        dialogVisible.value = false
        handleLogout()
      } catch (error: any) {
        ElMessage.error(error.message || '修改密码失败')
      }
    }
  })
}

onMounted(() => {
  // 在组件挂载时获取用户角色
  userRole.value = localStorage.getItem('userRole') || ''
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: #f0f2f5;
}

.aside-container {
  background: #1e1e1e;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252525;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  background: #ffffff;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(24, 144, 255, 0.3);
  position: relative;
  z-index: 1;
}

.main-container {
  position: relative;
  overflow: hidden;
}

.header-container {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 9;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.el-menu {
  border-right: none;
}

.el-menu-vertical {
  height: calc(100% - 62px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 侧边栏滚动条样式 */
.el-menu-vertical::-webkit-scrollbar {
  width: 6px;
}

.el-menu-vertical::-webkit-scrollbar-track {
  background: transparent;
}

.el-menu-vertical::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: all 0.3s;
}

.el-menu-vertical::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 只在hover时显示滚动条 */
.el-menu-vertical {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.el-menu-vertical::-webkit-scrollbar {
  display: none;
}

.el-menu-vertical:hover::-webkit-scrollbar {
  display: block;
}

.menu-item {
  margin: 4px 0;
  height: 50px !important;
  line-height: 50px !important;
  border-radius: 4px;
  margin: 4px 10px !important;
  padding: 0 15px !important;
}

.menu-item:hover {
  background: #252525 !important;
}

.menu-item.is-active {
  background: #252525 !important;
  border-right: 3px solid #1890ff !important;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 48px;
  transition: all 0.3s;
  border-radius: 4px;
}

.el-dropdown-link:hover {
  background: rgba(0, 0, 0, 0.025);
}

.user-avatar {
  background: #1e1e1e;
  color: #fff;
  font-weight: bold;
}

.username {
  margin: 0 8px;
  color: #606266;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 密码修改对话框 */
.password-dialog :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
}

.password-dialog :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409EFF;
}

.password-dialog :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF;
}

/* 修改菜单颜色 */
:deep(.el-menu) {
  --el-menu-bg-color: #1e1e1e !important;
  --el-menu-text-color: rgba(255, 255, 255, 0.75) !important;
  --el-menu-hover-text-color: #fff !important;
  --el-menu-active-color: #1890ff !important;
}
</style> 