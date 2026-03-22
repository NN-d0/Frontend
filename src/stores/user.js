import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('radio_token') || '',
    userInfo: JSON.parse(localStorage.getItem('radio_user') || '{}')
  }),
  getters: {
    isLogin: (state) => !!state.token
  },
  actions: {
    setLogin(token, userInfo) {
      this.token = token
      this.userInfo = userInfo || {}
      localStorage.setItem('radio_token', token)
      localStorage.setItem('radio_user', JSON.stringify(userInfo || {}))
    },
    clearLogin() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('radio_token')
      localStorage.removeItem('radio_user')
    }
  }
})