const TOKEN_KEY = 'radio_token'
const USER_KEY = 'radio_user'
const VALIDATED_TOKEN_KEY = 'radio_validated_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function hasUsableToken() {
  const token = getToken()
  return !!token && token !== 'undefined' && token !== 'null' && token.trim() !== ''
}

export function getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

export function setAuthState(token, userInfo = {}) {
  localStorage.setItem(TOKEN_KEY, token || '')
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo || {}))
  resetValidatedToken()
}

export function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(VALIDATED_TOKEN_KEY)
}

export function getValidatedToken() {
  return sessionStorage.getItem(VALIDATED_TOKEN_KEY) || ''
}

export function markTokenValidated(token) {
  if (!token) return
  sessionStorage.setItem(VALIDATED_TOKEN_KEY, token)
}

export function isTokenValidated(token) {
  if (!token) return false
  return getValidatedToken() === token
}

export function resetValidatedToken() {
  sessionStorage.removeItem(VALIDATED_TOKEN_KEY)
}

export function goLogin() {
  if (window.location.hash !== '#/login') {
    window.location.hash = '#/login'
  }
}

export function goHome() {
  if (window.location.hash === '#/login') {
    window.location.hash = '#/overview'
  }
}

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.message ||
    '网络异常'
  )
}

export function isUnauthorizedError(error) {
  const httpStatus = Number(error?.response?.status)
  const bizCode = Number(error?.response?.data?.code)
  return httpStatus === 401 || bizCode === 401
}