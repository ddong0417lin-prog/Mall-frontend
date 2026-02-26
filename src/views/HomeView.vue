<template>
  <section class="page page-home">
    <div class="hero">
      <div class="hero-copy">
        <h1>Refined Daily Commerce</h1>
        <p>甄选品质商品、稳定服务体验、统一设计语言。面向 PC 场景重构的现代电商前台。</p>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>热门推荐</h2>
        <el-button link @click="$router.push('/search')">进入商品广场</el-button>
      </div>
      <div class="grid">
        <ProductCard v-for="item in hotList" :key="item.id" :item="item" />
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>新品上架</h2>
      </div>
      <div class="grid">
        <ProductCard v-for="item in newList" :key="`new-${item.id}`" :item="item" />
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>猜你喜欢</h2>
      </div>
      <div class="grid">
        <ProductCard v-for="item in recommendList" :key="`r-${item.id}`" :item="item" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { fetchHomeContent, fetchRecommendProductList } from '@/api/home'
import ProductCard from '@/components/ProductCard.vue'

const hotList = ref([])
const newList = ref([])
const recommendList = ref([])

onMounted(async () => {
  const content = await fetchHomeContent()
  hotList.value = content.data?.hotProductList || []
  newList.value = content.data?.newProductList || []

  const rec = await fetchRecommendProductList({ pageNum: 1, pageSize: 12 })
  recommendList.value = rec.data || []
})
</script>
