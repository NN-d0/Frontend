<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前站点</div>
          <div class="metric-number metric-text">{{ currentStationName || '-' }}</div>
          <div class="metric-desc">实时监测所在站点</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">信号制式</div>
          <div class="metric-number metric-text">{{ latestSnapshot.signalType || '-' }}</div>
          <div class="metric-desc">最近一次识别结果</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">峰值功率</div>
          <div class="metric-number">{{ latestSnapshot.peakPowerDbm ?? '-' }}</div>
          <div class="metric-desc">单位 dBm</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">连接状态</div>
          <div class="metric-number metric-text">{{ connectionStatusText }}</div>
          <div class="metric-desc">{{ connectionStatusDesc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">实时监测参数</div>
            <div class="header-subtitle">优先 WebSocket，失败时自动使用实时接口轮询兜底</div>
          </div>
          <div class="header-actions">
            <el-tag :type="connectionTagType">
              {{ connectionStatusText }}
            </el-tag>
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
            <el-option :value="2000" label="2 秒" />
            <el-option :value="3000" label="3 秒" />
            <el-option :value="5000" label="5 秒" />
          </el-select>
        </el-form-item>
      </el-form>

      <div v-if="networkErrorMessage" class="network-tip">
        当前网络或代理连接有波动：{{ networkErrorMessage }}。系统会自动重试，你也可以点击“手动刷新”。
      </div>
    </el-card>

    <el-row :gutter="16" class="monitor-content-row">
      <el-col :span="17" class="equal-height-col">
        <el-card class="page-card equal-height-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">实时频谱折线图</div>
                <div class="header-subtitle">使用标准实时接口字段进行展示</div>
              </div>
              <div class="chart-tags">
                <el-tag type="primary" effect="plain">渐变面积</el-tag>
                <el-tag type="success" effect="plain">峰值标记</el-tag>
                <el-tag type="warning" effect="plain">缩放条</el-tag>
              </div>
            </div>
          </template>

          <div ref="chartRef" class="chart-box big-chart"></div>
        </el-card>
      </el-col>

      <el-col :span="7" class="equal-height-col">
        <el-card class="page-card equal-height-card realtime-params-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">实时参数</div>
                <div class="header-subtitle">最近一次监测快照详情</div>
              </div>
            </div>
          </template>

          <div class="params-content">
            <el-descriptions class="params-descriptions" :column="1" border>
              <el-descriptions-item label="站点名称">{{ currentStationName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{ latestSnapshot.deviceName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="任务名称">{{ latestSnapshot.taskName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="信号制式">{{ latestSnapshot.signalType || '-' }}</el-descriptions-item>
              <el-descriptions-item label="AI识别">{{ latestSnapshot.aiLabel || '-' }}</el-descriptions-item>
              <el-descriptions-item label="中心频率">{{ latestSnapshot.centerFreqMhz ?? '-' }} MHz</el-descriptions-item>
              <el-descriptions-item label="带宽">{{ latestSnapshot.bandwidthKhz ?? '-' }} kHz</el-descriptions-item>
              <el-descriptions-item label="峰值功率">{{ latestSnapshot.peakPowerDbm ?? '-' }} dBm</el-descriptions-item>
              <el-descriptions-item label="SNR">{{ latestSnapshot.snrDb ?? '-' }} dB</el-descriptions-item>
              <el-descriptions-item label="采集时间">{{ formatTime(latestSnapshot.captureTime) }}</el-descriptions-item>
            </el-descriptions>
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

const stationOptions = ref([])
const chartRef = ref(null)
const wsConnected = ref(false)
const enablePolling = ref(true)
const pollingInterval = ref(3000)
const networkErrorMessage = ref('')

const queryForm = reactive({
  stationId: ''
})

const createDefaultSnapshot = () => ({
  stationId: '',
  stationName: '',
  deviceName: '',
  taskName: '',
  signalType: '',
  aiLabel: '',
  centerFreqMhz: null,
  bandwidthKhz: null,
  peakPowerDbm: null,
  snrDb: null,
  captureTime: '',
  powerPointsJson: '[]'
})

const latestSnapshot = reactive(createDefaultSnapshot())

let chartInstance = null
let pollingTimer = null
let socket = null
let wsSessionId = 0
let networkWarnShown = false

const normalizeId = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? String(value) : numberValue
}

const currentStationName = computed(() => {
  const currentId = normalizeId(queryForm.stationId)
  const match = stationOptions.value.find(item => normalizeId(item.id) === currentId)
  return match?.stationName || latestSnapshot.stationName || ''
})

const connectionStatusText = computed(() => {
  if (networkErrorMessage.value) return '网络异常'
  if (wsConnected.value) return 'WS在线'
  return '轮询兜底'
})

const connectionStatusDesc = computed(() => {
  if (networkErrorMessage.value) return '网络波动中，系统自动重试'
  return formatTime(latestSnapshot.captureTime)
})

const connectionTagType = computed(() => {
  if (networkErrorMessage.value) return 'danger'
  if (wsConnected.value) return 'success'
  return 'warning'
})

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const parsePoints = (value) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(item => Number(item))
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(item => Number(item)) : []
  } catch (error) {
    return []
  }
}

const buildXAxis = (points, centerFreqMhz, bandwidthKhz) => {
  if (!points.length) return []

  const center = Number(centerFreqMhz)
  const bwKhz = Number(bandwidthKhz)

  if (Number.isNaN(center) || Number.isNaN(bwKhz) || bwKhz <= 0) {
    return points.map((_, index) => index + 1)
  }

  const start = center - bwKhz / 2000
  const step = (bwKhz / 1000) / Math.max(points.length - 1, 1)

  return points.map((_, index) => Number((start + step * index).toFixed(3)))
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const points = parsePoints(latestSnapshot.powerPointsJson)
  const xData = buildXAxis(points, latestSnapshot.centerFreqMhz, latestSnapshot.bandwidthKhz)
  const avgValue = points.length
    ? Number((points.reduce((sum, item) => sum + Number(item || 0), 0) / points.length).toFixed(2))
    : 0

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 500,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(96, 165, 250, 0.35)',
      borderWidth: 1,
      textStyle: {
        color: '#e5eefc'
      },
      formatter: (params) => {
        const item = params?.[0]
        if (!item) return ''
        return `
          <div style="padding:4px 2px;">
            <div style="font-weight:700;margin-bottom:6px;">实时频谱点</div>
            <div>频率：${item.axisValue}</div>
            <div>功率：${item.data} dBm</div>
          </div>
        `
      }
    },
    grid: {
      left: 55,
      right: 28,
      top: 36,
      bottom: 68
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      name: points.length ? '频率 / 采样点' : '',
      nameTextStyle: {
        color: '#7c8aa5'
      },
      axisLine: {
        lineStyle: {
          color: '#d7e3f2'
        }
      },
      axisLabel: {
        color: '#73839d',
        showMaxLabel: true,
        showMinLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '功率 (dBm)',
      nameTextStyle: {
        color: '#7c8aa5'
      },
      axisLabel: {
        color: '#73839d'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.18)',
          type: 'dashed'
        }
      }
    },
    dataZoom: [
      { type: 'inside' },
      {
        type: 'slider',
        height: 18,
        bottom: 18,
        borderColor: 'transparent',
        backgroundColor: '#eef4fb',
        fillerColor: 'rgba(59,130,246,0.18)',
        moveHandleSize: 0
      }
    ],
    series: [
      {
        name: '实时频谱',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 3,
          color: '#2563eb'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.42)' },
            { offset: 0.7, color: 'rgba(59, 130, 246, 0.12)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        },
        markPoint: points.length
          ? {
              symbol: 'circle',
              symbolSize: 44,
              itemStyle: { color: '#16a34a' },
              label: {
                color: '#fff',
                fontWeight: 700,
                formatter: '峰'
              },
              data: [{ type: 'max', name: '峰值' }]
            }
          : undefined,
        markLine: points.length
          ? {
              silent: true,
              symbol: 'none',
              lineStyle: {
                color: '#f59e0b',
                type: 'dashed'
              },
              label: {
                color: '#b45309',
                formatter: `均值 ${avgValue}`
              },
              data: [{ yAxis: avgValue }]
            }
          : undefined,
        data: points
      }
    ]
  })
}

const clearNetworkError = () => {
  networkErrorMessage.value = ''
  networkWarnShown = false
}

const resetSnapshot = async () => {
  Object.assign(latestSnapshot, createDefaultSnapshot())
  await nextTick()
  renderChart()
}

const getReadableErrorText = (error) => {
  const msg = String(error?.message || '')
  if (!msg) return '未知异常'
  if (msg.includes('Network Error')) return '网络连接异常'
  if (msg.includes('ERR_NETWORK_CHANGED')) return '网络环境发生切换'
  return msg
}

const applySnapshot = async (raw) => {
  if (!raw) {
    await resetSnapshot()
    return
  }

  latestSnapshot.stationId = raw.stationId ?? ''
  latestSnapshot.stationName = raw.stationName ?? ''
  latestSnapshot.deviceName = raw.deviceName ?? ''
  latestSnapshot.taskName = raw.taskName ?? ''
  latestSnapshot.signalType = raw.signalType ?? ''
  latestSnapshot.aiLabel = raw.aiLabel ?? ''
  latestSnapshot.centerFreqMhz = raw.centerFreqMhz ?? null
  latestSnapshot.bandwidthKhz = raw.bandwidthKhz ?? null
  latestSnapshot.peakPowerDbm = raw.peakPowerDbm ?? null
  latestSnapshot.snrDb = raw.snrDb ?? null
  latestSnapshot.captureTime = raw.captureTime ?? ''
  latestSnapshot.powerPointsJson = raw.powerPointsJson ?? '[]'

  clearNetworkError()
  await nextTick()
  renderChart()
}

const loadLatestSpectrum = async ({ silent = false } = {}) => {
  if (!queryForm.stationId) {
    await resetSnapshot()
    return
  }

  try {
    const res = await getRealtimeLatestApi({
      stationId: queryForm.stationId
    })

    const snapshot = res?.data || null
    await applySnapshot(snapshot)
  } catch (error) {
    networkErrorMessage.value = getReadableErrorText(error)

    if (!silent) {
      ElMessage.warning(`实时频谱刷新失败：${networkErrorMessage.value}`)
    } else if (!networkWarnShown) {
      networkWarnShown = true
      ElMessage.warning('实时频谱轮询出现网络波动，系统将自动重试')
    }
  }
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const startPolling = () => {
  stopPolling()

  if (!enablePolling.value || !queryForm.stationId) return

  pollingTimer = setInterval(async () => {
    if (document.hidden) return
    await loadLatestSpectrum({ silent: true })
  }, Number(pollingInterval.value))
}

const restartPolling = () => {
  startPolling()
}

const resolveWsBaseUrl = () => {
  const envBase = import.meta.env.VITE_WS_BASE_URL
  if (envBase) {
    return String(envBase).replace(/\/$/, '')
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const hostname = window.location.hostname || 'localhost'

  return `${protocol}://${hostname}:9000`
}

const disconnectWs = () => {
  wsConnected.value = false

  if (!socket) return

  const currentSocket = socket
  socket = null

  currentSocket.onopen = null
  currentSocket.onmessage = null
  currentSocket.onerror = null
  currentSocket.onclose = null

  if (
    currentSocket.readyState === WebSocket.OPEN ||
    currentSocket.readyState === WebSocket.CONNECTING
  ) {
    currentSocket.close()
  }
}

const connectWs = () => {
  disconnectWs()

  if (!queryForm.stationId) return

  const currentSession = ++wsSessionId
  const wsBaseUrl = resolveWsBaseUrl()
  const wsUrl = `${wsBaseUrl}/ws/monitor/${queryForm.stationId}`

  try {
    const currentSocket = new WebSocket(wsUrl)
    socket = currentSocket

    currentSocket.onopen = () => {
      if (currentSession !== wsSessionId) return
      wsConnected.value = true
      clearNetworkError()
    }

    currentSocket.onmessage = async (event) => {
      if (currentSession !== wsSessionId) return

      try {
        const message = JSON.parse(event.data)
        await applySnapshot(message?.data || message)
      } catch (error) {
        console.error('实时频谱 WS 消息解析失败：', error)
      }
    }

    currentSocket.onerror = () => {
      if (currentSession !== wsSessionId) return
      wsConnected.value = false
    }

    currentSocket.onclose = () => {
      if (currentSession !== wsSessionId) return
      wsConnected.value = false
    }
  } catch (error) {
    wsConnected.value = false
    console.error('实时频谱 WS 连接失败：', error)
  }
}

const handleStationChange = async () => {
  if (!queryForm.stationId) {
    disconnectWs()
    stopPolling()
    await resetSnapshot()
    return
  }

  await loadLatestSpectrum({ silent: true })
  connectWs()
  startPolling()
}

const manualRefresh = async () => {
  await loadLatestSpectrum({ silent: false })
}

const loadStations = async () => {
  const res = await getStationListApi()
  stationOptions.value = res?.data || []

  if (!queryForm.stationId && stationOptions.value.length > 0) {
    queryForm.stationId = stationOptions.value[0].id
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

const handleOnline = async () => {
  clearNetworkError()
  connectWs()
  startPolling()
  await loadLatestSpectrum({ silent: true })
}

const handleVisibilityChange = async () => {
  if (!document.hidden) {
    await loadLatestSpectrum({ silent: true })
  }
}

onMounted(async () => {
  await loadStations()
  await loadLatestSpectrum({ silent: true })
  connectWs()
  startPolling()

  window.addEventListener('resize', handleResize)
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  disconnectWs()

  window.removeEventListener('resize', handleResize)
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.top-metrics {
  margin-bottom: 16px;
}

.metric-card {
  border-radius: 20px;
  overflow: hidden;
}

.metric-label {
  font-size: 14px;
  color: #8a97ab;
  font-weight: 600;
}

.metric-number {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 800;
  color: #1f2a37;
}

.metric-number.metric-text {
  font-size: 24px;
}

.metric-desc {
  margin-top: 10px;
  font-size: 13px;
  color: #8a97ab;
}

.metric-blue::before,
.metric-cyan::before,
.metric-green::before,
.metric-orange::before {
  content: '';
  display: block;
  height: 4px;
  margin: -18px -22px 16px;
}

.metric-blue::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.metric-cyan::before {
  background: linear-gradient(90deg, #06b6d4, #67e8f9);
}

.metric-green::before {
  background: linear-gradient(90deg, #22c55e, #86efac);
}

.metric-orange::before {
  background: linear-gradient(90deg, #f59e0b, #fcd34d);
}

.header-title {
  font-size: 17px;
  font-weight: 800;
  color: #1f2a37;
}

.header-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #8a97ab;
}

.header-actions,
.chart-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.network-tip {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #c2410c;
  font-size: 13px;
}

.monitor-content-row {
  margin-top: 16px;
}

.equal-height-col {
  display: flex;
}

.equal-height-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.equal-height-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.realtime-params-card {
  min-height: 0;
}

.params-content {
  flex: 1;
  min-height: 0;
  display: flex;
}

.params-descriptions {
  width: 100%;
  height: 100%;
}

.params-descriptions :deep(.el-descriptions__body),
.params-descriptions :deep(.el-descriptions__table),
.params-descriptions :deep(tbody) {
  width: 100%;
  height: 100%;
}

.params-descriptions :deep(.el-descriptions__row) {
  height: calc(100% / 10);
}

.params-descriptions :deep(th),
.params-descriptions :deep(td) {
  vertical-align: middle;
}

.big-chart {
  height: 520px;
}
</style>