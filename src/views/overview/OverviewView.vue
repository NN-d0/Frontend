
<template>
  <div class="page-container">
    <div class="overview-bg">
      <span class="bg-orb orb-left"></span>
      <span class="bg-orb orb-right"></span>
      <span class="bg-orb orb-bottom"></span>
      <span class="bg-grid"></span>
    </div>

    <section class="hero-panel">
      <div class="hero-panel-glow"></div>
      <div class="hero-panel-grid"></div>
      <div class="hero-panel-scan"></div>

      <div class="hero-main">
        <div class="hero-copy">
          <div class="hero-badge">毕业设计成果展示 · 首页总览</div>
          <h1 class="hero-title">无线电频谱智能监测系统总览工作台</h1>
          <div class="hero-subtitle">
            聚合站点、设备、告警与地图态势信息
          </div>

          <div class="hero-tags">
            <span class="hero-tag">Spring Cloud</span>
            <span class="hero-tag">Vue3 + Element Plus</span>
            <span class="hero-tag">Leaflet GIS</span>
            <span class="hero-tag">ECharts</span>
            <span class="hero-tag">WebSocket</span>
            <span class="hero-tag">Python AI</span>
          </div>

          <div class="hero-status-meaning">
            <span class="meaning-chip"><i class="chip-dot green"></i>运行中：任务调度已开启</span>
            <span class="meaning-chip"><i class="chip-dot gray"></i>未启动 / 已停止：任务不参与实时链路</span>
            <span class="meaning-chip"><i class="chip-dot green"></i>在线：离线阈值内收到数据</span>
            <span class="meaning-chip"><i class="chip-dot red"></i>离线：超过离线阈值未收到数据</span>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-side-card">
            <div class="side-card-label">站点在线率</div>
            <div class="side-card-value">{{ stationOnlineRate }}</div>
            <div class="side-card-desc">
              在线 {{ summary.onlineStationCount }} / 总计 {{ summary.stationCount }}
            </div>
          </div>
          <div class="hero-side-card">
            <div class="side-card-label">设备可用率</div>
            <div class="side-card-value">{{ deviceOnlineRate }}</div>
            <div class="side-card-desc">
              开启 {{ summary.runningDeviceCount }} / 总计 {{ summary.deviceCount }}
            </div>
          </div>
          <div class="hero-side-card hero-side-wide">
            <div class="side-card-label">告警闭环率</div>
            <div class="side-card-value">{{ alarmHandledRate }}</div>
            <div class="side-card-desc">
              已处理 {{ summary.handledAlarmCount }}，未处理 {{ summary.unreadAlarmCount }}
            </div>
            <div class="side-wave">
              <span v-for="bar in 14" :key="bar" class="side-wave-bar"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-footer">
        <div class="hero-footer-item">
          <span class="footer-item-label">当前总览说明</span>
          <span class="footer-item-value">地图态势 + 告警统计 + 最新告警分页</span>
        </div>
        <div class="hero-footer-item">
          <span class="footer-item-label">三大特点</span>
          <span class="footer-item-value">首页总览 / 告警态势 / 统计概览</span>
        </div>
        <div class="hero-footer-item">
          <span class="footer-item-label">最近刷新时间</span>
          <span class="footer-item-value">{{ lastRefreshTime }}</span>
        </div>
        <div class="hero-footer-actions">
          <el-button class="hero-refresh-btn" @click="loadOverviewData">刷新总览</el-button>
        </div>
      </div>
    </section>

    <el-row :gutter="16" class="metric-row">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-top">
            <div class="metric-label">站点总数</div>
            <div class="metric-badge">{{ summary.onlineStationCount }} 在线</div>
          </div>
          <div class="metric-number">{{ summary.stationCount }}</div>
          <div class="metric-desc">离线 {{ summary.offlineStationCount }} 个，地图态势自动联动站点状态</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: stationOnlineRateValue + '%' }"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-top">
            <div class="metric-label">设备总数</div>
            <div class="metric-badge">{{ summary.runningDeviceCount }} 开启</div>
          </div>
          <div class="metric-number">{{ summary.deviceCount }}</div>
          <div class="metric-desc">停止 {{ summary.stopDeviceCount }} 台，支持设备与任务联动展示</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: deviceOnlineRateValue + '%' }"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-top">
            <div class="metric-label">告警总数</div>
            <div class="metric-badge">{{ summary.unreadAlarmCount }} 未处理</div>
          </div>
          <div class="metric-number">{{ summary.alarmCount }}</div>
          <div class="metric-desc">已确认 {{ summary.confirmedAlarmCount }} / 已处理 {{ summary.handledAlarmCount }}</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: alarmPendingRateValue + '%' }"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-top">
            <div class="metric-label">告警闭环率</div>
          </div>
          <div class="metric-number">{{ alarmHandledRate }}</div>
          <div class="metric-desc">已处理 {{ summary.handledAlarmCount }} 条，体现告警处置闭环能力</div>
          <div class="metric-progress">
            <div class="metric-progress-bar" :style="{ width: alarmHandledRateValue + '%' }"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="main-panel-row">
      <el-col :span="15" class="stretch-col">
        <el-card class="page-card panel-card panel-card-map" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">站点地图态势</div>
                <div class="panel-subtitle">展示站点分布、设备在线状态与 GIS 态势概览</div>
              </div>
              <div class="panel-header-actions">
                <div class="map-legend">
                  <span><i class="legend-dot success"></i>全部在线</span>
                  <span><i class="legend-dot warning"></i>混合状态</span>
                  <span><i class="legend-dot danger"></i>全部离线</span>
                  <span><i class="legend-dot info"></i>暂无设备</span>
                </div>
                <el-button size="small" @click="loadOverviewData">刷新地图</el-button>
              </div>
            </div>
          </template>

          <div class="panel-body panel-body-map">
            <div class="map-toolbar">
              <div class="toolbar-item">
                <div class="toolbar-label">站点规模</div>
                <div class="toolbar-value">{{ summary.stationCount }}</div>
              </div>
              <div class="toolbar-item">
                <div class="toolbar-label">在线站点</div>
                <div class="toolbar-value success">{{ summary.onlineStationCount }}</div>
              </div>
              <div class="toolbar-item">
                <div class="toolbar-label">离线站点</div>
                <div class="toolbar-value danger">{{ summary.offlineStationCount }}</div>
              </div>
              <div class="toolbar-item toolbar-wide">
                <div class="toolbar-label">地图说明</div>
                <div class="toolbar-value muted">点击站点可查看设备明细与在线状态</div>
              </div>
            </div>
            <div ref="mapRef" class="map-box"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="9" class="stretch-col">
        <el-card class="page-card panel-card panel-card-chart" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">告警状态统计</div>
                <div class="panel-subtitle">展示告警处置分布与当前告警压力</div>
              </div>
              <el-tag effect="dark" type="danger">闭环分析</el-tag>
            </div>
          </template>

          <div class="panel-body panel-body-chart">
            <div ref="chartRef" class="chart-box"></div>

            <div class="chart-insight-grid">
              <div class="insight-card">
                <div class="insight-label">未处理</div>
                <div class="insight-value danger">{{ summary.unreadAlarmCount }}</div>
              </div>
              <div class="insight-card">
                <div class="insight-label">已确认</div>
                <div class="insight-value warning">{{ summary.confirmedAlarmCount }}</div>
              </div>
              <div class="insight-card">
                <div class="insight-label">已处理</div>
                <div class="insight-value success">{{ summary.handledAlarmCount }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card alarm-table-card" shadow="hover">
      <template #header>
        <div class="panel-header">
          <div>
            <div class="panel-title">最新告警列表</div>
            <div class="panel-subtitle">支持分页查看，适合作为首页总览的业务数据窗口</div>
          </div>
          <div class="panel-header-actions">
            <div class="alarm-summary-badges">
              <span class="summary-badge badge-danger">未处理 {{ summary.unreadAlarmCount }}</span>
              <span class="summary-badge badge-warning">已确认 {{ summary.confirmedAlarmCount }}</span>
              <span class="summary-badge badge-success">已处理 {{ summary.handledAlarmCount }}</span>
            </div>
            <el-tag type="info">分页版</el-tag>
          </div>
        </div>
      </template>

      <el-table :data="alarmPage.records" stripe border v-loading="loading" class="alarm-table">
        <el-table-column prop="alarmNo" label="告警编号" min-width="180" />
        <el-table-column prop="stationName" label="站点名称" min-width="130" />
        <el-table-column prop="deviceName" label="设备名称" min-width="160" />
        <el-table-column prop="alarmType" label="告警类型" width="130" />
        <el-table-column prop="alarmLevel" label="告警级别" width="110">
          <template #default="scope">
            <el-tag :type="alarmLevelTag(scope.row.alarmLevel)">
              {{ scope.row.alarmLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="告警标题" min-width="220" show-overflow-tooltip />
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
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
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
const lastRefreshTime = ref('-')

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
let refreshTimer = null

const percentText = (current, total) => {
  if (!total) return '0%'
  return `${Math.round((Number(current || 0) / Number(total || 1)) * 100)}%`
}

const percentValue = (current, total) => {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((Number(current || 0) / Number(total || 1)) * 100)))
}

const stationOnlineRate = computed(() => percentText(summary.onlineStationCount, summary.stationCount))
const deviceOnlineRate = computed(() => percentText(summary.runningDeviceCount, summary.deviceCount))
const alarmHandledRate = computed(() => percentText(summary.handledAlarmCount, summary.alarmCount))
const alarmPendingRate = computed(() => percentText(summary.unreadAlarmCount, summary.alarmCount))

const stationOnlineRateValue = computed(() => percentValue(summary.onlineStationCount, summary.stationCount))
const deviceOnlineRateValue = computed(() => percentValue(summary.runningDeviceCount, summary.deviceCount))
const alarmHandledRateValue = computed(() => percentValue(summary.handledAlarmCount, summary.alarmCount))
const alarmPendingRateValue = computed(() => percentValue(summary.unreadAlarmCount, summary.alarmCount))

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const updateLastRefreshTime = () => {
  lastRefreshTime.value = formatTime(new Date().toISOString())
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

  return stationDevices.some(device => {
    return (
      normalizeBoolLike(device.runStatus) ||
      normalizeOnlineText(device.runStatus) ||
      normalizeOnlineText(device.status) ||
      normalizeOnlineText(device.deviceStatus) ||
      hasRecentOnlineTime(device.lastOnlineTime)
    )
  })
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
        min-width:96px;
        padding:9px 12px;
        border-radius:16px;
        background:${meta.color};
        color:#fff;
        box-shadow:0 14px 28px rgba(2,6,23,0.18);
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
        top:-9px;
        right:-9px;
        width:28px;
        height:28px;
        border-radius:50%;
        background:#fff;
        color:${meta.color};
        font-weight:700;
        text-align:center;
        line-height:28px;
        box-shadow:0 8px 18px rgba(0,0,0,0.16);
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px 10px;background:#f7f9fc;border-radius:10px;">
            <span style="color:#1f2937;">${item.deviceName}</span>
            <span style="color:${color};font-weight:700;">${text}</span>
          </div>
        `
      }).join('')
    : `<div style="margin-top:10px;color:#909399;">暂无设备</div>`

  return `
    <div style="width:300px;padding:2px 2px 6px 2px;">
      <div style="font-size:16px;font-weight:700;color:#1f2937;">${station.stationName || '-'}</div>
      <div style="margin-top:8px;color:#606266;">站点编码：${station.stationCode || '-'}</div>
      <div style="margin-top:4px;color:#606266;">位置：${station.locationText || '-'}</div>
      <div style="margin-top:4px;color:#606266;">设备总数：${total}</div>
      <div style="margin-top:4px;color:#606266;">在线：${online} / 离线：${offline}</div>
      <div style="margin-top:12px;font-weight:700;color:#1f2937;">设备明细</div>
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

const initMap = async () => {
  await nextTick()
  if (mapInstance || !mapRef.value) return

  mapInstance = L.map(mapRef.value, {
    zoomControl: true
  }).setView([22.55, 114.0], 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance)

  markerLayer = L.layerGroup().addTo(mapInstance)

  setTimeout(() => {
    mapInstance?.invalidateSize()
  }, 80)
}

const renderMap = async () => {
  await initMap()

  if (!markerLayer || !mapInstance) return
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

  setTimeout(() => {
    mapInstance?.invalidateSize()
  }, 50)
}

const renderAlarmChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item'
    },
    color: ['#fb7185', '#f59e0b', '#22c55e'],
    legend: {
      bottom: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#64748b'
      }
    },
    series: [
      {
        name: '告警状态',
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: {
          color: '#334155',
          formatter: '{b}\n{c}'
        },
        labelLine: {
          length: 12,
          length2: 10
        },
        emphasis: {
          scale: true,
          scaleSize: 8
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 4,
          shadowBlur: 18,
          shadowColor: 'rgba(15, 23, 42, 0.12)'
        },
        data: [
          { value: summary.unreadAlarmCount, name: '未处理' },
          { value: summary.confirmedAlarmCount, name: '已确认' },
          { value: summary.handledAlarmCount, name: '已处理' }
        ]
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '34%',
        style: {
          text: String(summary.alarmCount || 0),
          fill: '#0f172a',
          fontSize: 28,
          fontWeight: 700
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '45%',
        style: {
          text: '告警总量',
          fill: '#64748b',
          fontSize: 13
        }
      }
    ]
  }

  chartInstance.setOption(option, true)
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
    updateLastRefreshTime()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const scheduleRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(() => {
    loadOverviewData()
  }, 200)
}

const handleResize = () => {
  mapInstance?.invalidateSize()
  chartInstance?.resize()
}

onMounted(async () => {
  await loadOverviewData()
  window.addEventListener('resize', handleResize)
  window.addEventListener('radio-alarm-status-changed', scheduleRefresh)
  window.addEventListener('radio-task-status-changed', scheduleRefresh)
  window.addEventListener('task-device-linkage-changed', scheduleRefresh)
  window.addEventListener('radio-device-status-changed', scheduleRefresh)
  window.addEventListener('radio-station-changed', scheduleRefresh)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('radio-alarm-status-changed', scheduleRefresh)
  window.removeEventListener('radio-task-status-changed', scheduleRefresh)
  window.removeEventListener('task-device-linkage-changed', scheduleRefresh)
  window.removeEventListener('radio-device-status-changed', scheduleRefresh)
  window.removeEventListener('radio-station-changed', scheduleRefresh)

  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

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
  position: relative;
  min-height: calc(100vh - 112px);
  padding-bottom: 8px;
  overflow: hidden;
}

.overview-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.22;
}

.orb-left {
  top: 12px;
  left: -80px;
  width: 280px;
  height: 280px;
  background: rgba(56, 189, 248, 0.38);
}

.orb-right {
  top: 120px;
  right: -90px;
  width: 260px;
  height: 260px;
  background: rgba(34, 197, 94, 0.28);
}

.orb-bottom {
  bottom: 20px;
  left: 35%;
  width: 320px;
  height: 320px;
  background: rgba(59, 130, 246, 0.18);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.32), transparent 90%);
}

.hero-panel {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  padding: 24px 24px 18px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(10, 27, 61, 0.96), rgba(10, 40, 93, 0.92));
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.16);
  color: #ffffff;
}

.hero-panel-glow {
  position: absolute;
  inset: auto -120px -140px auto;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.22), transparent 70%);
  filter: blur(14px);
}

.hero-panel-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 34px 34px;
  opacity: 0.22;
}

.hero-panel-scan {
  position: absolute;
  inset: -20% auto auto -12%;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  border: 1px solid rgba(125, 211, 252, 0.12);
  box-shadow:
    0 0 0 38px rgba(59, 130, 246, 0.04),
    0 0 0 76px rgba(59, 130, 246, 0.03);
}

.hero-main,
.hero-footer,
.metric-row,
.main-panel-row,
.alarm-table-card {
  position: relative;
  z-index: 1;
}

.hero-main {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 18px;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.18);
  border: 1px solid rgba(147, 197, 253, 0.2);
  color: #dbeafe;
  font-size: 12px;
  font-weight: 700;
}

.hero-title {
  margin: 16px 0 0;
  font-size: 34px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.hero-subtitle {
  margin-top: 12px;
  max-width: 760px;
  font-size: 15px;
  line-height: 1.85;
  color: rgba(226, 232, 240, 0.92);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-tag {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-size: 13px;
}

.hero-status-meaning {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.meaning-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #dbeafe;
  font-size: 13px;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.chip-dot.green { background: #4ade80; }
.chip-dot.gray { background: #cbd5e1; }
.chip-dot.red { background: #f87171; }

.hero-side {
  width: 360px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.hero-side-card {
  position: relative;
  overflow: hidden;
  padding: 16px 16px 14px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(191, 219, 254, 0.12);
  backdrop-filter: blur(8px);
}

.hero-side-wide {
  grid-column: 1 / -1;
}

.side-card-label {
  color: rgba(191, 219, 254, 0.88);
  font-size: 12px;
}

.side-card-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
}

.side-card-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(226, 232, 240, 0.88);
}

.side-wave {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 38px;
  margin-top: 14px;
}

.side-wave-bar {
  width: 6px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(96, 165, 250, 0.95), rgba(34, 197, 94, 0.82));
  animation: waveFloat 2.4s ease-in-out infinite;
}

.side-wave-bar:nth-child(1) { height: 10px; animation-delay: 0s; }
.side-wave-bar:nth-child(2) { height: 17px; animation-delay: 0.1s; }
.side-wave-bar:nth-child(3) { height: 25px; animation-delay: 0.2s; }
.side-wave-bar:nth-child(4) { height: 14px; animation-delay: 0.3s; }
.side-wave-bar:nth-child(5) { height: 30px; animation-delay: 0.4s; }
.side-wave-bar:nth-child(6) { height: 18px; animation-delay: 0.5s; }
.side-wave-bar:nth-child(7) { height: 26px; animation-delay: 0.6s; }
.side-wave-bar:nth-child(8) { height: 12px; animation-delay: 0.7s; }
.side-wave-bar:nth-child(9) { height: 28px; animation-delay: 0.8s; }
.side-wave-bar:nth-child(10) { height: 16px; animation-delay: 0.9s; }
.side-wave-bar:nth-child(11) { height: 22px; animation-delay: 1s; }
.side-wave-bar:nth-child(12) { height: 14px; animation-delay: 1.1s; }
.side-wave-bar:nth-child(13) { height: 20px; animation-delay: 1.2s; }
.side-wave-bar:nth-child(14) { height: 12px; animation-delay: 1.3s; }

.hero-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.07);
  min-width: 190px;
}

.footer-item-label {
  font-size: 12px;
  color: rgba(191, 219, 254, 0.82);
}

.footer-item-value {
  font-size: 13px;
  color: #eff6ff;
}

.hero-footer-actions {
  margin-left: auto;
}

.hero-refresh-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.24);
}

.metric-row {
  margin-bottom: 16px;
}

.metric-card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.metric-badge {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  color: #ffffff;
}

.metric-number {
  margin-top: 14px;
  font-size: 34px;
  line-height: 1;
  font-weight: 800;
  color: #ffffff;
}

.metric-desc {
  margin-top: 12px;
  min-height: 40px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.metric-progress {
  margin-top: 14px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

.metric-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.45));
}

.metric-blue {
  background: linear-gradient(135deg, #2563eb, #38bdf8);
}

.metric-cyan {
  background: linear-gradient(135deg, #0891b2, #22d3ee);
}

.metric-orange {
  background: linear-gradient(135deg, #ea580c, #f59e0b);
}

.metric-green {
  background: linear-gradient(135deg, #16a34a, #4ade80);
}

.main-panel-row {
  display: flex;
  align-items: stretch;
  margin-bottom: 16px;
}

.main-panel-row > .el-col {
  display: flex;
}

.stretch-col {
  display: flex;
  align-self: stretch;
}

.page-card {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #ffffff);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.panel-card {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.panel-card :deep(.el-card__header) {
  flex-shrink: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2f7;
}

.panel-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
}

.panel-subtitle {
  margin-top: 5px;
  font-size: 13px;
  color: #64748b;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-body-map {
  gap: 14px;
}

.map-toolbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.toolbar-item {
  padding: 13px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e5edf8;
}

.toolbar-wide {
  grid-column: span 1;
}

.toolbar-label {
  font-size: 12px;
  color: #64748b;
}

.toolbar-value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.toolbar-value.success { color: #16a34a; }
.toolbar-value.danger { color: #dc2626; }
.toolbar-value.muted { font-size: 13px; font-weight: 600; color: #475569; }

.map-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
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

.legend-dot.success { background: #67c23a; }
.legend-dot.warning { background: #e6a23c; }
.legend-dot.danger { background: #f56c6c; }
.legend-dot.info { background: #909399; }

.map-box {
  width: 100%;
  flex: 1;
  min-height: 450px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e5edf8;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4);
}

.panel-body-chart {
  gap: 14px;
}

.chart-box {
  width: 100%;
  flex: 1;
  min-height: 310px;
}

.chart-insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.insight-card {
  padding: 12px 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e7eef9;
}

.insight-label {
  font-size: 12px;
  color: #64748b;
}

.insight-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.insight-value.danger { color: #e11d48; }
.insight-value.warning { color: #d97706; }
.insight-value.success { color: #16a34a; }

.chart-note {
  padding: 14px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e7eef9;
  font-size: 13px;
  line-height: 1.8;
  color: #475569;
}

.alarm-table-card {
  margin-top: 0;
}

.alarm-summary-badges {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.summary-badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge-danger {
  color: #be123c;
  background: #fff1f2;
}

.badge-warning {
  color: #b45309;
  background: #fffbeb;
}

.badge-success {
  color: #166534;
  background: #f0fdf4;
}

.alarm-table :deep(.el-table__header-wrapper th) {
  background: #f8fbff;
  color: #334155;
}

.alarm-table :deep(.el-table__row:hover > td) {
  background: #f8fbff !important;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@keyframes waveFloat {
  0%, 100% {
    transform: scaleY(0.9);
    opacity: 0.72;
  }
  50% {
    transform: scaleY(1.15);
    opacity: 1;
  }
}

@media (max-width: 1440px) {
  .hero-main {
    flex-direction: column;
  }

  .hero-side {
    width: 100%;
  }
}

@media (max-width: 1280px) {
  .map-toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .main-panel-row {
    display: block;
  }

  .map-box {
    min-height: 380px;
  }
}

@media (max-width: 992px) {
  .hero-title {
    font-size: 28px;
  }

  .metric-row :deep(.el-col) {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .hero-footer-actions {
    margin-left: 0;
  }

  .hero-footer-item,
  .hero-side {
    width: 100%;
  }

  .hero-side {
    grid-template-columns: 1fr;
  }

  .map-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
