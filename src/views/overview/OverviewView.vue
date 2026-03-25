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
            在线 {{ summary.runningDeviceCount }} / 离线 {{ summary.stopDeviceCount }}
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
          <div class="metric-sub">任务状态看调度页；在线状态看最近采集数据是否超时</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card status-meaning-card" shadow="never" style="margin-top: 16px;">
      <div class="status-meaning-header">
        <div class="status-meaning-title">状态口径统一说明</div>
        <div class="status-meaning-subtitle">任务状态表示是否允许调度与上报；设备/站点在线状态表示最近是否收到有效采集数据。两者关联但不完全等价。</div>
      </div>
      <div class="status-meaning-inline">
        <span class="meaning-chip"><i class="chip-dot green"></i>运行中：任务调度已开启</span>
        <span class="meaning-chip"><i class="chip-dot gray"></i>未启动 / 已停止：任务不参与实时链路</span>
        <span class="meaning-chip"><i class="chip-dot green"></i>在线：离线阈值内收到数据</span>
        <span class="meaning-chip"><i class="chip-dot red"></i>离线：超过离线阈值未收到数据</span>
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="15">
        <el-card class="page-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>站点地图态势</span>
              <div class="header-actions">
                <div class="map-legend">
                  <span><i class="legend-dot success"></i>全部在线</span>
                  <span><i class="legend-dot warning"></i>混合状态</span>
                  <span><i class="legend-dot danger"></i>全部离线</span>
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
import {
  deviceOnlineColor,
  deviceOnlineText,
  getStationDeviceOnlineMeta
} from '../../utils/status'

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

const getStationStatusMeta = (devices) => getStationDeviceOnlineMeta(devices)

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
  const online = devices.filter(item => item.runStatus === 1).length
  const offline = devices.filter(item => item.runStatus === 0).length

  const deviceHtml = devices.length > 0
    ? devices.map(item => {
        const color = deviceOnlineColor(item.runStatus)
        const text = deviceOnlineText(item.runStatus)
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
      <div style="margin-top:4px;color:#606266;">在线：${online} / 离线：${offline}</div>
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
    const marker = L.marker([station.latitude, station.longitude], {
      icon: createStationIcon(station, devices)
    })

    marker.bindPopup(buildPopupHtml(station, devices), {
      maxWidth: 340
    })

    marker.addTo(markerLayer)
  })

  await nextTick()

  if (validStations.length > 0) {
    const bounds = L.latLngBounds(validStations.map(item => [item.latitude, item.longitude]))
    mapInstance.fitBounds(bounds.pad(0.25))
  }
}

const renderAlarmChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: '告警状态',
        type: 'pie',
        radius: ['46%', '72%'],
        avoidLabelOverlap: false,
        label: {
          formatter: '{b}\n{c}'
        },
        data: [
          { value: summary.unreadAlarmCount, name: '未处理' },
          { value: summary.confirmedAlarmCount, name: '已确认' },
          { value: summary.handledAlarmCount, name: '已处理' }
        ]
      }
    ]
  }

  chartInstance.setOption(option)
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

const loadAlarmPage = async () => {
  const res = await getAlarmPageApi({
    current: alarmQuery.current,
    size: alarmQuery.size
  })
  const data = res.data || {}
  alarmPage.total = data.total || 0
  alarmPage.records = data.records || []
}

const loadOverviewSummary = async () => {
  const res = await getOverviewSummaryApi()
  const data = res.data || {}

  summary.stationCount = data.stationCount || 0
  summary.onlineStationCount = data.onlineStationCount || 0
  summary.offlineStationCount = data.offlineStationCount || 0
  summary.deviceCount = data.deviceCount || 0
  summary.runningDeviceCount = data.runningDeviceCount || 0
  summary.stopDeviceCount = data.stopDeviceCount || 0
  summary.alarmCount = data.alarmCount || 0
  summary.unreadAlarmCount = data.unreadAlarmCount || 0
  summary.confirmedAlarmCount = data.confirmedAlarmCount || 0
  summary.handledAlarmCount = data.handledAlarmCount || 0
}

const loadStationList = async () => {
  const res = await getStationListApi()
  stationList.value = res.data || []
}

const loadDeviceList = async () => {
  const res = await getDeviceListApi()
  deviceList.value = res.data || []

  summary.deviceCount = deviceList.value.length
  summary.runningDeviceCount = deviceList.value.filter(item => item.runStatus === 1).length
  summary.stopDeviceCount = deviceList.value.filter(item => item.runStatus === 0).length
}

const loadOverviewData = async () => {
  try {
    loading.value = true
    await Promise.all([
      loadOverviewSummary(),
      loadStationList(),
      loadDeviceList(),
      loadAlarmPage()
    ])

    recomputeStationSummary()
    await renderMap()
    await renderAlarmChart()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (mapInstance) {
    mapInstance.invalidateSize()
  }
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(async () => {
  await loadOverviewData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 112px);
}

.overview-card {
  border-radius: 18px;
  background: linear-gradient(135deg, #409eff, #67c6ff);
  color: #ffffff;
}

.metric-title {
  font-size: 14px;
  opacity: 0.92;
}

.metric-value {
  margin-top: 12px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.metric-sub {
  margin-top: 12px;
  font-size: 13px;
  opacity: 0.9;
}

.page-card {
  border-radius: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.map-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #606266;
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

.map-box {
  width: 100%;
  height: 420px;
  border-radius: 14px;
  overflow: hidden;
}

.chart-box {
  width: 100%;
  height: 420px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.status-meaning-card {
  border: 1px solid #e4ecf7;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.status-meaning-header {
  margin-bottom: 12px;
}

.status-meaning-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.status-meaning-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
}

.status-meaning-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meaning-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: #f7faff;
  border: 1px solid #e8eef8;
  color: #606266;
  font-size: 13px;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.chip-dot.green {
  background: #67c23a;
}

.chip-dot.gray {
  background: #909399;
}

.chip-dot.red {
  background: #f56c6c;
}
</style>