<template>
  <section class="panel page page-pay" v-if="order">
    <div class="panel-head">
      <h2>订单支付</h2>
      <el-tag :type="order.status === 0 ? 'warning' : 'success'">{{ formatStatus(order.status) }}</el-tag>
    </div>

    <div class="detail-grid">
      <div><strong>订单号：</strong>{{ order.orderSn }}</div>
      <div><strong>应付金额：</strong><span class="price">￥{{ order.payAmount }}</span></div>
      <div><strong>下单时间：</strong>{{ order.createTime }}</div>
      <div><strong>支付状态：</strong>{{ formatStatus(order.status) }}</div>
      <div v-if="order.status === 0"><strong>支付倒计时：</strong><span class="timeout">{{ countdownText }}</span></div>
    </div>

    <el-divider />

    <div v-if="canPay">
      <div class="form-row">
        <label>支付方式</label>
        <el-radio-group v-model="payType">
          <el-radio :label="1">支付宝</el-radio>
          <el-radio :label="2">微信支付</el-radio>
        </el-radio-group>
      </div>

      <div class="form-row">
        <label>支付链接</label>
        <el-link type="primary" @click="openUnsupportedPayWindow('支付宝支付')">
          点击打开支付页面
        </el-link>
      </div>

      <div class="form-row">
        <label>二维码链接</label>
        <el-link type="primary" @click="openUnsupportedPayWindow('微信/二维码支付')">
          打开二维码地址
        </el-link>
      </div>

      <div class="form-row">
        <el-button type="primary" :loading="creating" :disabled="remainingSeconds === 0" @click="createPayOrder">生成支付单</el-button>
        <el-button :loading="polling" @click="startPolling">查询支付结果</el-button>
        <el-button type="success" plain :disabled="remainingSeconds === 0" @click="markAsPaid">模拟支付成功(联调用)</el-button>
      </div>

      <el-alert
        title="说明：前端已预留微信/支付宝支付接口，对接后端支付网关后即可替换为真实下单与回调。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <div v-else-if="order.status === 4">
      <el-result icon="warning" title="订单已超时关闭" sub-title="支付时限已到，请重新下单">
        <template #extra>
          <el-button type="primary" @click="$router.push('/orders')">返回订单列表</el-button>
          <el-button @click="$router.push('/')">继续逛逛</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="order.status === 0 && remainingSeconds === 0">
      <el-result icon="warning" title="订单超时处理中" sub-title="正在同步订单关闭状态，请稍候" />
    </div>

    <div v-else>
      <el-result icon="success" title="订单已支付" sub-title="可前往订单详情查看发货状态">
        <template #extra>
          <el-button type="primary" @click="$router.push(`/order/${order.id}`)">查看订单</el-button>
          <el-button @click="$router.push('/orders')">返回订单列表</el-button>
        </template>
      </el-result>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { fetchOrderDetail } from '@/api/order'
import {
  createPayment,
  notifyOrderPaySuccess,
  queryAlipayStatus,
  queryWechatStatus
} from '@/api/payment'
import { computeRemainingSeconds, formatSecondsAsClock } from '@/utils/orderPayTime'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const payType = ref(1)
const payPayload = ref(null)
const creating = ref(false)
const polling = ref(false)
const remainingSeconds = ref(null)
let pollTimer = null
let countdownTimer = null

const formatStatus = (s) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已关闭' }[s] || '未知')
const countdownText = computed(() => formatSecondsAsClock(remainingSeconds.value || 0))
const canPay = computed(() => order.value?.status === 0 && remainingSeconds.value !== 0)
const openUnsupportedPayWindow = () => {
  ElMessage.warning('暂未支持此支付方式，待后续版本更新')
}

const clearCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const syncRemainingSeconds = (data) => {
  const val = computeRemainingSeconds(data)
  if (val !== null) remainingSeconds.value = val
}

const handleOrderExpired = async () => {
  if (!order.value || order.value.status !== 0) return
  await loadOrder({ skipExpiryCheck: true })
  if (order.value?.status === 4) {
    clearCountdownTimer()
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
      polling.value = false
    }
    ElMessage.warning('订单超时已取消')
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
      await handleOrderExpired()
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

const loadOrder = async (options = {}) => {
  const res = await fetchOrderDetail(route.params.id)
  order.value = res.data
  if (order.value?.status === 0) {
    syncRemainingSeconds(order.value)
    if (!options.skipExpiryCheck && remainingSeconds.value === 0) {
      await handleOrderExpired()
      return
    }
    startCountdown()
  } else {
    remainingSeconds.value = 0
    clearCountdownTimer()
  }
}

const parsePaid = (resp) => {
  const data = resp?.data ?? resp
  if (!data || typeof data !== 'object') return false
  const candidates = [
    data.success,
    data.paid,
    data.paySuccess,
    data.tradeStatus,
    data.status,
    data.orderStatus
  ]
  const raw = candidates.find((x) => x !== undefined && x !== null)
  if (raw === true) return true
  if (typeof raw === 'number') return raw === 1 || raw === 2 || raw === 3
  if (typeof raw === 'string') {
    const v = raw.toUpperCase()
    return ['SUCCESS', 'TRADE_SUCCESS', 'PAID', 'PAY_SUCCESS', 'COMPLETED'].includes(v)
  }
  return false
}

const createPayOrder = async () => {
  if (!order.value) return
  creating.value = true
  try {
    const payload = {
      orderId: order.value.id,
      orderSn: order.value.orderSn,
      payType: payType.value,
      amount: order.value.payAmount,
      subject: order.value.orderSn,
      body: `Mall Order ${order.value.orderSn}`
    }
    const res = await createPayment(payload)
    payPayload.value = res.data || null
    syncRemainingSeconds(payPayload.value)
    startCountdown()
    ElMessage.success('支付单已生成')
  } catch {
    payPayload.value = null
    ElMessage.warning('当前支付渠道未接入，暂未支持此支付方式，待后续版本更新')
  } finally {
    creating.value = false
  }
}

const queryPayResult = async () => {
  if (!order.value) return false
  if (remainingSeconds.value === 0) return false
  const params = {
    orderId: order.value.id,
    orderSn: order.value.orderSn,
    outTradeNo: order.value.orderSn,
    tradeNo: payPayload.value?.tradeNo || ''
  }
  const res = payType.value === 1 ? await queryAlipayStatus(params) : await queryWechatStatus(params)
  const ok = parsePaid(res)
  if (ok) {
    await notifyOrderPaySuccess({ orderId: order.value.id, payType: payType.value })
    await loadOrder()
    return true
  }
  return false
}

const startPolling = async () => {
  if (polling.value) return
  if (remainingSeconds.value === 0) {
    await handleOrderExpired()
    return
  }
  polling.value = true
  let times = 0
  const tick = async () => {
    times += 1
    const paid = await queryPayResult().catch(() => false)
    if (paid) {
      ElMessage.success('支付成功')
      polling.value = false
      clearInterval(pollTimer)
      pollTimer = null
      return
    }
    if (times >= 20) {
      ElMessage.warning('暂未查询到支付成功，请稍后重试')
      polling.value = false
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
  await tick()
  if (polling.value) {
    pollTimer = setInterval(tick, 3000)
  }
}

const markAsPaid = async () => {
  if (!order.value) return
  if (remainingSeconds.value === 0) {
    await handleOrderExpired()
    return
  }
  await notifyOrderPaySuccess({ orderId: order.value.id, payType: payType.value })
  await loadOrder()
  ElMessage.success('已更新为支付成功')
}

onMounted(loadOrder)
onBeforeUnmount(() => {
  clearCountdownTimer()
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>
