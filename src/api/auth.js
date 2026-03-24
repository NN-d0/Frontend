import request from '../utils/request'

/**
 * PC 端登录
 */
export function loginApi(data) {
  return request({
    url: '/system/auth/login',
    method: 'post',
    data
  })
}

/**
 * 查询当前登录用户
 */
export function getCurrentUserApi() {
  return request({
    url: '/system/auth/me',
    method: 'get'
  })
}