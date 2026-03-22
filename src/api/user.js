import request from '../utils/request'

/**
 * 登录接口
 * 如果你后端实际不是 /system/auth/login
 * 只需要把这里的 url 改成你的真实登录地址
 */
export function loginApi(data) {
  return request({
    url: '/system/auth/login',
    method: 'post',
    data
  })
}

export function getCurrentUserProfileApi() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

export function updateCurrentUserProfileApi(data) {
  return request({
    url: '/system/user/profile/update',
    method: 'put',
    data
  })
}

export function updateCurrentUserPasswordApi(data) {
  return request({
    url: '/system/user/password/update',
    method: 'put',
    data
  })
}