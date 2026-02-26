<template>
  <section class="panel page page-avatar-upload">
    <div class="panel-head">
      <h2>更换头像</h2>
      <el-button text @click="router.push('/user')">返回个人中心</el-button>
    </div>

    <el-card class="avatar-card">
      <div class="avatar-grid">
        <div class="preview-wrap">
          <img v-if="avatarSrc" :src="avatarSrc" alt="avatar" class="avatar-preview" />
          <div v-else class="avatar-empty">暂无头像</div>
        </div>
        <div class="form-wrap">
          <div class="muted small">
            支持 {{ acceptText }}，建议尺寸不小于 {{ rules.minWidth }}x{{ rules.minHeight }}，
            最大 {{ formatMaxSize(rules.maxSizeBytes) }}，后端会按 {{ rules.aspectRatio }} 自动裁剪。
          </div>
          <div class="action-row">
            <input
              ref="avatarInputRef"
              type="file"
              :accept="rules.acceptTypes.join(',')"
              style="display:none"
              @change="onAvatarFileChange"
            />
            <el-button @click="avatarInputRef?.click()">选择头像</el-button>
            <el-button type="primary" :loading="avatarUploading" :disabled="!avatarFile" @click="uploadAvatar">
              上传头像
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchAvatarRules, uploadProfileAvatar } from '@/api/member'

const router = useRouter()
const avatarInputRef = ref(null)
const avatarUploading = ref(false)
const avatarFile = ref(null)
const avatarPreviewObjectUrl = ref('')
const profileAvatar = ref('')
const rules = reactive({
  aspectRatio: '4:3',
  minWidth: 132,
  minHeight: 99,
  maxWidth: 640,
  maxHeight: 480,
  maxSizeBytes: 2 * 1024 * 1024,
  acceptTypes: ['image/jpeg', 'image/png', 'image/webp']
})

const toApiUrl = (raw) => {
  const avatar = String(raw || '').trim()
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/')) return avatar
  if (avatar.startsWith('/api/')) return avatar
  if (avatar.startsWith('/')) return `/api${avatar}`
  return `/api/${avatar}`
}

const avatarSrc = computed(() => {
  if (avatarPreviewObjectUrl.value) return avatarPreviewObjectUrl.value
  return toApiUrl(profileAvatar.value)
})

const acceptText = computed(() => {
  const map = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP'
  }
  return (rules.acceptTypes || []).map((it) => map[it] || it).join('/')
})

const formatMaxSize = (bytes) => `${Math.max(1, Math.round(Number(bytes || 0) / 1024 / 1024))}MB`

const loadRules = async () => {
  const res = await fetchAvatarRules()
  const data = res.data || {}
  rules.aspectRatio = data.aspectRatio || rules.aspectRatio
  rules.minWidth = Number(data.minWidth || rules.minWidth)
  rules.minHeight = Number(data.minHeight || rules.minHeight)
  rules.maxWidth = Number(data.maxWidth || rules.maxWidth)
  rules.maxHeight = Number(data.maxHeight || rules.maxHeight)
  rules.maxSizeBytes = Number(data.maxSizeBytes || rules.maxSizeBytes)
  rules.acceptTypes = Array.isArray(data.acceptTypes) && data.acceptTypes.length ? data.acceptTypes : rules.acceptTypes
}

const loadProfileInfo = async () => {
  profileAvatar.value = localStorage.getItem('pc_avatar') || ''
}

const loadImageMeta = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, objectUrl })
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('image load failed'))
    }
    img.src = objectUrl
  })

const onAvatarFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!rules.acceptTypes.includes(file.type)) {
    ElMessage.warning(`头像格式仅支持 ${acceptText.value}`)
    return
  }
  if (file.size > rules.maxSizeBytes) {
    ElMessage.warning(`头像文件不能超过 ${formatMaxSize(rules.maxSizeBytes)}`)
    return
  }
  try {
    const meta = await loadImageMeta(file)
    if (meta.width < rules.minWidth || meta.height < rules.minHeight) {
      URL.revokeObjectURL(meta.objectUrl)
      ElMessage.warning(`头像尺寸过小，请上传至少 ${rules.minWidth}x${rules.minHeight} 像素的图片`)
      return
    }
    if (avatarPreviewObjectUrl.value) URL.revokeObjectURL(avatarPreviewObjectUrl.value)
    avatarPreviewObjectUrl.value = meta.objectUrl
    avatarFile.value = file
  } catch {
    ElMessage.warning('头像读取失败，请更换图片后重试')
  }
}

const uploadAvatar = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请先选择头像文件')
    return
  }
  avatarUploading.value = true
  try {
    const res = await uploadProfileAvatar(avatarFile.value)
    const url = res.data?.avatarUrlWithVersion || res.data?.avatarUrl || ''
    if (url) {
      profileAvatar.value = url
      localStorage.setItem('pc_avatar', url)
    }
    avatarFile.value = null
    if (avatarPreviewObjectUrl.value) {
      URL.revokeObjectURL(avatarPreviewObjectUrl.value)
      avatarPreviewObjectUrl.value = ''
    }
    ElMessage.success('头像上传成功')
    await router.push('/user')
  } catch (e) {
    const msg = String(e?.message || '')
    if (msg.includes('invalid multipart request')) {
      ElMessage.error('头像上传请求格式异常，请刷新页面后重试')
      return
    }
    if (msg.includes('401') || msg.includes('未登录') || msg.includes('token')) {
      ElMessage.warning('登录状态已失效，请重新登录后上传头像')
      return
    }
    ElMessage.error('头像上传失败，请稍后重试')
  } finally {
    avatarUploading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadRules(), loadProfileInfo()])
})
</script>

<style scoped>
.avatar-card {
  border-radius: 16px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 18px;
}

.avatar-preview,
.avatar-empty {
  width: 140px;
  height: 140px;
  border-radius: 16px;
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

.form-wrap {
  display: grid;
  gap: 16px;
  align-content: center;
}

.action-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media (max-width: 900px) {
  .avatar-grid {
    grid-template-columns: 1fr;
  }
}
</style>
