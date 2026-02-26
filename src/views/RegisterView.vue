<template>
  <section class="login-wrap page page-auth page-register">
    <div class="auth-shell single">
      <el-card class="login-card">
        <template #header>
          <div class="space-between">
            <strong>邮箱注册</strong>
            <el-button link @click="$router.push('/login')">返回登录</el-button>
          </div>
        </template>

        <el-form label-width="92px">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="图形码">
            <div class="code-row">
              <el-input v-model="form.captchaCode" placeholder="输入图形验证码" />
              <div class="captcha-box" @click="refreshCaptcha">
                <img v-if="captcha.imageData" :src="captcha.imageData" alt="captcha" />
                <span v-else>加载中</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="验证码">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入6位验证码" />
              <el-button class="send-btn" :disabled="countdown > 0" :loading="sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="form.confirmPassword" show-password placeholder="请再次输入密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submit">注册</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { emailRegister, fetchEmailCaptcha, fetchEmailDebugCode, sendEmailCode } from '@/api/member'

const router = useRouter()
const form = reactive({
  email: '',
  captchaCode: '',
  code: '',
  password: '',
  confirmPassword: ''
})
const captcha = reactive({
  captchaId: '',
  imageData: ''
})
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let timer = null

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const startCountdown = () => {
  countdown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
      countdown.value = 0
    }
  }, 1000)
}

const refreshCaptcha = async () => {
  const res = await fetchEmailCaptcha()
  captcha.captchaId = res.data?.captchaId || ''
  captcha.imageData = res.data?.imageData || ''
  form.captchaCode = ''
}

const sendCode = async () => {
  if (!emailRegex.test(form.email.trim()) || !form.captchaCode.trim()) {
    ElMessage.warning('请填写邮箱和图形验证码')
    return
  }
  if (!captcha.captchaId) {
    ElMessage.warning('图形验证码未初始化，请刷新后重试')
    return
  }
  sending.value = true
  try {
    await sendEmailCode({
      email: form.email.trim().toLowerCase(),
      scene: 'register',
      captchaId: captcha.captchaId,
      captchaCode: form.captchaCode.trim()
    })
    ElMessage.success('验证码已发送')
    try {
      const dbg = await fetchEmailDebugCode(form.email.trim())
      const code = dbg.data?.code || dbg.data
      if (code) form.code = String(code)
    } catch {}
    startCountdown()
    await refreshCaptcha()
  } finally {
    sending.value = false
  }
}

const submit = async () => {
  if (!emailRegex.test(form.email.trim())) {
    ElMessage.warning('请输入合法邮箱')
    return
  }
  if (!form.code || !form.password || !form.confirmPassword) {
    ElMessage.warning('请完整填写注册信息')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }
  submitting.value = true
  try {
    await emailRegister({
      email: form.email.trim(),
      code: form.code.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

onMounted(refreshCaptcha)
</script>

<style scoped>
.single {
  max-width: 560px;
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
</style>
