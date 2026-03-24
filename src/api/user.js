import request from '../utils/request'

/**
 * 查询当前登录用户资料
 */
export function getCurrentUserProfileApi() {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

/**
 * 更新当前登录用户资料
 * 当前仅允许修改：nickName、avatarUrl
 */
export function updateCurrentUserProfileApi(data) {
  return request({
    url: '/system/user/profile/update',
    method: 'put',
    data
  })
}

/**
 * 修改当前登录用户密码
 */
export function updateCurrentUserPasswordApi(data) {
  return request({
    url: '/system/user/password/update',
    method: 'put',
    data
  })
}

/**
 * 上传当前登录用户头像
 * 传入 FormData，字段名必须为 file
 */
export function uploadCurrentUserAvatarApi(data) {
  return request({
    url: '/system/user/avatar/upload',
    method: 'post',
    data
  })
}