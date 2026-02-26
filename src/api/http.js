import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})
let handlingUnauthorized = false

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('pc_token')
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 200) {
        handlingUnauthorized = false
        return body
      }
      if (body.code === 401) {
        localStorage.removeItem('pc_token')
        localStorage.removeItem('pc_username')
        if (!handlingUnauthorized) {
          handlingUnauthorized = true
          ElMessage.warning('登录已过期，请重新登录')
        }
        if (!location.hash.startsWith('#/login')) {
          location.hash = '#/login'
        } else {
          handlingUnauthorized = false
        }
        return Promise.reject(new Error(body.message || 'Unauthorized'))
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || 'Request failed'))
    }
    return body
  },
  (err) => {
    ElMessage.error(err.message || '网络异常')
    return Promise.reject(err)
  }
)

export default http
