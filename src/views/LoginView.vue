<template>
  <section class="login-wrap page page-auth page-login">
    <div class="auth-shell">
      <aside class="auth-aside">
        <h1>Mall Atelier</h1>
        <p>为 PC 购物场景打造的精致体验。支持账号密码与邮箱验证码登录。</p>
        <ul>
          <li>统一品牌视觉与导航体验</li>
          <li>支持店铺、商品、订单全链路</li>
          <li>与后端接口持续联调同步</li>
        </ul>
      </aside>

      <el-card class="login-card">
        <template #header>
          <div class="space-between">
            <strong>欢迎登录</strong>
            <el-button link @click="$router.push('/register')">邮箱注册</el-button>
          </div>
        </template>

        <el-tabs v-model="activeTab" stretch>
          <el-tab-pane label="账号密码" name="account">
            <el-form @submit.prevent="onAccountSubmit" label-width="80px">
              <el-form-item label="邮箱">
                <el-input v-model="accountForm.username" placeholder="请输入注册邮箱" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="accountForm.password" show-password placeholder="请输入密码" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="onAccountSubmit" :loading="accountLoading">登录</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="邮箱验证码" name="email">
            <el-form @submit.prevent="onEmailSubmit" label-width="80px">
              <el-form-item label="邮箱">
                <el-input v-model="emailForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="图形码">
                <div class="code-row">
                  <el-input v-model="emailForm.captchaCode" placeholder="输入图形验证码" />
                  <div class="captcha-box" @click="refreshCaptcha">
                    <img v-if="captcha.imageData" :src="captcha.imageData" alt="captcha" />
                    <span v-else>加载中</span>
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="验证码">
                <div class="code-row">
                  <el-input v-model="emailForm.code" placeholder="请输入6位验证码" />
                  <el-button
                    class="send-btn"
                    @click="onSendCode"
                    :disabled="countdown > 0"
                    :loading="sendLoading"
                  >
                    {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="onEmailSubmit" :loading="emailLoading">验证码登录</el-button>
                <el-button plain @click="onDebugFetchCode" :loading="debugLoading">调试获取验证码</el-button>
              </el-form-item>
              <el-alert
                title="说明：首次邮箱验证码登录会自动注册，可能会要求先设置登录密码。"
                type="info"
                :closable="false"
                show-icon
              />
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  emailCodeLogin,
  fetchEmailCaptcha,
  fetchEmailDebugCode,
  memberInfo,
  memberLogin,
  sendEmailCode
} from '@/api/member'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('account')
const accountLoading = ref(false)
const emailLoading = ref(false)
const sendLoading = ref(false)
const debugLoading = ref(false)

const accountForm = reactive({
  username: '',
  password: '123456'
})

const emailForm = reactive({
  email: '',
  captchaCode: '',
  code: ''
})
const captcha = reactive({
  captchaId: '',
  imageData: ''
})

const countdown = ref(0)
let countdownTimer = null
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const buildToken = (data) => {
  const token = data?.token || ''
  const tokenHead = data?.tokenHead || ''
  if (!token) return ''
  if (!tokenHead) return token
  return `${tokenHead}${token}`
}

const finishLogin = async (token, fallbackName = '') => {
  userStore.setAuth(token, fallbackName)
  try {
    const info = await memberInfo()
    const name = info.data?.username || fallbackName || '用户'
    userStore.setAuth(token, name)
  } catch {
    userStore.setAuth(token, fallbackName || '用户')
  }
  ElMessage.success('登录成功')
  await router.push(String(route.query.redirect || '/'))
}

const startCountdown = (seconds = 60) => {
  countdown.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      countdown.value = 0
    }
  }, 1000)
}

const refreshCaptcha = async () => {
  const res = await fetchEmailCaptcha()
  captcha.captchaId = res.data?.captchaId || ''
  captcha.imageData = res.data?.imageData || ''
  emailForm.captchaCode = ''
}

const onAccountSubmit = async () => {
  const email = accountForm.username.trim().toLowerCase()
  if (!emailRegex.test(email)) {
    ElMessage.warning('请输入合法邮箱')
    return
  }
  if (!accountForm.password) {
    ElMessage.warning('请输入密码')
    return
  }
  accountLoading.value = true
  try {
    const res = await memberLogin({
      username: email,
      password: accountForm.password
    })
    const token = buildToken(res.data)
    if (!token) {
      ElMessage.error('登录返回缺少 token')
      return
    }
    await finishLogin(token, email)
  } finally {
    accountLoading.value = false
  }
}

const onSendCode = async () => {
  const email = emailForm.email.trim().toLowerCase()
  if (!emailRegex.test(email) || !emailForm.captchaCode.trim()) {
    ElMessage.warning('请填写邮箱和图形验证码')
    return
  }
  if (!captcha.captchaId) {
    ElMessage.warning('图形验证码未初始化，请刷新后重试')
    return
  }
  sendLoading.value = true
  try {
    await sendEmailCode({
      email,
      scene: 'login',
      captchaId: captcha.captchaId,
      captchaCode: emailForm.captchaCode.trim()
    })
    ElMessage.success('验证码已发送，请查收邮箱')
    startCountdown(60)
    await refreshCaptcha()
  } finally {
    sendLoading.value = false
  }
}

const onDebugFetchCode = async () => {
  const email = emailForm.email.trim().toLowerCase()
  if (!emailRegex.test(email)) {
    ElMessage.warning('请输入合法邮箱')
    return
  }
  debugLoading.value = true
  try {
    const res = await fetchEmailDebugCode(email)
    const code = res.data?.code || res.data
    if (code) {
      emailForm.code = String(code)
      ElMessage.success('已获取调试验证码并自动填充')
    } else {
      ElMessage.warning('当前环境未返回调试验证码')
    }
  } finally {
    debugLoading.value = false
  }
}

const onEmailSubmit = async () => {
  const email = emailForm.email.trim().toLowerCase()
  if (!emailRegex.test(email) || !emailForm.code) {
    ElMessage.warning('请填写邮箱和验证码')
    return
  }
  emailLoading.value = true
  try {
    const res = await emailCodeLogin({
      email,
      code: emailForm.code.trim()
    })
    const token = buildToken(res.data)
    if (!token) {
      ElMessage.error('登录返回缺少 token')
      return
    }
    userStore.setAuth(token, res.data?.username || email)
    if (res.data?.needSetPassword === true) {
      ElMessage.info('请先设置登录密码')
      await router.push({ path: '/set-password', query: { email: res.data?.username || email } })
      return
    }
    await finishLogin(token, res.data?.username || email)
  } finally {
    emailLoading.value = false
  }
}

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

onMounted(refreshCaptcha)
</script>

<style scoped>
.auth-shell {
  width: min(980px, 96vw);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  border: 1px solid rgba(155, 121, 88, 0.25);
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 20px 44px rgba(73, 49, 25, 0.14);
}

.auth-aside {
  padding: 36px;
  color: #f8ead8;
  background: linear-gradient(145deg, #2a1a10, #8f5628);
}

.auth-aside h1 {
  margin: 0 0 12px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 52px;
}

.auth-aside p {
  margin: 0;
  color: rgba(255, 237, 214, 0.9);
  line-height: 1.65;
}

.auth-aside ul {
  margin: 22px 0 0;
  padding-left: 18px;
  line-height: 1.9;
  color: rgba(255, 233, 205, 0.86);
}

.code-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 10px;
}

.send-btn {
  width: 130px;
}

.captcha-box {
  width: 130px;
  height: 40px;
  border: 1px solid rgba(130, 104, 72, 0.3);
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #fff;
  cursor: pointer;
}

.captcha-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-aside {
    padding: 24px;
  }

  .auth-aside h1 {
    font-size: 40px;
  }
}
</style>
