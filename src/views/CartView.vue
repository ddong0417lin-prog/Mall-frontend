<template>
  <section class="panel page page-cart">
    <div class="panel-head">
      <h2>购物车</h2>
      <div>
        <el-button link @click="loadData">刷新</el-button>
        <el-button type="danger" plain @click="clearAll">清空</el-button>
      </div>
    </div>

    <el-empty v-if="!cartList.length" description="购物车为空，去挑选心仪商品吧" />

    <el-table v-else :data="cartList" style="width:100%" class="glass-table">
      <el-table-column width="52">
        <template #default="scope">
          <el-checkbox v-model="scope.row.checked" />
        </template>
      </el-table-column>
      <el-table-column label="商品">
        <template #default="scope">
          <div class="cell-product" @click="goProduct(scope.row)">
            <img :src="scope.row.productPic" :alt="scope.row.productName" />
            <div>
              <div>{{ scope.row.productName }}</div>
              <div class="muted small">{{ formatAttr(scope.row.productAttr) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="单价" width="120" />
      <el-table-column label="数量" width="180">
        <template #default="scope">
          <el-input-number :model-value="scope.row.quantity" :min="1" :max="99" @change="(v)=>changeQty(scope.row,v)" />
        </template>
      </el-table-column>
      <el-table-column label="小计" width="120">
        <template #default="scope">￥{{ (Number(scope.row.price) * Number(scope.row.quantity)).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90">
        <template #default="scope">
          <el-button type="danger" link @click="remove(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="cart-footer" v-if="cartList.length">
      <div class="left">
        <el-checkbox v-model="allChecked" @change="toggleAll">全选</el-checkbox>
      </div>
      <div class="right">
        <span>合计：<b class="price">￥{{ totalAmount }}</b></span>
        <el-button type="primary" :disabled="!selectedIds.length" @click="checkout">去结算</el-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { clearCartList, deleteCartItem, fetchCartList, updateCartQuantity } from '@/api/cart'

const router = useRouter()
const cartList = ref([])
const allChecked = ref(true)

const selectedIds = computed(() => cartList.value.filter((x) => x.checked).map((x) => x.id))
const totalAmount = computed(() =>
  cartList.value
    .filter((x) => x.checked)
    .reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0)
    .toFixed(2)
)

const formatAttr = (text) => {
  try {
    const arr = JSON.parse(text || '[]')
    return arr.map((x) => `${x.key}:${x.value}`).join(' / ')
  } catch {
    return text || ''
  }
}

const resolveProductRoute = (row) => {
  if (row?.productId) return `/product/${row.productId}`
  if (row?.productDetailPath) {
    return String(row.productDetailPath).startsWith('/')
      ? row.productDetailPath
      : `/${row.productDetailPath}`
  }
  return null
}

const goProduct = (row) => {
  const path = resolveProductRoute(row)
  if (!path) {
    ElMessage.warning('商品信息异常，请刷新后重试')
    return
  }
  router.push(path)
}

const loadData = async () => {
  const res = await fetchCartList()
  cartList.value = (res.data || []).map((x) => ({ ...x, checked: true }))
  allChecked.value = cartList.value.length > 0
}

const toggleAll = (val) => {
  cartList.value.forEach((x) => {
    x.checked = val
  })
}

const changeQty = async (row, val) => {
  await updateCartQuantity(row.id, Number(val || 1))
  row.quantity = Number(val || 1)
}

const remove = async (row) => {
  await deleteCartItem(row.id)
  await loadData()
}

const clearAll = async () => {
  await ElMessageBox.confirm('确认清空购物车？', '提示', { type: 'warning' })
  await clearCartList()
  await loadData()
}

const checkout = () => {
  router.push({ path: '/checkout', query: { cartIds: selectedIds.value.join(',') } })
}

onMounted(loadData)
</script>
