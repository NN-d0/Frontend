import request from '../utils/request'


export function getAlarmPageApi(params) {
  return request({
    url: '/core/alarms/page',
    method: 'get',
    params
  })
}


export function getAlarmMapPageApi(params) {
  return request({
    url: '/core/overview/alarm-map/page',
    method: 'get',
    params
  })
}


export function confirmAlarmApi(data) {
  return request({
    url: '/core/alarms/confirm',
    method: 'post',
    data
  })
}


export function handleAlarmApi(data) {
  return request({
    url: '/core/alarms/handle',
    method: 'post',
    data
  })
}