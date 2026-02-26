<template>
  <section class="login-wrap page page-auth page-set-password">
    <div class="auth-shell single">
      <el-card class="login-card">
        <template #header>
          <strong>设置登录密码</strong>
        </template>
        <el-alert
          title="首次邮箱验证码登录后，请先设置账号密码，后续可直接使用邮箱+密码登录。"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 14px" />
        <el-form label-width="92px">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" disabled />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="form.confirmPassword" show-password placeholder="请再次输入密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submit">保存密码</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { emailSetPassword } from '@/api/member'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})
const submitting = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submit = async () => {
  if (!emailRegex.test(form.email.trim())) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  if (!form.password || !form.confirmPassword) {
    ElMessage.warning('请完整填写密码信息')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }
  submitting.value = true
  try {
    await emailSetPassword({
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword
    })
    ElMessage.success('密码设置成功')
    router.push('/')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  form.email = String(route.query.email || userStore.username || '').trim()
  if (!userStore.token) {
    router.push('/login')
  }
})
</script>

<style scoped>
.single {
  max-width: 560px;
}
</style>
