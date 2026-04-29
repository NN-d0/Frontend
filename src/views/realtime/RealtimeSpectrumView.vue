<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前站点</div>
          <div class="metric-value ellipsis">{{ currentStationName || '未选择' }}</div>
          <div class="metric-desc">当前实时监测所在站点</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">运行中任务</div>
          <div class="metric-value">{{ monitorState.activeTaskCount || 0 }}</div>
          <div class="metric-desc">{{ monitorState.taskName || '暂无运行任务' }}</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">最新数据延迟</div>
          <div class="metric-value">{{ freshnessDelayText }}</div>
          <div class="metric-desc">{{ freshnessText }}</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">实时链路状态</div>
          <div class="metric-value">{{ connectionStatusText }}</div>
          <div class="metric-desc">{{ connectionStatusDesc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">实时监测参数</div>
            <div class="header-subtitle">任务未启动、等待首帧数据、数据延迟、实时监测中四种状态会明确区分</div>
          </div>
          <div class="header-actions">
            <el-tag :type="statusBannerTagType">{{ statusBannerTagText }}</el-tag>
            <el-button @click="manualRefresh">手动刷新</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="监测站点">
          <el-select
            v-model="queryForm.stationId"
            clearable
            filterable
            placeholder="请选择站点"
            style="width: 260px"
            @change="handleStationChange"
          >
            <el-option
              v-for="item in stationOptions"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自动兜底轮询">
          <el-switch v-model="enablePolling" @change="restartPolling" />
        </el-form-item>

        <el-form-item label="轮询间隔">
          <el-select v-model="pollingInterval" style="width: 140px" @change="restartPolling">
            <el-option :value="1000" label="1 秒" />
            <el-option :value="2000" label="2 秒" />
            <el-option :value="3000" label="3 秒" />
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="networkErrorMessage" class="network-tip">
        当前网络或代理连接有波动：{{ networkErrorMessage }}。系统会自动重试，并使用轮询兜底。
      </div>

      <div class="status-banner" :class="`banner-${bannerClass}`">
        <div class="status-banner-title">{{ monitorState.monitorMessage || '请先选择监测站点' }}</div>
        <div class="status-banner-desc">{{ monitorState.monitorHint || '当前页面会根据任务状态、设备状态和数据新鲜度自动给出提示。' }}</div>
        <div class="status-chip-group">
          <el-tag effect="plain" :type="monitorState.deviceRunStatus === 1 ? 'success' : 'info'">
            设备状态：{{ monitorState.deviceRunStatus === 1 ? '开启' : '停止' }}
          </el-tag>
          <el-tag effect="plain" :type="monitorState.stationOnlineStatus === 1 ? 'success' : 'danger'">
            站点状态：{{ monitorState.stationOnlineStatus === 1 ? '在线' : '离线' }}
          </el-tag>
          <el-tag effect="plain" :type="freshnessTagType">
            数据新鲜度：{{ freshnessText }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" class="monitor-content-row">
      <el-col :span="16" class="equal-height-col">
        <el-card class="page-card equal-height-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">无线电频谱实时监测曲线</div>
                <div class="header-subtitle">{{ chartSubtitle }}</div>
              </div>
              <div class="header-actions">
                <el-tag effect="plain">{{ currentStationName || '未选择站点' }}</el-tag>
                <el-tag effect="plain" type="success">{{ monitorState.taskName || '未绑定任务' }}</el-tag>
                <el-tag effect="plain" type="info">{{ formatTime(monitorState.captureTime) }}</el-tag>
              </div>
            </div>
          </template>

          <div class="chart-panel">
            <div v-show="monitorState.monitorReady === 1" ref="lineChartRef" class="chart-box"></div>

            <div v-if="monitorState.monitorReady !== 1" class="chart-empty">
              <div class="chart-empty-title">{{ monitorState.monitorMessage || '暂无实时数据' }}</div>
              <div class="chart-empty-desc">{{ monitorState.monitorHint || '请先检查任务和设备状态。' }}</div>
              <div class="chart-empty-actions">
                <el-button type="primary" @click="manualRefresh">重新检查状态</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8" class="equal-height-col">
        <el-card class="page-card equal-height-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">监测链路状态</div>
                <div class="header-subtitle">任务 → 设备 → 数据 → AI 结果</div>
              </div>
            </div>
          </template>

          <div class="status-list">
            <div class="status-item">
              <span class="status-label">任务名称</span>
              <span class="status-value">{{ monitorState.taskName || '-' }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">设备名称</span>
              <span class="status-value">{{ monitorState.deviceName || '-' }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">任务数量</span>
              <span class="status-value">{{ monitorState.activeTaskCount || 0 }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">最新采集时间</span>
              <span class="status-value">{{ formatTime(monitorState.captureTime) }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">中心频率</span>
              <span class="status-value">{{ formatNumber(monitorState.centerFreqMhz, 'MHz') }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">带宽</span>
              <span class="status-value">{{ formatNumber(monitorState.bandwidthKhz, 'kHz') }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">信号制式</span>
              <span class="status-value">{{ monitorState.signalType || '-' }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">峰值功率</span>
              <span class="status-value">{{ formatNumber(monitorState.peakPowerDbm, 'dBm') }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">SNR</span>
              <span class="status-value">{{ formatNumber(monitorState.snrDb, 'dB') }}</span>
            </div>
          </div>

          <div class="ai-panel">
            <div class="ai-title">AI 识别信息</div>
            <div class="ai-grid">
              <div class="ai-card">
                <div class="ai-card-label">识别标签</div>
                <div class="ai-card-value">{{ monitorState.aiLabel || '-' }}</div>
              </div>
              <div class="ai-card">
                <div class="ai-card-label">请求模式</div>
                <div class="ai-card-value">{{ monitorState.aiRequestMode || '-' }}</div>
              </div>
              <div class="ai-card">
                <div class="ai-card-label">实际模式</div>
                <div class="ai-card-value">{{ monitorState.aiActualMode || '-' }}</div>
              </div>
              <div class="ai-card">
                <div class="ai-card-label">模型名称</div>
                <div class="ai-card-value">{{ monitorState.aiModelName || '-' }}</div>
              </div>
            </div>

            <div class="ai-reason">
              <div class="ai-reason-label">AI 说明</div>
              <div class="ai-reason-text">{{ monitorState.aiReason || '当前暂无 AI 解释信息。' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getRealtimeLatestApi, getStationListApi } from '../../api/overview'
import { getToken } from '../../utils/auth'

const lineChartRef = ref(null)
const stationOptions = ref([])
const wsConnected = ref(false)
const enablePolling = ref(true)
const pollingInterval = ref(1000)
const networkErrorMessage = ref('')

const queryForm = reactive({
  stationId: ''
})

const createDefaultState = () => ({
  id: null,
  stationId: null,
  stationName: '',
  deviceId: null,
  deviceName: '',
  taskId: null,
  taskName: '',
  centerFreqMhz: null,
  bandwidthKhz: null,
  signalType: '',
  channelModel: '',
  peakPowerDbm: null,
  snrDb: null,
  aiLabel: '',
  aiRequestMode: '',
  aiActualMode: '',
  aiModelName: '',
  aiReason: '',
  powerPointsJson: '[]',
  captureTime: '',
  stationOnlineStatus: 0,
  deviceRunStatus: 0,
  activeTaskCount: 0,
  hasSnapshot: 0,
  dataDelaySeconds: null,
  dataFreshness: 'NONE',
  monitorStage: 'WAIT_SELECT',
  monitorReady: 0,
  monitorMessage: '请先选择监测站点',
  monitorHint: '当前页面会根据任务状态、设备状态和数据新鲜度自动给出提示。'
})

const monitorState = reactive(createDefaultState())

let chartInstance = null
let pollingTimer = null
let socket = null
let wsSessionId = 0
let reconnectTimer = null

const currentStationName = computed(() => {
  const id = Number(queryForm.stationId || 0)
  const item = stationOptions.value.find(row => Number(row.id) === id)
  return item?.stationName || monitorState.stationName || ''
})

const freshnessDelayText = computed(() => {
  if (monitorState.dataDelaySeconds === null || monitorState.dataDelaySeconds === undefined) {
    return '-'
  }
  return `${monitorState.dataDelaySeconds}s`
})

const freshnessText = computed(() => {
  switch (monitorState.dataFreshness) {
    case 'FRESH':
      return '实时数据'
    case 'DELAYED':
      return '延迟数据'
    case 'EXPIRED':
      return '过期数据'
    default:
      return '暂无数据'
  }
})

const freshnessTagType = computed(() => {
  switch (monitorState.dataFreshness) {
    case 'FRESH':
      return 'success'
    case 'DELAYED':
      return 'warning'
    case 'EXPIRED':
      return 'danger'
    default:
      return 'info'
  }
})

const connectionStatusText = computed(() => {
  if (networkErrorMessage.value) return '网络异常'
  if (wsConnected.value) return 'WS在线'
  return '轮询兜底'
})

const connectionStatusDesc = computed(() => {
  if (networkErrorMessage.value) {
    return '自动重连中'
  }
  return monitorState.monitorReady === 1 ? '实时链路正常' : '按状态自动提示'
})

const statusBannerTagType = computed(() => {
  if (monitorState.monitorReady === 1) return 'success'
  if (monitorState.monitorStage === 'DATA_DELAYED') return 'warning'
  if (monitorState.monitorStage === 'DATA_EXPIRED') return 'danger'
  return 'info'
})

const statusBannerTagText = computed(() => {
  switch (monitorState.monitorStage) {
    case 'READY':
      return '实时监测中'
    case 'NO_RUNNING_TASK':
      return '未启动任务'
    case 'WAITING_DATA':
      return '等待首帧数据'
    case 'DATA_DELAYED':
      return '数据延迟'
    case 'DATA_EXPIRED':
      return '数据过期'
    default:
      return '待选择站点'
  }
})

const bannerClass = computed(() => {
  switch (monitorState.monitorStage) {
    case 'READY':
      return 'success'
    case 'DATA_DELAYED':
      return 'warning'
    case 'DATA_EXPIRED':
      return 'danger'
    default:
      return 'info'
  }
})

const chartSubtitle = computed(() => {
  if (monitorState.monitorReady === 1) {
    return '当前任务运行正常，图表仅在实时数据新鲜时刷新'
  }
  return '未满足实时监测条件时，不再继续展示旧图，避免误判为“假实时”'
})

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatNumber = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) {
    return suffix ? `${value} ${suffix}` : String(value)
  }
  return suffix ? `${num} ${suffix}` : String(num)
}

const parsePoints = (value) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(item => Number(item)).filter(item => !Number.isNaN(item))
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.map(item => Number(item)).filter(item => !Number.isNaN(item))
      : []
  } catch (error) {
    return []
  }
}

const buildXAxis = (points, centerFreqMhz, bandwidthKhz) => {
  if (!points.length) return []
  const center = Number(centerFreqMhz)
  const bandwidth = Number(bandwidthKhz)
  if (Number.isNaN(center) || Number.isNaN(bandwidth) || bandwidth <= 0) {
    return points.map((_, index) => index + 1)
  }

  const start = center - bandwidth / 2000
  const step = (bandwidth / 1000) / Math.max(points.length - 1, 1)
  return points.map((_, index) => Number((start + index * step).toFixed(3)))
}

const ensureChart = () => {
  if (!lineChartRef.value) return null
  if (!chartInstance) {
    chartInstance = echarts.init(lineChartRef.value)
  }
  return chartInstance
}

const renderChart = async () => {
  await nextTick()
  const chart = ensureChart()
  if (!chart) return

  const points = parsePoints(monitorState.powerPointsJson)
  const xAxis = buildXAxis(points, monitorState.centerFreqMhz, monitorState.bandwidthKhz)

  chart.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: 56,
      right: 24,
      top: 32,
      bottom: 60
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis,
      name: points.length ? '频率 / MHz' : '',
      nameLocation: 'middle',
      nameGap: 36
    },
    yAxis: {
      type: 'value',
      name: '功率 / dBm'
    },
    series: [
      {
        name: '实时频谱',
        type: 'line',
        smooth: 0.2,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#2563eb'
        },
        areaStyle: {
          color: 'rgba(37, 99, 235, 0.12)'
        },
        data: points
      }
    ]
  })

  chart.resize()
}

const resetMonitorState = () => {
  Object.assign(monitorState, createDefaultState())
}

const applyState = async (raw) => {
  if (!raw) {
    resetMonitorState()
    return
  }

  Object.assign(monitorState, createDefaultState(), raw)

  if (monitorState.monitorReady === 1) {
    await renderChart()
  } else if (chartInstance) {
    chartInstance.clear()
    await nextTick()
    chartInstance.resize()
  }
}

const getReadableErrorText = (error) => {
  if (!error) return '未知错误'
  return error?.message || error?.msg || '网络请求失败'
}

const loadLatestSpectrum = async ({ silent = false } = {}) => {
  if (!queryForm.stationId) {
    resetMonitorState()
    return
  }

  try {
    const res = await getRealtimeLatestApi({
      stationId: queryForm.stationId
    })
    await applyState(res?.data || null)
    networkErrorMessage.value = ''
  } catch (error) {
    networkErrorMessage.value = getReadableErrorText(error)
    if (!silent) {
      ElMessage.warning(`实时监测状态刷新失败：${networkErrorMessage.value}`)
    }
  }
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const restartPolling = () => {
  stopPolling()
  if (!enablePolling.value || !queryForm.stationId) return
  pollingTimer = setInterval(() => {
    loadLatestSpectrum({ silent: true })
  }, Number(pollingInterval.value || 1000))
}

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

const disconnectWs = () => {
  clearReconnectTimer()
  if (socket) {
    try {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null

      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'station changed')
      } else if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        // ignore
      }
    } catch (error) {
      // ignore
    }
    socket = null
  }
  wsConnected.value = false
}

const scheduleReconnect = (sessionId) => {
  clearReconnectTimer()
  reconnectTimer = setTimeout(() => {
    if (sessionId !== wsSessionId) return
    connectWs()
  }, 1800)
}

const connectWs = () => {
  disconnectWs()

  if (!queryForm.stationId) return

  const token = getToken()
  if (!token) {
    networkErrorMessage.value = '缺少登录令牌，无法建立实时连接'
    return
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const hostname = window.location.hostname || '127.0.0.1'
  const port = window.location.port
  const devPorts = ['3000', '5173', '4173']
  const wsPort = devPorts.includes(port) ? '9000' : port
  const wsUrl = `${protocol}://${hostname}${wsPort ? `:${wsPort}` : ''}/ws/monitor/${queryForm.stationId}?token=${encodeURIComponent(token)}`
  const sessionId = Date.now()
  wsSessionId = sessionId

  try {
    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      if (sessionId !== wsSessionId) return
      wsConnected.value = true
      networkErrorMessage.value = ''
    }

    socket.onmessage = async (event) => {
      if (sessionId !== wsSessionId) return

      try {
        const payload = JSON.parse(event.data || '{}')
        if (payload?.type === 'realtime') {
          await applyState(payload.data || null)
        }
      } catch (error) {
        console.error('解析实时推送失败', error)
      }
    }

    socket.onerror = () => {
      if (sessionId !== wsSessionId) return
      wsConnected.value = false
      networkErrorMessage.value = 'WebSocket 连接异常，已自动切回轮询'
    }

    socket.onclose = () => {
      if (sessionId !== wsSessionId) return
      wsConnected.value = false
      scheduleReconnect(sessionId)
    }
  } catch (error) {
    wsConnected.value = false
    networkErrorMessage.value = getReadableErrorText(error)
    scheduleReconnect(sessionId)
  }
}

const handleStationChange = async () => {
  disconnectWs()
  await loadLatestSpectrum()
  connectWs()
  restartPolling()
}

const manualRefresh = async () => {
  await loadLatestSpectrum()
  if (socket && wsConnected.value) {
    try {
      socket.send('refresh')
    } catch (error) {
      console.error(error)
    }
  } else {
    connectWs()
  }
}

const loadStations = async () => {
  try {
    const res = await getStationListApi()
    stationOptions.value = res?.data || []

    if (!queryForm.stationId && stationOptions.value.length > 0) {
      queryForm.stationId = stationOptions.value[0].id
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '站点列表加载失败')
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

const handleTaskRuntimeLinkage = async (event) => {
  const detail = event?.detail || {}
  if (!queryForm.stationId) return
  if (detail.stationId && Number(detail.stationId) !== Number(queryForm.stationId)) return

  await loadLatestSpectrum({ silent: true })
  connectWs()
  restartPolling()
}

onMounted(async () => {
  await loadStations()
  await loadLatestSpectrum({ silent: true })
  connectWs()
  restartPolling()

  window.addEventListener('resize', handleResize)
  window.addEventListener('radio-task-status-changed', handleTaskRuntimeLinkage)
  window.addEventListener('task-device-linkage-changed', handleTaskRuntimeLinkage)
})

onUnmounted(() => {
  stopPolling()
  disconnectWs()
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('radio-task-status-changed', handleTaskRuntimeLinkage)
  window.removeEventListener('task-device-linkage-changed', handleTaskRuntimeLinkage)

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

.top-metrics,
.query-card {
  margin-bottom: 16px;
}

.metric-card {
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -16px;
  bottom: -16px;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
}

.metric-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
}

.metric-desc {
  margin-top: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
}

.metric-blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
.metric-cyan { background: linear-gradient(135deg, #06b6d4, #22d3ee); }
.metric-green { background: linear-gradient(135deg, #16a34a, #4ade80); }
.metric-orange { background: linear-gradient(135deg, #f59e0b, #fbbf24); }

.page-card,
.equal-height-card {
  border-radius: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-form {
  margin-bottom: 6px;
}

.network-tip {
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 13px;
}

.status-banner {
  margin-top: 8px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.banner-success {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}

.banner-warning {
  background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
  border-color: #fde68a;
}

.banner-danger {
  background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
  border-color: #fecaca;
}

.banner-info {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border-color: #dbeafe;
}

.status-banner-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.status-banner-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.8;
  color: #64748b;
}

.status-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.monitor-content-row {
  display: flex;
  align-items: stretch;
}

.monitor-content-row > .el-col {
  display: flex;
}

.equal-height-col {
  display: flex;
  align-self: stretch;
}

.equal-height-card {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.equal-height-card :deep(.el-card__header) {
  flex-shrink: 0;
}

.equal-height-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-box {
  flex: 1;
  min-height: 420px;
  height: 100%;
}

.chart-empty {
  flex: 1;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  border: 1px dashed #dbeafe;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.chart-empty-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.chart-empty-desc {
  max-width: 520px;
  font-size: 14px;
  line-height: 1.9;
  color: #64748b;
}

.status-list {
  display: grid;
  gap: 10px;
}

.equal-height-card :deep(.el-card__body) .status-list,
.equal-height-card :deep(.el-card__body) .ai-panel {
  flex-shrink: 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 12px;
}

.status-label {
  color: #64748b;
  font-size: 13px;
}

.status-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

.ai-panel {
  margin-top: 16px;
}

.ai-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.ai-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.ai-card {
  padding: 14px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e5eefb;
}

.ai-card-label {
  font-size: 12px;
  color: #64748b;
}

.ai-card-value {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  word-break: break-all;
}

.ai-reason {
  margin-top: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  background: #f8fafc;
}

.ai-reason-label {
  font-size: 12px;
  color: #64748b;
}

.ai-reason-text {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1200px) {
  .monitor-content-row {
    display: block;
  }

  .ai-grid {
    grid-template-columns: 1fr;
  }
}
</style>