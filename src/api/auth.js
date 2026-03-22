import request from '../utils/request'

export function loginApi(data) {
  return request({
    url: '/system/auth/login',
    method: 'post',
    data
  })
}

export function getCurrentUserApi() {
  return request({
    url: '/system/auth/me',
    method: 'get'
  })
}