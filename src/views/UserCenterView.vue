<template>
  <section class="panel page page-user-center">
    <div class="panel-head"><h2>个人中心</h2></div>
    <el-tabs v-model="tab" type="border-card">
      <el-tab-pane label="资料设置" name="profile">
        <el-form :model="profileForm" label-width="90px" style="max-width:640px">
          <el-form-item label="邮箱">
            <el-input v-model="profileForm.email" disabled />
          </el-form-item>
          <el-form-item label="显示名">
            <el-input v-model="profileForm.username" placeholder="请输入显示名" />
          </el-form-item>
          <el-form-item label="头像">
            <div class="avatar-uploader">
              <img v-if="profileAvatarSrc" :src="profileAvatarSrc" alt="avatar" class="avatar-preview" />
              <div v-else class="avatar-empty">暂无头像</div>
              <div class="avatar-actions">
                <el-button type="primary" @click="goAvatarUpload">更换头像</el-button>
              </div>
              <div class="muted small">请前往独立头像上传页进行更换，后端会自动生成最新头像地址并刷新显示。</div>
            </div>
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="profileForm.gender">
              <el-radio :label="0">未知</el-radio>
              <el-radio :label="1">男</el-radio>
              <el-radio :label="2">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="profileSaving" @click="saveProfile">保存资料</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="密码修改" name="password">
        <el-form :model="pwdForm" label-width="110px" style="max-width:640px">
          <el-form-item label="旧密码">
            <el-input v-model="pwdForm.oldPassword" show-password placeholder="请输入旧密码" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="pwdForm.newPassword" show-password placeholder="至少6位" />
          </el-form-item>
          <el-form-item label="确认新密码">
            <el-input v-model="pwdForm.confirmPassword" show-password placeholder="请再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="pwdSaving" @click="changePassword">修改密码</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="收货地址" name="address">
        <div class="toolbar">
          <el-button type="primary" @click="openAddress()">新增地址</el-button>
        </div>
        <el-table :data="addresses" class="glass-table">
          <el-table-column label="姓名" prop="name" width="120" />
          <el-table-column label="电话" prop="phoneNumber" width="150" />
          <el-table-column label="地址">
            <template #default="scope">{{ scope.row.province }} {{ scope.row.city }} {{ scope.row.region }} {{ scope.row.detailAddress }}</template>
          </el-table-column>
          <el-table-column label="默认" width="80">
            <template #default="scope">{{ Number(scope.row.defaultStatus)===1 ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="scope">
              <el-button link @click="openAddress(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="removeAddress(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="优惠券" name="coupon">
        <el-radio-group v-model="couponStatus" @change="loadCoupons">
          <el-radio-button :label="0">未使用</el-radio-button>
          <el-radio-button :label="1">已使用</el-radio-button>
          <el-radio-button :label="2">已过期</el-radio-button>
        </el-radio-group>
        <el-table :data="coupons" style="margin-top:10px" class="glass-table">
          <el-table-column label="名称" prop="name" />
          <el-table-column label="金额" prop="amount" width="100" />
          <el-table-column label="门槛" prop="minPoint" width="120" />
          <el-table-column label="截止时间" prop="endTime" width="200" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="商品收藏" name="collection">
        <el-table :data="collections" class="glass-table">
          <el-table-column label="商品" prop="productName" />
          <el-table-column label="价格" prop="productPrice" width="120" />
          <el-table-column label="时间" prop="createTime" width="200" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button link type="primary" @click="goProduct(scope.row)">查看</el-button>
              <el-button link type="danger" @click="removeCollection(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="浏览足迹" name="history">
        <div class="toolbar">
          <el-button plain @click="clearHistory">清空</el-button>
        </div>
        <el-table :data="histories" class="glass-table">
          <el-table-column label="商品">
            <template #default="scope">
              <el-button link type="primary" @click="goProduct(scope.row)">{{ scope.row.productName }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="productPrice" width="120" />
          <el-table-column label="时间" prop="createTime" width="200" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button link type="primary" @click="goProduct(scope.row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="关注品牌" name="attention">
        <el-table :data="attentions" class="glass-table">
          <el-table-column label="品牌" prop="brandName" />
          <el-table-column label="商品数" prop="productCount" width="120" />
          <el-table-column label="关注时间" prop="createTime" width="200" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button link type="primary" @click="goStore(scope.row)">进店</el-button>
              <el-button link type="danger" @click="removeAttention(scope.row.id)">取消关注</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAddressDialog" :title="addressForm.id ? '编辑地址' : '新增地址'" width="680px">
      <el-form :model="addressForm" label-width="90px">
        <el-form-item label="姓名"><el-input v-model="addressForm.name" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="addressForm.phoneNumber" /></el-form-item>
        <el-form-item label="省份"><el-input v-model="addressForm.province" /></el-form-item>
        <el-form-item label="城市"><el-input v-model="addressForm.city" /></el-form-item>
        <el-form-item label="区域"><el-input v-model="addressForm.region" /></el-form-item>
        <el-form-item label="详细地址"><el-input v-model="addressForm.detailAddress" /></el-form-item>
        <el-form-item label="邮编"><el-input v-model="addressForm.postCode" /></el-form-item>
        <el-form-item label="默认地址"><el-switch v-model="addressForm.defaultStatus" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressDialog=false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { addAddress, deleteAddress, fetchAddressList, updateAddress } from '@/api/address'
import { fetchMemberCouponList } from '@/api/coupon'
import { changeProfilePassword, fetchProfile, updateProfile } from '@/api/member'
import {
  clearReadHistory,
  deleteBrandAttention,
  deleteProductCollection,
  fetchBrandAttentionList,
  fetchProductCollectionList,
  fetchReadHistoryList
} from '@/api/member-extra'

const router = useRouter()
const tab = ref('profile')
const addresses = ref([])
const coupons = ref([])
const couponStatus = ref(0)
const collections = ref([])
const histories = ref([])
const attentions = ref([])
const profileSaving = ref(false)
const pwdSaving = ref(false)
const profileForm = reactive({
  email: '',
  username: '',
  avatar: '',
  gender: 0
})
const avatarPreviewObjectUrl = ref('')
const profileAvatarSrc = computed(() => {
  if (avatarPreviewObjectUrl.value) return avatarPreviewObjectUrl.value
  const avatar = String(profileForm.avatar || '').trim()
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/')) return avatar
  if (avatar.startsWith('/api/')) return avatar
  if (avatar.startsWith('/')) return `/api${avatar}`
  return `/api/${avatar}`
})
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showAddressDialog = ref(false)
const addressForm = reactive({
  id: null,
  name: '',
  phoneNumber: '',
  province: '',
  city: '',
  region: '',
  detailAddress: '',
  postCode: '',
  defaultStatus: 0
})

const resetAddressForm = () => {
  Object.assign(addressForm, {
    id: null,
    name: '',
    phoneNumber: '',
    province: '',
    city: '',
    region: '',
    detailAddress: '',
    postCode: '',
    defaultStatus: 0
  })
}

const loadAddresses = async () => {
  const res = await fetchAddressList()
  addresses.value = res.data || []
}
const loadCoupons = async () => {
  const res = await fetchMemberCouponList(couponStatus.value)
  coupons.value = res.data || []
}
const loadCollections = async () => {
  const res = await fetchProductCollectionList({ pageNum: 1, pageSize: 50 })
  const data = res.data || {}
  collections.value = data.list || data || []
}
const loadHistory = async () => {
  const res = await fetchReadHistoryList({ pageNum: 1, pageSize: 50 })
  const data = res.data || {}
  histories.value = data.list || data || []
}
const loadAttentions = async () => {
  const res = await fetchBrandAttentionList({ pageNum: 1, pageSize: 50 })
  const data = res.data || {}
  attentions.value = data.list || data || []
}

const loadProfile = async () => {
  const res = await fetchProfile()
  const data = res.data || {}
  // fetchProfile() uses /sso/info on cloud; map fields defensively.
  profileForm.email = data.email || data.username || ''
  profileForm.username = data.nickname || data.username || data.email || ''
  profileForm.avatar = localStorage.getItem('pc_avatar') || data.avatar || ''
  profileForm.gender = Number(data.gender || 0)
  if (avatarPreviewObjectUrl.value) {
    URL.revokeObjectURL(avatarPreviewObjectUrl.value)
    avatarPreviewObjectUrl.value = ''
  }
}

const openAddress = (row = null) => {
  resetAddressForm()
  if (row) Object.assign(addressForm, row)
  showAddressDialog.value = true
}

const saveAddress = async () => {
  if (addressForm.id) {
    await updateAddress({ ...addressForm })
  } else {
    await addAddress({ ...addressForm })
  }
  showAddressDialog.value = false
  await loadAddresses()
}

const removeAddress = async (id) => {
  await ElMessageBox.confirm('确认删除该地址？', '提示', { type: 'warning' })
  await deleteAddress(id)
  await loadAddresses()
}

const saveProfile = async () => {
  profileSaving.value = true
  try {
    await updateProfile({
      username: profileForm.username,
      gender: Number(profileForm.gender || 0)
    })
    ElMessage.success('资料已更新')
    await loadProfile()
  } finally {
    profileSaving.value = false
  }
}

const goAvatarUpload = () => {
  router.push('/user/avatar')
}

const changePassword = async () => {
  if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    ElMessage.warning('请完整填写密码信息')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning('新密码与确认密码不一致')
    return
  }
  pwdSaving.value = true
  try {
    await changeProfilePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
      confirmPassword: pwdForm.confirmPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } finally {
    pwdSaving.value = false
  }
}

const normalizeProductPath = (rawPath) => {
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

const resolveProductRoute = (item) => {
  const detailPath = normalizeProductPath(item?.productDetailPath)
  if (detailPath) return detailPath
  if (item?.productId) return `/product/${item.productId}`
  const api = String(item?.productDetailApi || '').trim()
  const match = api.match(/\/product\/detail\/(\d+)/)
  if (match?.[1]) return `/product/${match[1]}`
  return null
}

const goProduct = (item) => {
  const path = resolveProductRoute(item)
  if (!path) {
    ElMessage.warning('商品信息异常，请刷新后重试')
    return
  }
  router.push(path)
}

const resolveStoreRoute = (item) => {
  if (item?.storePath) {
    return String(item.storePath).startsWith('/')
      ? item.storePath
      : `/${item.storePath}`
  }
  const id = item?.storeId || item?.brandId
  if (id) return `/store/${id}`
  return null
}

const goStore = (item) => {
  const path = resolveStoreRoute(item)
  if (!path) {
    ElMessage.warning('店铺信息异常，请刷新后重试')
    return
  }
  router.push(path)
}

const removeCollection = async (id) => {
  await deleteProductCollection(id)
  await loadCollections()
}
const clearHistory = async () => {
  await clearReadHistory()
  await loadHistory()
}
const removeAttention = async (id) => {
  await deleteBrandAttention(id)
  await loadAttentions()
}

watch(tab, async (val) => {
  if (val === 'profile') await loadProfile()
  if (val === 'password') return
  if (val === 'address') await loadAddresses()
  if (val === 'coupon') await loadCoupons()
  if (val === 'collection') await loadCollections()
  if (val === 'history') await loadHistory()
  if (val === 'attention') await loadAttentions()
})

onMounted(async () => {
  await Promise.all([loadProfile(), loadAddresses(), loadCoupons(), loadCollections(), loadHistory(), loadAttentions()])
})
</script>

<style scoped>
.avatar-uploader {
  display: grid;
  gap: 10px;
}

.avatar-preview,
.avatar-empty {
  width: 108px;
  height: 108px;
  border-radius: 14px;
  border: 1px solid rgba(150, 120, 88, 0.28);
  background: rgba(255, 255, 255, 0.72);
}

.avatar-preview {
  object-fit: cover;
}

.avatar-empty {
  display: grid;
  place-items: center;
  color: #7a6b5a;
}

.avatar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
