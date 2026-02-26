import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('pc_token') || '',
    username: localStorage.getItem('pc_username') || ''
  }),
  actions: {
    setAuth(token, username) {
      this.token = token || ''
      this.username = username || ''
      localStorage.setItem('pc_token', this.token)
      localStorage.setItem('pc_username', this.username)
    },
    logout() {
      this.token = ''
      this.username = ''
      localStorage.removeItem('pc_token')
      localStorage.removeItem('pc_username')
    }
  }
})
