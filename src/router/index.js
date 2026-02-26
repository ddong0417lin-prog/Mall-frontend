import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeView from '@/views/HomeView.vue'
import SearchView from '@/views/SearchView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SetPasswordView from '@/views/SetPasswordView.vue'
import CartView from '@/views/CartView.vue'
import CheckoutView from '@/views/CheckoutView.vue'
import OrdersView from '@/views/OrdersView.vue'
import OrderDetailView from '@/views/OrderDetailView.vue'
import UserCenterView from '@/views/UserCenterView.vue'
import PayView from '@/views/PayView.vue'
import StoreView from '@/views/StoreView.vue'
import AvatarUploadView from '@/views/AvatarUploadView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'search', name: 'search', component: SearchView },
        { path: 'product/:id', name: 'product', component: ProductDetailView, props: true },
        { path: 'store/:id', name: 'store', component: StoreView, props: true },
        { path: 'cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
        { path: 'checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true } },
        { path: 'orders', name: 'orders', component: OrdersView, meta: { requiresAuth: true } },
        { path: 'order/:id', name: 'order-detail', component: OrderDetailView, meta: { requiresAuth: true } },
        { path: 'pay/:id', name: 'pay', component: PayView, meta: { requiresAuth: true } },
        { path: 'user', name: 'user', component: UserCenterView, meta: { requiresAuth: true } },
        { path: 'user/avatar', name: 'user-avatar', component: AvatarUploadView, meta: { requiresAuth: true } }
      ]
    },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/set-password', name: 'set-password', component: SetPasswordView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !localStorage.getItem('pc_token')) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
