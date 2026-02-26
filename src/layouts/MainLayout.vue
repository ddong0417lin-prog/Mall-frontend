<template>
  <div class="pc-shell">
    <header class="pc-header">
      <div class="container">
        <div class="bar">
          <div class="brand-orb" />
          <div class="brand" @click="$router.push('/')">
            <span class="brand-mark">M</span>
            <div class="brand-copy">
              <strong>Mall Atelier</strong>
              <span>Luxe Commerce Grid</span>
            </div>
          </div>
          <el-input
            v-model="keyword"
            class="search"
            placeholder="搜索商品、品牌、店铺"
            @keyup.enter="goSearch"
          >
            <template #append>
              <el-button @click="goSearch">检索</el-button>
            </template>
          </el-input>
          <div class="right-actions">
            <button
              v-for="nav in navItems"
              :key="nav.path"
              class="nav-chip"
              :class="{ active: isActive(nav.path) }"
              @click="go(nav.path)">
              {{ nav.label }}
            </button>
            <span class="status-pill">Online</span>
            <el-button v-if="!userStore.token" type="primary" round @click="$router.push('/login')">登录</el-button>
            <el-dropdown v-else>
              <span class="account-badge">{{ userStore.username || '已登录用户' }}</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </header>
    <main class="container main-body page-stage">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const keyword = ref(String(route.query.keyword || ''))
const navItems = [
  { label: '首页', path: '/' },
  { label: '商品', path: '/search' },
  { label: '购物车', path: '/cart' },
  { label: '订单', path: '/orders' },
  { label: '个人中心', path: '/user' }
]

watch(
  () => route.query.keyword,
  (val) => {
    keyword.value = String(val || '')
  }
)

const goSearch = () => {
  router.push({ path: '/search', query: { keyword: keyword.value || '' } })
}

const go = (path) => {
  router.push(path)
}

const isActive = (path) => (path === '/' ? route.path === '/' : route.path.startsWith(path))

const logout = () => {
  userStore.logout()
  router.push('/')
}
</script>
