import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('radio_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')

      if (res.code === 401) {
        localStorage.removeItem('radio_token')
        localStorage.removeItem('radio_user')
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login'
        }
      }

      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res
  },
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      ElMessage.error('登录状态已失效，请重新登录')
      localStorage.removeItem('radio_token')
      localStorage.removeItem('radio_user')
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
    } else {
      ElMessage.error(error?.response?.data?.msg || error.message || '网络异常')
    }

    return Promise.reject(error)
  }
)

export default service