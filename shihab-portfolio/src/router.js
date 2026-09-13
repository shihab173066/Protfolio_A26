import { createRouter, createWebHashHistory } from 'vue-router'
import PortfolioView from './views/PortfolioView.vue'

// Hash history means GitHub Pages serves /admin without any server rewrite.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'portfolio', component: PortfolioView },
    { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

export default router
