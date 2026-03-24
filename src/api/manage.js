import request from '../utils/request'

export function createStationApi(data) {
  return request({
    url: '/core/stations/create',
    method: 'post',
    data
  })
}

export function getDevicePageApi(params) {
  return request({
    url: '/core/devices/page',
    method: 'get',
    params
  })
}

export function createDeviceApi(data) {
  return request({
    url: '/core/devices/create',
    method: 'post',
    data
  })
}

export function updateDeviceApi(data) {
  return request({
    url: '/core/devices/update',
    method: 'put',
    data
  })
}

export function deleteDeviceApi(id) {
  return request({
    url: `/core/devices/delete/${id}`,
    method: 'delete'
  })
}

export function getTaskPageApi(params) {
  return request({
    url: '/core/tasks/page',
    method: 'get',
    params
  })
}

export function createTaskApi(data) {
  return request({
    url: '/core/tasks/create',
    method: 'post',
    data
  })
}

export function updateTaskApi(data) {
  return request({
    url: '/core/tasks/update',
    method: 'put',
    data
  })
}

export function deleteTaskApi(id) {
  return request({
    url: `/core/tasks/delete/${id}`,
    method: 'delete'
  })
}

export function startTaskApi(id) {
  return request({
    url: `/core/task-dispatch/start/${id}`,
    method: 'post'
  })
}

export function stopTaskApi(id) {
  return request({
    url: `/core/task-dispatch/stop/${id}`,
    method: 'post'
  })
}

export function getTaskLogPageApi(params) {
  return request({
    url: '/core/task-dispatch/logs/page',
    method: 'get',
    params
  })
}