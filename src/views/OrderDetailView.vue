<template>
  <section class="panel page page-order-detail" v-if="order">
    <div class="panel-head"><h2>订单详情</h2></div>
    <div class="detail-grid">
      <div><strong>订单号：</strong>{{ order.orderSn }}</div>
      <div><strong>状态：</strong>{{ formatStatus(order.status) }}</div>
      <div><strong>收货人：</strong>{{ order.receiverName }} {{ order.receiverPhone }}</div>
      <div><strong>地址：</strong>{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverRegion }} {{ order.receiverDetailAddress }}</div>
      <div><strong>创建时间：</strong>{{ order.createTime }}</div>
      <div><strong>支付时间：</strong>{{ order.paymentTime || '-' }}</div>
      <div v-if="order.status===0"><strong>支付倒计时：</strong><span class="timeout">{{ countdownText }}</span></div>
    </div>

    <el-divider />
    <el-table :data="order.orderItemList || []" class="glass-table">
      <el-table-column label="商品" prop="productName" />
      <el-table-column label="规格" prop="productAttr" />
      <el-table-column label="数量" prop="productQuantity" width="90" />
      <el-table-column label="价格" prop="productPrice" width="120" />
    </el-table>

    <div class="amount-box">
      <div>商品总额：￥{{ order.totalAmount }}</div>
      <div>运费：￥{{ order.freightAmount }}</div>
      <div>活动优惠：-￥{{ order.promotionAmount }}</div>
      <div>优惠券：-￥{{ order.couponAmount }}</div>
      <div>积分抵扣：-￥{{ order.integrationAmount }}</div>
      <div class="final">实付：￥{{ order.payAmount }}</div>
    </div>

    <div style="text-align:right">
      <el-button type="primary" v-if="order.status===0 && remainingSeconds !== 0" @click="$router.push(`/pay/${order.id}`)">去支付</el-button>
      <el-button v-if="order.status===0 && remainingSeconds !== 0" @click="cancel">取消订单</el-button>
      <el-button type="primary" v-if="order.status===2" @click="confirm">确认收货</el-button>
      <el-button type="danger" plain v-if="order.status===3||order.status===4" @click="remove">删除订单</el-button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cancelUserOrder, confirmReceiveOrder, deleteUserOrder, fetchOrderDetail } from '@/api/order'
import { computeRemainingSeconds, formatSecondsAsClock } from '@/utils/orderPayTime'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const remainingSeconds = ref(null)
let countdownTimer = null

const formatStatus = (s) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已关闭' }[s] || '未知')
const countdownText = computed(() => formatSecondsAsClock(remainingSeconds.value || 0))

const clearCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const startCountdown = () => {
  clearCountdownTimer()
  if (!order.value || order.value.status !== 0 || remainingSeconds.value === null) return
  countdownTimer = setInterval(async () => {
    if (remainingSeconds.value === null) return
    if (remainingSeconds.value <= 0) {
      remainingSeconds.value = 0
      clearCountdownTimer()
      await loadData()
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

const loadData = async () => {
  const res = await fetchOrderDetail(route.params.id)
  order.value = res.data
  if (order.value?.status === 0) {
    remainingSeconds.value = computeRemainingSeconds(order.value)
    startCountdown()
  } else {
    remainingSeconds.value = 0
    clearCountdownTimer()
  }
}

const cancel = async () => {
  await cancelUserOrder(order.value.id)
  await loadData()
}
const confirm = async () => {
  await confirmReceiveOrder(order.value.id)
  await loadData()
}
const remove = async () => {
  await deleteUserOrder(order.value.id)
  router.push('/orders')
}

onMounted(loadData)
onBeforeUnmount(clearCountdownTimer)
</script>

<style scoped>
.timeout {
  color: #d46b08;
}
</style>
