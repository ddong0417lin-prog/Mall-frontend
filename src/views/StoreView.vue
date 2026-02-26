<template>
  <section class="panel page page-store">
    <div v-if="store" class="store-header">
      <img class="store-logo" :src="store.logo || store.storeLogo" :alt="store.name || store.storeName" />
      <div>
        <h2>{{ store.name || store.storeName || '店铺' }}</h2>
        <p class="muted">店铺ID：{{ store.id || store.storeId || route.params.id }}</p>
      </div>
    </div>

    <div class="panel-head">
      <h2>店铺商品</h2>
      <el-button link @click="loadData">刷新</el-button>
    </div>

    <el-empty v-if="!products.length" description="暂无商品" />
    <div v-else class="grid">
      <article class="product-card" v-for="item in products" :key="item.id" @click="goProduct(item)">
        <img :src="item.pic" :alt="item.name" />
        <h4>{{ item.name }}</h4>
        <p>{{ item.subTitle }}</p>
        <div class="bottom">
          <span class="price">￥{{ item.price }}</span>
          <span class="tag">store</span>
        </div>
      </article>
    </div>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        @current-change="changePage" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchStoreDetail, fetchStoreProductList } from '@/api/store'

const route = useRoute()
const router = useRouter()
const store = ref(null)
const products = ref([])
const pageNum = ref(1)
const pageSize = ref(12)
const total = ref(0)

const loadData = async () => {
  const storeId = route.params.id
  const [storeRes, listRes] = await Promise.all([
    fetchStoreDetail(storeId),
    fetchStoreProductList(storeId, { pageNum: pageNum.value, pageSize: pageSize.value })
  ])
  store.value = storeRes.data || null
  const data = listRes.data || {}
  products.value = data.list || []
  total.value = Number(data.total || products.value.length)
}

const changePage = async (p) => {
  pageNum.value = p
  await loadData()
}

const goProduct = (item) => {
  router.push(`/product/${item.id}`)
}

onMounted(loadData)
</script>

<style scoped>
.store-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.store-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border: 1px solid rgba(159, 124, 90, 0.24);
  border-radius: 50%;
  background: #fff;
}
</style>
