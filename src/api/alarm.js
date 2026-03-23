import request from '@/utils/request'

/**
 * PC 端告警分页列表
 * 注意：
 * request.js 中已经配置了 baseURL = '/api'
 * 所以这里不能再写 '/api/core/...'
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
 * 当前 AlarmMapView.vue 改为从 alarm.js 统一获取地图分页接口时，
 * 这里必须导出 getAlarmMapPageApi，否则会出现：
 * does not provide an export named 'getAlarmMapPageApi'
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
 */
export function confirmAlarmApi(data) {
  return request({
    url: '/core/alarm/confirm',
    method: 'post',
    data
  })
}

/**
 * 告警处理
 */
export function handleAlarmApi(data) {
  return request({
    url: '/core/alarm/handle',
    method: 'post',
    data
  })
}