import request from '../utils/request'

export function getOverviewSummaryApi() {
  return request({
    url: '/core/overview/summary',
    method: 'get'
  })
}

export function getAlarmMapPointsApi(params) {
  return request({
    url: '/core/overview/alarm-map',
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

export function getStationListApi(params) {
  return request({
    url: '/core/stations/list',
    method: 'get',
    params
  })
}

export function getDeviceListApi(params) {
  return request({
    url: '/core/devices/list',
    method: 'get',
    params
  })
}

export function getAlarmListApi(params) {
  return request({
    url: '/core/alarms/list',
    method: 'get',
    params
  })
}

export function getAlarmPageApi(params) {
  return request({
    url: '/core/alarms/page',
    method: 'get',
    params
  })
}

export function getTaskListApi(params) {
  return request({
    url: '/core/tasks/list',
    method: 'get',
    params
  })
}

export function getConfigListApi() {
  return request({
    url: '/core/configs/list',
    method: 'get'
  })
}

export function updateConfigApi(data) {
  return request({
    url: '/core/configs/update',
    method: 'post',
    data
  })
}

export function getHistoryListApi(params) {
  return request({
    url: '/core/history/list',
    method: 'get',
    params
  })
}

export function getHistoryPageApi(params) {
  return request({
    url: '/core/history/page',
    method: 'get',
    params
  })
}

export function getRealtimeLatestApi(params) {
  return request({
    url: '/core/realtime/latest',
    method: 'get',
    params
  })
}