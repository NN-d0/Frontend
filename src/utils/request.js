import axios from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'radio_token'
const USER_KEY = 'radio_user'

function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function goLogin() {
  if (window.location.hash !== '#/login') {
    window.location.hash = '#/login'
  }
}

const service = axios.create({
  baseURL: '/api',
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token && String(token).trim() && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const res = response.data

    // 标准返回：{ code, msg, data }
    if (typeof res?.code === 'number') {
      if (res.code === 200) {
        return res
      }

      if (res.code === 401) {
        clearAuthState()
        ElMessage.error(res.msg || '登录状态已失效，请重新登录')
        goLogin()
        return Promise.reject(new Error(res.msg || '未登录或登录已失效'))
      }

      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    // 非标准返回，直接放行
    return res
  },
  (error) => {
    const status = error?.response?.status
    const msg =
      error?.response?.data?.msg ||
      error?.response?.data?.message ||
      error?.message ||
      '网络异常'

    if (status === 401) {
      clearAuthState()
      ElMessage.error('登录状态已失效，请重新登录')
      goLogin()
    } else {
      ElMessage.error(msg)
    }

    return Promise.reject(error)
  }
)

export default service