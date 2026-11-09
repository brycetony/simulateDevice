/**
 * 路由表（纯数据，无副作用——AUTH-14 受限路由声明义务的可静态检查载体）。
 *
 * 判据来源：docs/contracts/auth.md 条目 AUTH-06 / AUTH-14。
 * 守卫判定逻辑在 src/utils/auth.ts 的 resolveGuard；本文件只声明路由与角色要求。
 */
import type { RouteRecordRaw } from 'vue-router'

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

// AUTH-14：需要角色限制的路由必须在此显式声明 meta.roles；
// 未声明的路由视为「登录即可访问」（守卫不兜底检查——防回归靠本文件静态检查）。
export const routes: Array<RouteRecordRaw> = [
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
