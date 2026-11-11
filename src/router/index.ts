import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { resolveGuard } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫（AUTH-06）：判定逻辑在 utils/auth.ts resolveGuard，此处只做读键→判定→施加效果。
// 守卫是 UX 分流，非安全边界（docs/contracts/auth.md 顶部声明）。
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole') || ''

  const decision = resolveGuard(to.path, to.meta.roles, token, userRole)
  if ('redirect' in decision) {
    next(decision.redirect)
  } else {
    next()
  }
})

export default router
