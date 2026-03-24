<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">站点总数</div>
          <div class="metric-value">{{ summary.stationCount }}</div>
          <div class="metric-sub">
            在线 {{ summary.onlineStationCount }} / 离线 {{ summary.offlineStationCount }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">设备总数</div>
          <div class="metric-value">{{ summary.deviceCount }}</div>
          <div class="metric-sub">
            运行中 {{ summary.runningDeviceCount }} / 停用 {{ summary.stopDeviceCount }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">告警总数</div>
          <div class="metric-value">{{ summary.alarmCount }}</div>
          <div class="metric-sub">
            未处理 {{ summary.unreadAlarmCount }} / 已确认 {{ summary.confirmedAlarmCount }}
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">系统状态</div>
          <div class="metric-value">{{ summary.onlineStationCount > 0 ? '正常' : '异常' }}</div>
          <div class="metric-sub">站点在线数已按当前站点/设备状态校正</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="15">
        <el-card class="page-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>站点地图态势</span>
              <div class="header-actions">
                <div class="map-legend">
                  <span><i class="legend-dot success"></i>全部运行</span>
                  <span><i class="legend-dot warning"></i>混合状态</span>
                  <span><i class="legend-dot danger"></i>全部停用</span>
                  <span><i class="legend-dot info"></i>暂无设备</span>
                </div>
                <el-button size="small" @click="loadOverviewData">刷新数据</el-button>
              </div>
            </div>
          </template>
          <div ref="mapRef" class="map-box"></div>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card class="page-card" shadow="hover">
          <template #header>
            <span>告警状态统计</span>
          </template>
          <div ref="chartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card class="page-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最新告警列表</span>
              <el-tag type="danger">分页版</el-tag>
            </div>
          </template>

          <el-table :data="alarmPage.records" stripe border v-loading="loading">
            <el-table-column prop="alarmNo" label="告警编号" min-width="170" />
            <el-table-column prop="stationName" label="站点名称" min-width="140" />
            <el-table-column prop="deviceName" label="设备名称" min-width="170" />
            <el-table-column prop="alarmType" label="告警类型" width="130" />
            <el-table-column prop="alarmLevel" label="告警级别" width="110">
              <template #default="scope">
                <el-tag :type="alarmLevelTag(scope.row.alarmLevel)">
                  {{ scope.row.alarmLevel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="告警标题" min-width="180" />
            <el-table-column prop="alarmStatus" label="处理状态" width="120">
              <template #default="scope">
                <el-tag :type="alarmStatusTag(scope.row.alarmStatus)">
                  {{ alarmStatusText(scope.row.alarmStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alarmTime" label="告警时间" min-width="180">
              <template #default="scope">
                {{ formatTime(scope.row.alarmTime) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="alarmPage.total"
              :current-page="alarmQuery.current"
              :page-size="alarmQuery.size"
              :page-sizes="[5, 8, 10, 20]"
              @current-change="handleAlarmPageChange"
              @size-change="handleAlarmSizeChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import L from 'leaflet'
import {
  getDeviceListApi,
  getOverviewSummaryApi,
  getStationListApi
} from '../../api/overview'
import { getAlarmPageApi } from '../../api/alarm'

const loading = ref(false)

const summary = reactive({
  stationCount: 0,
  onlineStationCount: 0,
  offlineStationCount: 0,
  deviceCount: 0,
  runningDeviceCount: 0,
  stopDeviceCount: 0,
  alarmCount: 0,
  unreadAlarmCount: 0,
  confirmedAlarmCount: 0,
  handledAlarmCount: 0
})

const stationList = ref([])
const deviceList = ref([])

const alarmQuery = reactive({
  current: 1,
  size: 8
})

const alarmPage = reactive({
  total: 0,
  records: []
})

const mapRef = ref(null)
const chartRef = ref(null)

let mapInstance = null
let markerLayer = null
let chartInstance = null

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const alarmStatusText = (status) => {
  const map = {
    0: '未处理',
    1: '已确认',
    2: '已处理'
  }
  return map[status] || '未知'
}

const alarmStatusTag = (status) => {
  const map = {
    0: 'danger',
    1: 'warning',
    2: 'success'
  }
  return map[status] || 'info'
}

const alarmLevelTag = (level) => {
  const map = {
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'success'
  }
  return map[level] || 'info'
}

const buildDeviceMap = () => {
  const map = new Map()
  deviceList.value.forEach(item => {
    if (!map.has(item.stationId)) {
      map.set(item.stationId, [])
    }
    map.get(item.stationId).push(item)
  })
  return map
}

const normalizeBoolLike = (value) => {
  return value === true || value === 1 || value === '1'
}

const normalizeOnlineText = (value) => {
  if (value === null || value === undefined) return false
  const text = String(value).trim().toUpperCase()
  return ['ONLINE', 'ON', 'RUNNING', 'ACTIVE', 'ENABLE', 'ENABLED', '正常', '在线'].includes(text)
}

const hasRecentOnlineTime = (value) => {
  if (!value) return false
  const time = new Date(String(value).replace(' ', 'T')).getTime()
  if (Number.isNaN(time)) return false
  const diff = Date.now() - time
  return diff >= 0 && diff <= 10 * 60 * 1000
}

const isStationOnline = (station, stationDevices) => {
  if (
    normalizeBoolLike(station.onlineStatus) ||
    normalizeBoolLike(station.stationStatus) ||
    normalizeBoolLike(station.status) ||
    normalizeBoolLike(station.online) ||
    normalizeBoolLike(station.runStatus)
  ) {
    return true
  }

  if (
    normalizeOnlineText(station.onlineStatus) ||
    normalizeOnlineText(station.stationStatus) ||
    normalizeOnlineText(station.status)
  ) {
    return true
  }

  if (hasRecentOnlineTime(station.lastOnlineTime) || hasRecentOnlineTime(station.onlineTime)) {
    return true
  }

  if (!stationDevices || stationDevices.length === 0) {
    return false
  }

  const hasRunningDevice = stationDevices.some(device => {
    return (
      normalizeBoolLike(device.runStatus) ||
      normalizeOnlineText(device.runStatus) ||
      normalizeOnlineText(device.status) ||
      normalizeOnlineText(device.deviceStatus) ||
      hasRecentOnlineTime(device.lastOnlineTime)
    )
  })

  return hasRunningDevice
}

const recomputeStationSummary = () => {
  const total = stationList.value.length
  const stationDeviceMap = buildDeviceMap()

  let online = 0
  stationList.value.forEach(station => {
    const devices = stationDeviceMap.get(station.id) || []
    if (isStationOnline(station, devices)) {
      online += 1
    }
  })

  summary.stationCount = total
  summary.onlineStationCount = online
  summary.offlineStationCount = Math.max(total - online, 0)
}

const getStationStatusMeta = (devices) => {
  if (!devices || devices.length === 0) {
    return { color: '#909399', text: '暂无设备', badge: '0' }
  }

  const running = devices.filter(item => item.runStatus === 1).length
  const stop = devices.filter(item => item.runStatus === 0).length

  if (running > 0 && stop === 0) {
    return { color: '#67c23a', text: '全部运行', badge: `${devices.length}` }
  }

  if (running > 0 && stop > 0) {
    return { color: '#e6a23c', text: '混合状态', badge: `${devices.length}` }
  }

  if (running === 0 && stop > 0) {
    return { color: '#f56c6c', text: '全部停用', badge: `${devices.length}` }
  }

  return { color: '#909399', text: '暂无设备', badge: `${devices.length}` }
}

const buildMarkerHtml = (station, devices) => {
  const meta = getStationStatusMeta(devices)

  return `
    <div style="position:relative;transform:translate(-24px,-58px);">
      <div style="
        min-width:92px;
        padding:9px 12px;
        border-radius:15px;
        background:${meta.color};
        color:#fff;
        box-shadow:0 10px 22px rgba(0,0,0,0.18);
        border:2px solid rgba(255,255,255,0.95);
        text-align:center;
      ">
        <div style="font-size:13px;font-weight:700;white-space:nowrap;">${station.stationName || '站点'}</div>
        <div style="margin-top:4px;font-size:12px;opacity:0.94;">${meta.text}</div>
      </div>
      <div style="
        position:absolute;
        left:50%;
        bottom:-11px;
        width:0;height:0;
        border-left:10px solid transparent;
        border-right:10px solid transparent;
        border-top:12px solid ${meta.color};
        transform:translateX(-50%);
      "></div>
      <div style="
        position:absolute;
        top:-8px;
        right:-8px;
        width:26px;
        height:26px;
        border-radius:50%;
        background:#fff;
        color:${meta.color};
        font-weight:700;
        text-align:center;
        line-height:26px;
        box-shadow:0 6px 16px rgba(0,0,0,0.16);
      ">${meta.badge}</div>
    </div>
  `
}

const buildPopupHtml = (station, devices) => {
  const total = devices.length
  const running = devices.filter(item => item.runStatus === 1).length
  const stop = devices.filter(item => item.runStatus === 0).length

  const deviceHtml = devices.length > 0
    ? devices.map(item => {
        const color = item.runStatus === 1 ? '#67c23a' : '#f56c6c'
        const text = item.runStatus === 1 ? '运行中' : '停用'
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px 10px;background:#f7f9fc;border-radius:8px;">
            <span style="color:#303133;">${item.deviceName}</span>
            <span style="color:${color};font-weight:600;">${text}</span>
          </div>
        `
      }).join('')
    : `<div style="margin-top:10px;color:#909399;">暂无设备</div>`

  return `
    <div style="width:300px;padding:2px 2px 6px 2px;">
      <div style="font-size:16px;font-weight:700;color:#303133;">${station.stationName || '-'}</div>
      <div style="margin-top:8px;color:#606266;">站点编码：${station.stationCode || '-'}</div>
      <div style="margin-top:4px;color:#606266;">位置：${station.locationText || '-'}</div>
      <div style="margin-top:4px;color:#606266;">设备总数：${total}</div>
      <div style="margin-top:4px;color:#606266;">运行中：${running} / 停用：${stop}</div>
      <div style="margin-top:12px;font-weight:700;color:#303133;">设备明细</div>
      ${deviceHtml}
    </div>
  `
}

const createStationIcon = (station, devices) => {
  return L.divIcon({
    className: 'custom-station-marker',
    html: buildMarkerHtml(station, devices),
    iconSize: [48, 58],
    iconAnchor: [24, 58],
    popupAnchor: [0, -48]
  })
}

const initMap = () => {
  if (mapInstance) return

  mapInstance = L.map(mapRef.value, {
    zoomControl: true
  }).setView([22.55, 114.0], 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance)

  markerLayer = L.layerGroup().addTo(mapInstance)
}

const renderMap = async () => {
  initMap()

  if (!markerLayer) return
  markerLayer.clearLayers()

  const stationDeviceMap = buildDeviceMap()
  const validStations = stationList.value.filter(item => item.latitude && item.longitude)

  validStations.forEach(station => {
    const devices = stationDeviceMap.get(station.id) || []

    const marker = L.marker(
      [Number(station.latitude), Number(station.longitude)],
      { icon: createStationIcon(station, devices) }
    )

    marker.bindPopup(buildPopupHtml(station, devices), {
      maxWidth: 340,
      className: 'beauty-popup'
    })

    marker.addTo(markerLayer)
  })

  if (validStations.length > 0) {
    const latlngs = validStations.map(item => [Number(item.latitude), Number(item.longitude)])
    mapInstance.fitBounds(latlngs, { padding: [30, 30] })
  }

  setTimeout(() => {
    mapInstance.invalidateSize()
  }, 200)
}

const loadAlarmPage = async () => {
  const res = await getAlarmPageApi({
    current: alarmQuery.current,
    size: alarmQuery.size
  })

  const data = res.data || {}
  alarmPage.total = data.total || 0
  alarmPage.records = data.records || []
}

const loadOverviewData = async () => {
  try {
    loading.value = true

    const [summaryRes, stationRes, deviceRes] = await Promise.all([
      getOverviewSummaryApi(),
      getStationListApi(),
      getDeviceListApi()
    ])

    Object.assign(summary, summaryRes.data || {})
    stationList.value = stationRes.data || []
    deviceList.value = deviceRes.data || []

    recomputeStationSummary()

    await loadAlarmPage()
    await nextTick()
    await renderMap()
    renderChart()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: ['未处理', '已确认', '已处理']
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '告警数量',
        type: 'bar',
        data: [
          summary.unreadAlarmCount || 0,
          summary.confirmedAlarmCount || 0,
          summary.handledAlarmCount || 0
        ]
      }
    ]
  })
}

const handleAlarmPageChange = async (page) => {
  alarmQuery.current = page
  await loadAlarmPage()
}

const handleAlarmSizeChange = async (size) => {
  alarmQuery.size = size
  alarmQuery.current = 1
  await loadAlarmPage()
}

const handleResize = () => {
  if (chartInstance) chartInstance.resize()
  if (mapInstance) mapInstance.invalidateSize()
}

onMounted(async () => {
  await loadOverviewData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #606266;
  font-size: 12px;
  flex-wrap: wrap;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.legend-dot.success {
  background: #67c23a;
}

.legend-dot.warning {
  background: #e6a23c;
}

.legend-dot.danger {
  background: #f56c6c;
}

.legend-dot.info {
  background: #909399;
}
</style>