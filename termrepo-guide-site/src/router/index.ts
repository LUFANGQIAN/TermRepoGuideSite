import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChangelogView from '../views/ChangelogView.vue'
import FaqView from '../views/FaqView.vue'
import FeaturesView from '../views/FeaturesView.vue'
import GuideView from '../views/GuideView.vue'
import SplatLabView from '../views/SplatLabView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '开发者术语指南站',
      },
    },
    {
      path: '/features',
      name: 'features',
      component: FeaturesView,
      meta: {
        title: '功能介绍',
      },
    },
    {
      path: '/guide',
      name: 'guide',
      component: GuideView,
      meta: {
        title: '使用指南',
      },
    },
    {
      path: '/faq',
      name: 'faq',
      component: FaqView,
      meta: {
        title: '常见问题',
      },
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: ChangelogView,
      meta: {
        title: '更新日志',
      },
    },
    {
      path: '/playground/splat',
      name: 'splat-lab',
      component: SplatLabView,
      meta: {
        title: '图片粒子化实验室',
      },
    },
  ],
})

router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : '指南站'
  document.title = `${pageTitle} | TermRepo`
})

export default router
