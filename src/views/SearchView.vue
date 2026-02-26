<template>
  <section class="panel page page-search">
    <div class="panel-head">
      <h2>商品检索</h2>
      <span class="muted">关键词：{{ keyword || '全部商品' }}</span>
    </div>

    <div class="filter-row space-between">
      <el-select v-model="sort" style="width: 220px" @change="loadList">
        <el-option label="默认排序" value="recommend" />
        <el-option label="新品优先" value="new" />
        <el-option label="销量优先" value="sale" />
        <el-option label="价格从低到高" value="price_asc" />
        <el-option label="价格从高到低" value="price_desc" />
      </el-select>
      <span class="muted small">共 {{ total }} 件商品</span>
    </div>

    <el-empty v-if="!list.length" description="暂无匹配商品" />
    <div v-else class="grid">
      <ProductCard v-for="item in list" :key="item.id" :item="item" />
    </div>

    <div class="pager" v-if="total > params.pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="params.pageSize"
        :total="total"
        :current-page="params.pageNum"
        @current-change="changePage"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { searchProductList } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const keyword = computed(() => String(route.query.keyword || ''))
const sort = ref('recommend')
const list = ref([])
const total = ref(0)
const params = reactive({ pageNum: 1, pageSize: 12 })

const loadList = async () => {
  const query = {
    keyword: keyword.value,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    sort: sort.value
  }
  const res = await searchProductList(query)
  const data = res.data || {}
  list.value = data.list || []
  total.value = Number(data.total || list.value.length)
}

const changePage = (page) => {
  params.pageNum = page
  loadList()
}

watch(keyword, () => {
  params.pageNum = 1
  loadList()
})

onMounted(loadList)
</script>
