<template>
  <section class="panel page page-checkout" v-if="state">
    <div class="panel-head">
      <h2>确认订单</h2>
      <el-button text @click="goBackToSource">{{ checkoutBackButtonText }}</el-button>
    </div>

    <el-card shadow="never" class="mb12 soft-card">
      <template #header>
        <div class="space-between">
          <strong>收货地址</strong>
          <div>
            <el-button link @click="openAddAddress">新增地址</el-button>
            <el-button link @click="loadAddresses">刷新</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!addresses.length" description="暂无收货地址，请先新增" />

      <el-radio-group v-else v-model="selectedAddressId" class="addr-radio-group">
        <div class="addr-grid">
          <div class="addr-item" v-for="addr in addresses" :key="addr.id">
            <el-radio :label="addr.id">
              {{ addr.name }} {{ addr.phoneNumber }} - {{ addr.province }} {{ addr.city }} {{ addr.region }} {{ addr.detailAddress }}
            </el-radio>
            <div class="addr-actions">
              <el-tag v-if="Number(addr.defaultStatus)===1" size="small" type="success">默认</el-tag>
              <el-button link size="small" @click="openEditAddress(addr)">编辑</el-button>
              <el-button
                link
                size="small"
                :disabled="Number(addr.defaultStatus)===1"
                @click="markDefault(addr.id)">
                设为默认
              </el-button>
              <el-button link size="small" type="danger" @click="removeAddress(addr.id)">删除</el-button>
            </div>
          </div>
        </div>
      </el-radio-group>
    </el-card>

    <el-card shadow="never" class="mb12 soft-card">
      <template #header><strong>商品信息</strong></template>
      <el-table :data="state.cartPromotionItemList || []" class="glass-table">
        <el-table-column label="商品">
          <template #default="scope">{{ scope.row.productName }}</template>
        </el-table-column>
        <el-table-column label="规格">
          <template #default="scope">{{ formatAttr(scope.row.productAttr) }}</template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="120" />
        <el-table-column prop="quantity" label="数量" width="100" />
      </el-table>
    </el-card>

    <el-card shadow="never" class="mb12 soft-card">
      <template #header><strong>优惠与备注</strong></template>
      <div class="form-row">
        <label>优惠券</label>
        <el-select v-model="couponId" clearable placeholder="不使用优惠券" style="width:420px">
          <el-option v-for="x in couponOptions" :key="x.id" :label="`${x.name} - ￥${x.amount}`" :value="x.id" />
        </el-select>
      </div>
      <div class="form-row">
        <label>使用积分</label>
        <el-input-number v-model="useIntegration" :min="0" :max="maxIntegration" />
      </div>
      <div class="form-row">
        <label>备注</label>
        <el-input v-model="note" type="textarea" :rows="2" style="width:520px" />
      </div>
    </el-card>

    <el-card shadow="never" class="soft-card">
      <div class="space-between"><span>商品总额</span><b>￥{{ amount.totalAmount || 0 }}</b></div>
      <div class="space-between"><span>活动优惠</span><b>-￥{{ amount.promotionAmount || 0 }}</b></div>
      <div class="space-between"><span>运费</span><b>￥{{ amount.freightAmount || 0 }}</b></div>
      <div class="space-between"><span>积分抵扣</span><b>-￥{{ integrationDeduct }}</b></div>
      <div class="space-between" v-if="selectedCoupon"><span>优惠券</span><b>-￥{{ selectedCoupon.amount }}</b></div>
      <el-divider />
      <div class="space-between">
        <strong>应付总额</strong>
        <strong class="price">￥{{ payAmount }}</strong>
      </div>
      <div style="text-align:right;margin-top:12px">
        <el-button type="primary" @click="submitOrder">提交订单</el-button>
      </div>
    </el-card>

    <el-dialog :title="addressForm.id ? '编辑收货地址' : '新增收货地址'" v-model="addressDialogVisible" width="620px">
      <el-form label-width="90px">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.name" placeholder="请输入收货人" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.phoneNumber" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="addressForm.province" placeholder="省份" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="addressForm.city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="addressForm.region" placeholder="区域" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detailAddress" placeholder="详细地址" />
        </el-form-item>
        <el-form-item label="邮编">
          <el-input v-model="addressForm.postCode" placeholder="邮编（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="addressSaving" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addAddress,
  deleteAddress,
  fetchAddressList,
  setDefaultAddress,
  updateAddress
} from '@/api/address'
import {
  generateConfirmOrder,
  generateDirectConfirmOrder,
  generateDirectOrder,
  generateOrder
} from '@/api/order'

const route = useRoute()
const router = useRouter()
const cartIds = ref([])
const selectedCartIdSet = ref(new Set())
const isBuyNowMode = ref(false)
const buyNowSkuId = ref(null)
const buyNowQuantity = ref(1)
const state = ref(null)
const addresses = ref([])
const selectedAddressId = ref(null)
const couponId = ref(null)
const useIntegration = ref(0)
const note = ref('')

const addressDialogVisible = ref(false)
const addressSaving = ref(false)
const addressForm = reactive({
  id: null,
  name: '',
  phoneNumber: '',
  province: '',
  city: '',
  region: '',
  detailAddress: '',
  postCode: ''
})

const amount = computed(() => state.value?.calcAmount || {})
const couponOptions = computed(() =>
  (state.value?.couponHistoryDetailList || []).map((x) => x.coupon).filter(Boolean)
)
const selectedCoupon = computed(() => couponOptions.value.find((x) => x.id === couponId.value))
const integrationSetting = computed(() => state.value?.integrationConsumeSetting || {})
const maxIntegration = computed(() => Number(state.value?.memberIntegration || 0))
const integrationDeduct = computed(() => {
  const unit = Number(integrationSetting.value.deductionPerAmount || 0)
  if (!unit || Number(integrationSetting.value.couponStatus) === 0) return 0
  return (Number(useIntegration.value || 0) / unit).toFixed(2)
})

const payAmount = computed(() => {
  const base = Number(amount.value.totalAmount || 0) - Number(amount.value.promotionAmount || 0) + Number(amount.value.freightAmount || 0)
  const coupon = Number(selectedCoupon.value?.amount || 0)
  const integration = Number(integrationDeduct.value || 0)
  return Math.max(base - coupon - integration, 0).toFixed(2)
})


const normalizeRoutePath = (rawPath) => {
  const path = String(rawPath || '').trim()
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      if (url.hash?.startsWith('#/')) return url.hash.slice(1)
      return url.pathname || null
    } catch {
      return null
    }
  }
  if (path.startsWith('/#/')) return path.slice(2)
  if (path.startsWith('#/')) return path.slice(1)
  return path.startsWith('/') ? path : `/${path}`
}

const fallbackBackPath = computed(() => {
  if (!isBuyNowMode.value) return '/cart'
  const productId = Number(route.query.productId || state.value?.cartPromotionItemList?.[0]?.productId || 0)
  if (productId > 0) return `/product/${productId}`
  return '/search'
})

const checkoutBackPath = computed(() => {
  const path = normalizeRoutePath(state.value?.backPath)
  if (path) return path
  return fallbackBackPath.value
})

const checkoutBackButtonText = computed(() => {
  const text = String(state.value?.backButtonText || '').trim()
  if (text) return text
  return isBuyNowMode.value ? '返回商品页' : '返回购物车'
})
const formatAttr = (text) => {
  try {
    const arr = JSON.parse(text || '[]')
    return arr.map((x) => `${x.key}:${x.value}`).join(' / ')
  } catch {
    return text || ''
  }
}

const pickSelectedAddress = (confirmData, addressList) => {
  if (confirmData?.selectedAddressId) return confirmData.selectedAddressId
  const def = (addressList || []).find((x) => Number(x.defaultStatus) === 1)
  return def?.id || addressList?.[0]?.id || null
}

const loadData = async () => {
  const res = isBuyNowMode.value
    ? await generateDirectConfirmOrder({
      productSkuId: buyNowSkuId.value,
      quantity: buyNowQuantity.value
    })
    : await generateConfirmOrder(cartIds.value)
  const data = res.data || {}
  const list = data.cartPromotionItemList || []
  if (!isBuyNowMode.value && selectedCartIdSet.value.size > 0) {
    data.cartPromotionItemList = list.filter((x) => selectedCartIdSet.value.has(Number(x.id)))
  }
  state.value = data
  const addrList = data.memberReceiveAddressList || []
  addresses.value = addrList
  selectedAddressId.value = pickSelectedAddress(data, addrList)
}

const loadAddresses = async () => {
  const res = await fetchAddressList()
  const list = res.data || []
  addresses.value = list
  if (!selectedAddressId.value) {
    selectedAddressId.value = pickSelectedAddress({ selectedAddressId: null }, list)
  }
}

const resetAddressForm = () => {
  Object.assign(addressForm, {
    id: null,
    name: '',
    phoneNumber: '',
    province: '',
    city: '',
    region: '',
    detailAddress: '',
    postCode: ''
  })
}

const openAddAddress = () => {
  resetAddressForm()
  addressDialogVisible.value = true
}

const openEditAddress = (addr) => {
  Object.assign(addressForm, {
    id: addr.id,
    name: addr.name || '',
    phoneNumber: addr.phoneNumber || '',
    province: addr.province || '',
    city: addr.city || '',
    region: addr.region || '',
    detailAddress: addr.detailAddress || '',
    postCode: addr.postCode || ''
  })
  addressDialogVisible.value = true
}

const saveAddress = async () => {
  if (!addressForm.name || !addressForm.phoneNumber || !addressForm.detailAddress) {
    ElMessage.warning('请填写收货人、手机号和详细地址')
    return
  }
  addressSaving.value = true
  try {
    if (addressForm.id) {
      await updateAddress({ ...addressForm })
      ElMessage.success('地址已更新')
    } else {
      await addAddress({ ...addressForm })
      ElMessage.success('地址已新增')
    }
    addressDialogVisible.value = false
    await Promise.all([loadData(), loadAddresses()])
  } finally {
    addressSaving.value = false
  }
}

const removeAddress = async (id) => {
  await ElMessageBox.confirm('确认删除该地址吗？', '提示', { type: 'warning' })
  await deleteAddress(id)
  ElMessage.success('地址已删除')
  await Promise.all([loadData(), loadAddresses()])
}

const markDefault = async (id) => {
  await setDefaultAddress(id)
  ElMessage.success('已设为默认地址')
  await Promise.all([loadData(), loadAddresses()])
}

const submitOrder = async () => {
  if (!(state.value?.cartPromotionItemList || []).length) {
    ElMessage.warning('当前无可下单商品，请返回商品页重新发起购买')
    return
  }
  if (!addresses.value.length) {
    await ElMessageBox.alert('请先新增收货地址')
    return
  }
  const payload = {
    payType: 0,
    couponId: couponId.value,
    useIntegration: Number(useIntegration.value || 0),
    note: note.value
  }
  if (!isBuyNowMode.value) {
    payload.cartIds = cartIds.value
  } else {
    payload.productSkuId = buyNowSkuId.value
    payload.quantity = buyNowQuantity.value
  }
  if (selectedAddressId.value) {
    payload.memberReceiveAddressId = selectedAddressId.value
  }
  const res = isBuyNowMode.value
    ? await generateDirectOrder(payload)
    : await generateOrder(payload)
  const data = res.data || {}
  const orderId = data?.order?.id || data?.id
  if (!orderId) {
    ElMessage.error('订单创建成功但未返回订单ID，请稍后在订单列表查看')
    router.push('/orders')
    return
  }
  const timeout = Number(data.payRemainingSeconds || data.payTimeoutSeconds || 0)
  await ElMessageBox.alert(
    timeout > 0
      ? `订单创建成功，请在 ${timeout} 秒内完成支付。`
      : '订单创建成功，进入支付页面。'
  )
  router.push(`/pay/${orderId}`)
}


const goBackToSource = () => {
  router.push(checkoutBackPath.value)
}
onMounted(async () => {
  isBuyNowMode.value = String(route.query.buyNow || '') === '1'
  if (isBuyNowMode.value) {
    buyNowSkuId.value = Number(route.query.productSkuId || 0) || null
    buyNowQuantity.value = Math.max(Number(route.query.quantity || 1) || 1, 1)
    if (!buyNowSkuId.value) {
      router.push('/search')
      return
    }
  } else {
    const raw = String(route.query.cartIds || '')
    cartIds.value = raw.split(',').map((x) => Number(x)).filter(Boolean)
    selectedCartIdSet.value = new Set(cartIds.value)
  }
  if (!isBuyNowMode.value && !cartIds.value.length) {
    router.push('/cart')
    return
  }
  await Promise.all([loadData(), loadAddresses()])
})
</script>

<style scoped>
.addr-radio-group {
  width: 100%;
}

.addr-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.addr-item {
  border: 1px solid rgba(156, 120, 86, 0.25);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.addr-actions {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.soft-card {
  border-radius: 14px;
  border: 1px solid rgba(157, 126, 93, 0.2);
  background: rgba(255, 255, 255, 0.62);
}
</style>





