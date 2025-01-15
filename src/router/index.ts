import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

interface BreadcrumbItem {
  path?: string
  title: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    breadcrumb?: BreadcrumbItem[]
    roles?: string[]
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/devices',
    children: [
      // {
      //   path: 'dashboard',
      //   name: 'Dashboard',
      //   component: () => import('../views/Dashboard.vue'),
      //   meta: {
      //     title: '仪表盘'
      //   }
      // },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: {
          title: '用户管理',
          roles: ['superadmin']
        }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue'),
        meta: {
          title: '设备列表'
        }
      },
      {
        path: 'devices/:id/commands',
        name: 'DeviceCommands',
        component: () => import('../views/DeviceCommands.vue'),
        meta: {
          title: '设备命令',
          breadcrumb: [
            { path: '/devices', title: '设备列表' },
            { title: '设备命令' }
          ]
        }
      },
      {
        path: 'monitor/:id',
        name: 'Monitor',
        component: () => import('../views/Monitor.vue'),
        meta: {
          title: '设备监控',
          breadcrumb: [
            { path: '/devices', title: '设备列表' },
            { title: '设备监控' }
          ]
        }
      },
      {
        path: 'tools',
        name: 'Tools',
        component: () => import('../views/Tools.vue'),
        meta: {
          title: '工具'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole') || ''

  if (to.path === '/login') {
    next()
  } else {
    if (!token) {
      next('/login')
    } else {
      // 检查路由是否需要权限
      if (to.meta.roles) {
        // 如果用户角色不在允许的角色列表中，跳转到首页
        if (!to.meta.roles.includes(userRole)) {
          next('/devices')
          return
        }
      }
      next()
    }
  }
})

export default router 