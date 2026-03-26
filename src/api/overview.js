import request from '../utils/request'

/**
 * 首页总览摘要
 */
export function getOverviewSummaryApi() {
  return request({
    url: '/core/overview/summary',
    method: 'get'
  })
}

/**
 * 告警地图点位
 */
export function getAlarmMapPointsApi(params) {
  return request({
    url: '/core/overview/alarm-map',
    method: 'get',
    params
  })
}

/**
 * 站点列表
 */
export function getStationListApi(params) {
  return request({
    url: '/core/stations/list',
    method: 'get',
    params
  })
}

/**
 * 设备列表
 */
export function getDeviceListApi(params) {
  return request({
    url: '/core/devices/list',
    method: 'get',
    params
  })
}

/**
 * 任务列表
 */
export function getTaskListApi(params) {
  return request({
    url: '/core/tasks/list',
    method: 'get',
    params
  })
}

/**
 * 系统配置列表
 */
export function getConfigListApi() {
  return request({
    url: '/core/configs/list',
    method: 'get'
  })
}

/**
 * 更新系统配置
 */
export function updateConfigApi(data) {
  return request({
    url: '/core/configs/update',
    method: 'post',
    data
  })
}

/**
 * 历史快照全量列表
 */
export function getHistoryListApi(params) {
  return request({
    url: '/core/history/list',
    method: 'get',
    params
  })
}

/**
 * 历史快照分页
 */
export function getHistoryPageApi(params) {
  return request({
    url: '/core/history/page',
    method: 'get',
    params
  })
}

/**
 * 实时最新频谱
 */
export function getRealtimeLatestApi(params) {
  return request({
    url: '/core/realtime/latest',
    method: 'get',
    params
  })
}

/**
 * AI 健康状态
 */
export function getAiHealthApi() {
  return request({
    url: '/core/configs/ai-health',
    method: 'get'
  })
}