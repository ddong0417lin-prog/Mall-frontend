import http from './http'

export const memberLogin = (data) => {
  const payload = new URLSearchParams(data)
  return http.post('/sso/login', payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
  })
}

export const memberInfo = () => http.get('/sso/info')

export const fetchEmailCaptcha = () => http.get('/sso/email/captcha')
export const sendEmailCode = (data) => http.post('/sso/email/sendCode', data)

export const emailCodeLogin = (data) => http.post('/sso/email/login', data)
export const emailRegister = (data) => http.post('/sso/register', data)
export const emailSetPassword = (data) => http.post('/sso/email/setPassword', data)
// Cloud backend currently returns business-code 401 for GET /sso/profile.
// Use /sso/info to avoid false "logged out" redirects in UserCenter.
export const fetchProfile = () => http.get('/sso/info')
export const updateProfile = (data) => http.post('/sso/profile/update', data)
export const changeProfilePassword = (data) => http.post('/sso/profile/password/change', data)
export const fetchAvatarRules = () => http.get('/sso/profile/avatar/rules')
export const uploadProfileAvatar = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  // Do not set multipart Content-Type manually. The browser/axios will append boundary.
  return http.post('/sso/profile/avatar/upload', formData)
}

export const fetchEmailDebugCode = (email) =>
  http.get('/sso/email/debug/code', { params: { email } })
