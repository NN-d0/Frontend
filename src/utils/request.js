import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  clearAuthState,
  extractErrorMessage,
  getToken,
  goLogin,
  hasUsableToken,
  isUnauthorizedError,
  resetValidatedToken
} from './auth'

let authRedirecting = false

function handleUnauthorized(message = '登录状态已失效，请重新登录') {
  if (authRedirecting) {
    return Promise.reject(new Error(message))
  }

  authRedirecting = true
  clearAuthState()
  ElMessage.closeAll()
  ElMessage.error(message)
  goLogin()

  window.setTimeout(() => {
    authRedirecting = false
  }, 800)

  return Promise.reject(new Error(message))
}

const service = axios.create({
  baseURL: '/api',
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()

    if (hasUsableToken()) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (typeof res?.code === 'number') {
      if (res.code === 200) {
        return res
      }

      if (res.code === 401) {
        resetValidatedToken()

        if (response?.config?.__skipAuthRedirect) {
          return Promise.reject(Object.assign(new Error(res.msg || '未登录或登录已失效'), { response }))
        }

        return handleUnauthorized(res.msg || '登录状态已失效，请重新登录')
      }

      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res
  },
  (error) => {
    const message = extractErrorMessage(error)

    if (isUnauthorizedError(error)) {
      resetValidatedToken()

      if (error?.config?.__skipAuthRedirect) {
        return Promise.reject(error)
      }

      return handleUnauthorized('登录状态已失效，请重新登录')
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service