<template>
  <section class="panel page page-orders">
    <div class="panel-head">
      <h2>我的订单</h2>
      <el-radio-group v-model="status" @change="loadData">
        <el-radio-button :label="-1">全部</el-radio-button>
        <el-radio-button :label="0">待付款</el-radio-button>
        <el-radio-button :label="2">待收货</el-radio-button>
        <el-radio-button :label="3">已完成</el-radio-button>
        <el-radio-button :label="4">已关闭</el-radio-button>
      </el-radio-group>
    </div>

    <el-empty v-if="!list.length" description="暂无订单记录" />

    <div class="order-list" v-for="order in list" :key="order.id">
      <div class="order-head">
        <span>订单号：{{ order.orderSn }}</span>
        <div class="order-meta">
          <span v-if="order.status===0 && remainingMap[order.id] !== undefined" class="timeout">
            剩余支付时间：{{ formatCountdown(remainingMap[order.id]) }}
          </span>
          <el-tag effect="plain">{{ formatStatus(order.status) }}</el-tag>
        </div>
      </div>
      <el-table :data="order.orderItemList || []" size="small" class="glass-table">
        <el-table-column label="商品" prop="productName" />
        <el-table-column label="数量" prop="productQuantity" width="90" />
        <el-table-column label="单价" prop="productPrice" width="120" />
      </el-table>
      <div class="order-foot">
        <span>实付：<b class="price">￥{{ order.payAmount }}</b></span>
        <div>
          <el-button size="small" @click="$router.push(`/order/${order.id}`)">详情</el-button>
          <el-button
            size="small"
            type="primary"
            v-if="order.status===0 && remainingMap[order.id] !== 0"
            @click="$router.push(`/pay/${order.id}`)">
            去支付
          </el-button>
          <el-button size="small" v-if="order.status===0 && remainingMap[order.id] !== 0" @click="cancel(order.id)">取消</el-button>
          <el-button size="small" type="primary" v-if="order.status===2" @click="confirm(order.id)">确认收货</el-button>
          <el-button size="small" type="danger" plain v-if="order.status===3||order.status===4" @click="remove(order.id)">删除</el-button>
        </div>
      </div>
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
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { deleteUserOrder, fetchOrderList, cancelUserOrder, confirmReceiveOrder } from '@/api/order'
import { computeRemainingSeconds, formatSecondsAsClock } from '@/utils/orderPayTime'

const status = ref(-1)
const params = reactive({ pageNum: 1, pageSize: 5 })
const list = ref([])
const total = ref(0)
const remainingMap = ref({})
let countdownTimer = null

const formatStatus = (s) => ({ 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已关闭' }[s] || '未知')
const formatCountdown = (seconds) => formatSecondsAsClock(seconds || 0)

const clearCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const startCountdown = () => {
  clearCountdownTimer()
  const hasPending = list.value.some((x) => Number(x.status) === 0)
  if (!hasPending) return
  countdownTimer = setInterval(async () => {
    const snapshot = { ...remainingMap.value }
    let hitZero = false
    Object.keys(snapshot).forEach((key) => {
      const val = Number(snapshot[key] || 0)
      if (val <= 0) return
      snapshot[key] = val - 1
      if (snapshot[key] === 0) hitZero = true
    })
    remainingMap.value = snapshot
    if (hitZero) await loadData()
  }, 1000)
}

const loadData = async () => {
  const res = await fetchOrderList({ status: status.value, pageNum: params.pageNum, pageSize: params.pageSize })
  const data = res.data || {}
  list.value = data.list || []
  total.value = Number(data.total || list.value.length)
  const next = {}
  list.value.forEach((order) => {
    if (Number(order.status) !== 0) return
    const secs = computeRemainingSeconds(order)
    if (secs !== null) next[order.id] = secs
  })
  remainingMap.value = next
  startCountdown()
}

const changePage = (p) => {
  params.pageNum = p
  loadData()
}

const cancel = async (id) => {
  await cancelUserOrder(id)
  await loadData()
}

const confirm = async (id) => {
  await confirmReceiveOrder(id)
  await loadData()
}

const remove = async (id) => {
  await deleteUserOrder(id)
  await loadData()
}

onMounted(loadData)
onBeforeUnmount(clearCountdownTimer)
</script>

<style scoped>
.order-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timeout {
  color: #d46b08;
  font-size: 12px;
}
</style>
