import request from '@/utils/request'

export function getAlarmPageApi(params) {
  return request({
    url: '/api/core/alarm/page',
    method: 'get',
    params
  })
}

export function confirmAlarmApi(data) {
  return request({
    url: '/api/core/alarm/confirm',
    method: 'post',
    data
  })
}

export function handleAlarmApi(data) {
  return request({
    url: '/api/core/alarm/handle',
    method: 'post',
    data
  })
}