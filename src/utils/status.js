export const TASK_STATUS_MAP = {
  0: {
    value: 0,
    label: '未启动',
    tagType: 'info',
    color: '#909399',
    meaning: '任务已创建但尚未开始调度，不会接收或产生实时数据。'
  },
  1: {
    value: 1,
    label: '运行中',
    tagType: 'success',
    color: '#67c23a',
    meaning: '任务处于业务调度状态，仿真器会对该任务持续上报实时数据。'
  },
  2: {
    value: 2,
    label: '已停止',
    tagType: 'danger',
    color: '#f56c6c',
    meaning: '任务已经停止调度，Core 会拒收该任务的新采集数据。'
  }
}

export const DEVICE_ONLINE_STATUS_MAP = {
  1: {
    value: 1,
    label: '在线',
    tagType: 'success',
    color: '#67c23a',
    meaning: '设备在离线阈值内收到过最新采集数据，链路当前有效。'
  },
  0: {
    value: 0,
    label: '离线',
    tagType: 'danger',
    color: '#f56c6c',
    meaning: '设备超过离线阈值未收到采集数据，当前按离线展示。'
  }
}

export const STATION_ONLINE_STATUS_MAP = {
  1: {
    value: 1,
    label: '在线',
    tagType: 'success',
    color: '#67c23a',
    meaning: '站点下至少还有一个在线设备，或最近收到有效采集数据。'
  },
  0: {
    value: 0,
    label: '离线',
    tagType: 'danger',
    color: '#f56c6c',
    meaning: '站点下暂无在线设备，且最近没有收到有效采集数据。'
  }
}

export const taskStatusTips = Object.values(TASK_STATUS_MAP)
export const deviceStatusTips = Object.values(DEVICE_ONLINE_STATUS_MAP)
export const stationStatusTips = Object.values(STATION_ONLINE_STATUS_MAP)

export const taskStatusText = (status) => TASK_STATUS_MAP[status]?.label || '未知'
export const taskStatusTag = (status) => TASK_STATUS_MAP[status]?.tagType || 'info'
export const taskStatusColor = (status) => TASK_STATUS_MAP[status]?.color || '#909399'

export const deviceOnlineText = (status) => DEVICE_ONLINE_STATUS_MAP[status]?.label || '未知'
export const deviceOnlineTag = (status) => DEVICE_ONLINE_STATUS_MAP[status]?.tagType || 'info'
export const deviceOnlineColor = (status) => DEVICE_ONLINE_STATUS_MAP[status]?.color || '#909399'

export const stationOnlineText = (status) => STATION_ONLINE_STATUS_MAP[status]?.label || '未知'
export const stationOnlineTag = (status) => STATION_ONLINE_STATUS_MAP[status]?.tagType || 'info'
export const stationOnlineColor = (status) => STATION_ONLINE_STATUS_MAP[status]?.color || '#909399'

export const getStationDeviceOnlineMeta = (devices = []) => {
  if (!devices.length) {
    return { color: '#909399', text: '暂无设备', badge: '0' }
  }

  const onlineCount = devices.filter(item => Number(item.runStatus) === 1).length
  const offlineCount = devices.filter(item => Number(item.runStatus) === 0).length

  if (onlineCount > 0 && offlineCount === 0) {
    return { color: '#67c23a', text: '全部在线', badge: String(devices.length) }
  }

  if (onlineCount > 0 && offlineCount > 0) {
    return { color: '#e6a23c', text: '混合状态', badge: String(devices.length) }
  }

  if (onlineCount === 0 && offlineCount > 0) {
    return { color: '#f56c6c', text: '全部离线', badge: String(devices.length) }
  }

  return { color: '#909399', text: '暂无设备', badge: String(devices.length) }
}