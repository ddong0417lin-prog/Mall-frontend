<template>
  <section v-if="detail" class="page page-product-detail">
    <div class="panel product-hero-panel">
      <div class="detail-wrap">
        <img class="cover" :src="detail.product?.pic" :alt="detail.product?.name" />
        <div class="meta">
          <p class="kicker">精选商品</p>
          <h1>{{ detail.product?.name }}</h1>
          <p class="sub">{{ detail.product?.subTitle }}</p>
          <div class="price">￥{{ detail.product?.price }}</div>
          <p class="muted">品牌：{{ detail.brand?.name || detail.product?.brandName || '-' }}</p>
          <p class="muted" v-if="storeName">
            所属店铺：
            <el-link type="primary" @click="goStore">{{ storeName }}</el-link>
          </p>

          <div class="sku-row" v-if="skuList.length">
            <span class="muted">SKU：</span>
            <el-select v-model="selectedSkuId" style="width: 340px">
              <el-option v-for="sku in skuList" :key="sku.id" :label="formatSku(sku)" :value="sku.id" />
            </el-select>
            <el-input-number v-model="quantity" :min="1" :max="99" />
          </div>

          <div class="btn-row">
            <el-button type="primary" @click="addToCart">加入购物车</el-button>
            <el-button @click="buyNow">立即购买</el-button>
            <el-button @click="collect">收藏</el-button>
            <el-button @click="followBrand" v-if="detail.brand?.id">关注品牌</el-button>
          </div>
        </div>
      </div>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>图文详情</h2></div>
      <div class="detail-html" v-html="detail.product?.detailHtml || detail.product?.detailDesc || detail.product?.description || '暂无详情'" />
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchProductDetail } from '@/api/product'
import { addCartItem } from '@/api/cart'
import {
  createBrandAttention,
  createProductCollection,
  createReadHistory,
  fetchProductCollectionList
} from '@/api/member-extra'

const route = useRoute()
const router = useRouter()
const detail = ref(null)
const selectedSkuId = ref(null)
const quantity = ref(1)

const skuList = computed(() => detail.value?.skuStockList || [])
const selectedSku = computed(() => skuList.value.find((s) => s.id === selectedSkuId.value) || skuList.value[0] || null)
const storeName = computed(
  () => detail.value?.storeName || detail.value?.store?.storeName || detail.value?.store?.name || ''
)

const requireLogin = () => {
  if (!localStorage.getItem('pc_token')) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

const formatSku = (sku) => {
  let attrs = ''
  try {
    const arr = JSON.parse(sku.spData || '[]')
    attrs = arr.map((x) => `${x.key}:${x.value}`).join(' / ')
  } catch {
    attrs = sku.skuCode
  }
  return `${attrs} | 库存:${sku.stock}`
}

const addToCart = async (silent = false) => {
  if (!requireLogin() || !selectedSku.value) return
  const sku = selectedSku.value
  await addCartItem({
    productSkuId: sku.id,
    quantity: quantity.value
  })
  if (!silent) {
    ElMessage.success('已加入购物车')
  }
}

const buyNow = async () => {
  if (!requireLogin() || !selectedSku.value) return
  router.push({
    path: '/checkout',
    query: {
      buyNow: '1',
      productSkuId: String(selectedSku.value.id),
      quantity: String(Math.max(Number(quantity.value || 1), 1))
    }
  })
}

const collect = async () => {
  if (!requireLogin() || !detail.value?.product?.id) return
  const productId = detail.value.product.id
  const listRes = await fetchProductCollectionList({ pageNum: 1, pageSize: 200 })
  const list = listRes?.data?.list || listRes?.data || []
  if (Array.isArray(list) && list.some((item) => Number(item.productId) === Number(productId))) {
    ElMessage.info('该商品已在收藏列表中')
    return
  }
  try {
    await createProductCollection({ productId })
    ElMessage.success('已收藏')
  } catch {
    ElMessage.warning('收藏失败，可能已收藏该商品')
  }
}

const followBrand = async () => {
  if (!requireLogin() || !detail.value?.brand?.id) return
  await createBrandAttention({ brandId: detail.value.brand.id })
  ElMessage.success('已关注品牌')
}

const goStore = () => {
  const pathValue = detail.value?.storePath || detail.value?.store?.storePath
  if (pathValue) {
    const path = String(pathValue).startsWith('/') ? pathValue : `/${pathValue}`
    router.push(path)
    return
  }
  const id = detail.value?.storeId || detail.value?.store?.storeId || detail.value?.store?.brandId
  if (!id) {
    ElMessage.warning('店铺信息异常，请刷新后重试')
    return
  }
  router.push(`/store/${id}`)
}

onMounted(async () => {
  const id = route.params.id
  const res = await fetchProductDetail(id)
  detail.value = res.data
  if (res.data?.skuStockList?.length) {
    selectedSkuId.value = res.data.skuStockList[0].id
  }
  if (localStorage.getItem('pc_token')) {
    createReadHistory({
      productId: res.data?.product?.id,
      memberId: 0,
      memberNickname: localStorage.getItem('pc_username') || '用户',
      memberIcon: '',
      productName: res.data?.product?.name,
      productPic: res.data?.product?.pic,
      productSubTitle: res.data?.product?.subTitle,
      productPrice: res.data?.product?.price
    }).catch(() => {})
  }
})
</script>
