import request from '../utils/request'


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


export function uploadCurrentUserAvatarApi(data) {
  return request({
    url: '/system/user/avatar/upload',
    method: 'post',
    data
  })
}