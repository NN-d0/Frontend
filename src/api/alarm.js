import request from '../utils/request'

/**
 * 告警分页列表
 * 统一路径：/api/core/alarms/page
 */
export function getAlarmPageApi(params) {
  return request({
    url: '/core/alarms/page',
    method: 'get',
    params
  })
}

/**
 * 告警地图分页
 * 统一路径：/api/core/overview/alarm-map/page
 */
export function getAlarmMapPageApi(params) {
  return request({
    url: '/core/overview/alarm-map/page',
    method: 'get',
    params
  })
}

/**
 * 告警确认
 * 统一路径：/api/core/alarms/confirm
 */
export function confirmAlarmApi(data) {
  return request({
    url: '/core/alarms/confirm',
    method: 'post',
    data
  })
}

/**
 * 告警处理
 * 统一路径：/api/core/alarms/handle
 */
export function handleAlarmApi(data) {
  return request({
    url: '/core/alarms/handle',
    method: 'post',
    data
  })
}