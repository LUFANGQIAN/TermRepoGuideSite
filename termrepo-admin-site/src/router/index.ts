import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'admin-dashboard' } },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { layout: 'auth', requiresGuest: true } },
  { path: '/dashboard', name: 'admin-dashboard', component: () => import('@/views/AdminDashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/ai-provider', name: 'admin-ai-provider', component: () => import('@/views/AdminAiProviderView.vue'), meta: { requiresAuth: true } },
  { path: '/quotas', name: 'admin-quotas', component: () => import('@/views/AdminQuotasView.vue'), meta: { requiresAuth: true } },
  { path: '/users', name: 'admin-users', component: () => import('@/views/AdminUsersView.vue'), meta: { requiresAuth: true } },
  { path: '/tickets', name: 'admin-tickets', component: () => import('@/views/AdminTicketsView.vue'), meta: { requiresAuth: true } },
  { path: '/tickets/:id', name: 'admin-ticket-detail', component: () => import('@/views/AdminTicketDetailView.vue'), meta: { requiresAuth: true }, props: true },
  { path: '/:pathMatch(.*)*', redirect: { name: 'admin-dashboard' } },
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    if (auth.accessToken) await auth.fetchMe()
    else auth.initialized = true
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresGuest && auth.isLoggedIn) return { name: 'admin-dashboard' }
})

export default router
