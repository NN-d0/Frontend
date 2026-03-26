<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前站点</div>
          <div class="metric-value ellipsis">{{ currentStationName || '-' }}</div>
          <div class="metric-desc">当前实时监测所在站点</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">信号制式</div>
          <div class="metric-value">{{ latestSnapshot.signalType || '-' }}</div>
          <div class="metric-desc">最近一帧识别结果</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">峰值功率</div>
          <div class="metric-value">{{ formatNumber(latestSnapshot.peakPowerDbm) }}</div>
          <div class="metric-desc">单位 dBm</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">连接状态</div>
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
            <div class="header-subtitle">WebSocket 优先推送，断开后自动重连，并使用轮询兜底</div>
          </div>
          <div class="header-actions">
            <el-tag :type="connectionTagType">{{ connectionStatusText }}</el-tag>
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
        当前网络或代理连接有波动：{{ networkErrorMessage }}。系统会自动重试，你也可以点击“手动刷新”。
      </div>
    </el-card>

    <el-row :gutter="16" class="monitor-content-row">
      <el-col :span="17" class="equal-height-col">
        <el-card class="page-card spectrum-card equal-height-card" shadow="hover">
          <template #header>
            <div class="card-header chart-header">
              <div>
                <div class="header-title">无线电频谱实时监测曲线</div>
                <div class="header-subtitle">主线 + 柔和包络线 + 峰值呼吸点，实时更新更顺滑</div>
              </div>

              <div class="chart-top-stats">
                <div class="stat-pill">
                  <span class="stat-pill-label">采样点数</span>
                  <span class="stat-pill-value">{{ statPointCount }}</span>
                </div>
                <div class="stat-pill">
                  <span class="stat-pill-label">平均功率</span>
                  <span class="stat-pill-value">{{ statAvgPowerText }}</span>
                </div>
                <div class="stat-pill">
                  <span class="stat-pill-label">峰值点位</span>
                  <span class="stat-pill-value">{{ statPeakPointText }}</span>
                </div>
              </div>
            </div>
          </template>

          <div class="chart-toolbar">
            <div class="toolbar-left">
              <el-tag effect="plain">{{ currentStationName || '未选择站点' }}</el-tag>
              <el-tag effect="plain" type="success">{{ latestSnapshot.taskName || '未绑定任务' }}</el-tag>
              <el-tag effect="plain" type="info">{{ formatTime(latestSnapshot.captureTime) }}</el-tag>
              <el-tag :type="signalQualityTagType">{{ signalQualityText }}</el-tag>
            </div>

            <div class="toolbar-right">
              <el-switch
                v-model="enableCurveSmoothing"
                inline-prompt
                active-text="平滑"
                inactive-text="直线"
                @change="renderLineChart"
              />
              <el-select v-model="transitionDuration" style="width: 130px" @change="applyTransitionDuration">
                <el-option :value="220" label="过渡 0.22s" />
                <el-option :value="320" label="过渡 0.32s" />
                <el-option :value="420" label="过渡 0.42s" />
              </el-select>
            </div>
          </div>

          <div class="chart-shell">
            <div ref="lineChartRef" class="line-chart"></div>

            <div v-if="statPointCount === 0" class="chart-empty-mask">
              <div class="chart-empty-title">暂无实时频谱数据</div>
              <div class="chart-empty-desc">请选择站点并确认仿真器正在持续上报数据</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="7" class="equal-height-col">
        <div class="side-panel-stack">
          <el-card class="page-card side-panel-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div>
                  <div class="header-title">AI 推理状态</div>
                  <div class="header-subtitle">当前帧模型使用情况</div>
                </div>
              </div>
            </template>

            <div class="ai-status-grid">
              <div class="ai-status-item">
                <div class="ai-status-label">请求模式</div>
                <div class="ai-status-value">{{ latestSnapshot.aiRequestMode || '-' }}</div>
              </div>
              <div class="ai-status-item">
                <div class="ai-status-label">实际推理</div>
                <div class="ai-status-value">{{ latestSnapshot.aiActualMode || '-' }}</div>
              </div>
              <div class="ai-status-item">
                <div class="ai-status-label">Fallback</div>
                <div class="ai-status-value">
                  <el-tag :type="Number(latestSnapshot.aiFallbackUsed || 0) === 1 ? 'danger' : 'success'">
                    {{ latestSnapshot.aiFallbackUsedText }}
                  </el-tag>
                </div>
              </div>
              <div class="ai-status-item">
                <div class="ai-status-label">模型名称</div>
                <div class="ai-status-value">{{ latestSnapshot.aiModelName || '-' }}</div>
              </div>
            </div>

            <div class="ai-reason-box">
              <div class="reason-title">AI 说明</div>
              <div class="reason-content">{{ latestSnapshot.aiReason || '当前暂无 AI 解释信息' }}</div>
            </div>
          </el-card>

          <el-card class="page-card side-panel-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div>
                  <div class="header-title">实时参数</div>
                  <div class="header-subtitle">最近一次监测快照详情</div>
                </div>
              </div>
            </template>

            <div class="params-panel">
              <div class="param-row">
                <span class="param-label">设备名称</span>
                <span class="param-value">{{ latestSnapshot.deviceName || '-' }}</span>
              </div>
              <div class="param-row">
                <span class="param-label">任务名称</span>
                <span class="param-value">{{ latestSnapshot.taskName || '-' }}</span>
              </div>
              <div class="param-row">
                <span class="param-label">AI识别</span>
                <span class="param-value">{{ latestSnapshot.aiLabel || '-' }}</span>
              </div>
              <div class="param-row">
                <span class="param-label">中心频率</span>
                <span class="param-value">{{ formatNumber(latestSnapshot.centerFreqMhz) }} MHz</span>
              </div>
              <div class="param-row">
                <span class="param-label">带宽</span>
                <span class="param-value">{{ formatNumber(latestSnapshot.bandwidthKhz) }} kHz</span>
              </div>
              <div class="param-row">
                <span class="param-label">峰值功率</span>
                <span class="param-value">{{ formatNumber(latestSnapshot.peakPowerDbm) }} dBm</span>
              </div>
              <div class="param-row">
                <span class="param-label">平均功率</span>
                <span class="param-value">{{ statAvgPowerText }}</span>
              </div>
              <div class="param-row">
                <span class="param-label">SNR</span>
                <span class="param-value">{{ formatNumber(latestSnapshot.snrDb) }} dB</span>
              </div>
              <div class="param-row">
                <span class="param-label">信道模型</span>
                <span class="param-value">{{ latestSnapshot.channelModel || '-' }}</span>
              </div>
              <div class="param-row">
                <span class="param-label">采集时间</span>
                <span class="param-value">{{ formatTime(latestSnapshot.captureTime) }}</span>
              </div>
            </div>
          </el-card>
        </div>
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
const lineChartRef = ref(null)
const wsConnected = ref(false)
const enablePolling = ref(true)
const pollingInterval = ref(1000)
const networkErrorMessage = ref('')
const enableCurveSmoothing = ref(true)
const transitionDuration = ref(320)

const queryForm = reactive({
  stationId: ''
})

const createDefaultSnapshot = () => ({
  id: '',
  stationId: '',
  stationName: '',
  deviceName: '',
  taskName: '',
  signalType: '',
  channelModel: '',
  aiLabel: '',
  aiRequestMode: '',
  aiActualMode: '',
  aiFallbackUsed: 0,
  aiFallbackUsedText: '未发生',
  aiModelName: '',
  aiReason: '',
  centerFreqMhz: null,
  bandwidthKhz: null,
  peakPowerDbm: null,
  snrDb: null,
  captureTime: '',
  powerPointsJson: '[]'
})

const latestSnapshot = reactive(createDefaultSnapshot())
const displayedPoints = ref([])
const displayedXAxis = ref([])

let lineChartInstance = null
let pollingTimer = null
let socket = null
let wsSessionId = 0
let reconnectTimer = null
let networkWarnShown = false
let lastAppliedSnapshotId = null
let animationFrameId = null

const normalizeId = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? String(value) : numberValue
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

const rawPoints = computed(() => parsePoints(latestSnapshot.powerPointsJson))

const currentStationName = computed(() => {
  const currentId = normalizeId(queryForm.stationId)
  const match = stationOptions.value.find(item => normalizeId(item.id) === currentId)
  return match?.stationName || latestSnapshot.stationName || ''
})

const statPointCount = computed(() => rawPoints.value.length)

const statAvgPowerValue = computed(() => {
  if (!rawPoints.value.length) return null
  const sum = rawPoints.value.reduce((acc, item) => acc + Number(item || 0), 0)
  return Number((sum / rawPoints.value.length).toFixed(2))
})

const statAvgPowerText = computed(() => {
  return statAvgPowerValue.value === null ? '-' : `${statAvgPowerValue.value} dBm`
})

const statPeakInfo = computed(() => {
  if (!rawPoints.value.length) {
    return { value: null, index: null }
  }

  let maxValue = rawPoints.value[0]
  let maxIndex = 0
  rawPoints.value.forEach((value, index) => {
    if (Number(value) > Number(maxValue)) {
      maxValue = value
      maxIndex = index
    }
  })

  return {
    value: Number(maxValue),
    index: maxIndex
  }
})

const statPeakPointText = computed(() => {
  return statPeakInfo.value.index === null ? '-' : `#${statPeakInfo.value.index + 1}`
})

const chartAvgPowerValue = computed(() => {
  if (!displayedPoints.value.length) return null
  const sum = displayedPoints.value.reduce((acc, item) => acc + Number(item || 0), 0)
  return Number((sum / displayedPoints.value.length).toFixed(2))
})

const chartPeakInfo = computed(() => {
  if (!displayedPoints.value.length) {
    return { value: null, index: null }
  }

  let maxValue = displayedPoints.value[0]
  let maxIndex = 0
  displayedPoints.value.forEach((value, index) => {
    if (Number(value) > Number(maxValue)) {
      maxValue = value
      maxIndex = index
    }
  })

  return {
    value: Number(maxValue),
    index: maxIndex
  }
})

const signalQualityText = computed(() => {
  const snr = Number(latestSnapshot.snrDb)
  if (Number.isNaN(snr)) return '信号质量未知'
  if (snr >= 20) return '信号质量优秀'
  if (snr >= 10) return '信号质量良好'
  if (snr >= 5) return '信号质量一般'
  return '信号质量偏弱'
})

const signalQualityTagType = computed(() => {
  const snr = Number(latestSnapshot.snrDb)
  if (Number.isNaN(snr)) return 'info'
  if (snr >= 20) return 'success'
  if (snr >= 10) return 'primary'
  if (snr >= 5) return 'warning'
  return 'danger'
})

const connectionStatusText = computed(() => {
  if (networkErrorMessage.value) return '网络异常'
  if (wsConnected.value) return 'WS在线'
  return '轮询兜底'
})

const connectionStatusDesc = computed(() => {
  if (networkErrorMessage.value) return '网络波动中，系统自动重连并快速轮询'
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

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  return Number.isNaN(num) ? String(value) : num.toFixed(2)
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

const computeSoftEnvelope = (points) => {
  if (!points.length) return []

  const radius = 2
  const upper = points.map((_, index) => {
    const start = Math.max(0, index - radius)
    const end = Math.min(points.length - 1, index + radius)
    let maxValue = points[start]
    for (let i = start + 1; i <= end; i += 1) {
      if (points[i] > maxValue) {
        maxValue = points[i]
      }
    }
    return maxValue
  })

  const smoothed = upper.map((_, index) => {
    const start = Math.max(0, index - radius)
    const end = Math.min(upper.length - 1, index + radius)
    let sum = 0
    for (let i = start; i <= end; i += 1) {
      sum += upper[i]
    }
    return Number((sum / (end - start + 1)).toFixed(2))
  })

  return smoothed
}

const ensureLineChart = () => {
  if (!lineChartRef.value) return null
  if (!lineChartInstance) {
    lineChartInstance = echarts.init(lineChartRef.value)
  }
  return lineChartInstance
}

const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const cancelPointAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

const renderLineChart = () => {
  const chart = ensureLineChart()
  if (!chart) return

  const points = displayedPoints.value
  const xData = displayedXAxis.value.length === points.length ? displayedXAxis.value : points.map((_, index) => index + 1)
  const avgValue = chartAvgPowerValue.value ?? 0
  const maxIndex = chartPeakInfo.value.index
  const maxValue = chartPeakInfo.value.value
  const envelopePoints = computeSoftEnvelope(points)

  chart.setOption(
    {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        borderColor: 'rgba(37, 99, 235, 0.24)',
        borderWidth: 1,
        textStyle: {
          color: '#e5eefc'
        },
        formatter: (params) => {
          const mainItem = params?.find(item => item.seriesName === '实时频谱') || params?.[0]
          if (!mainItem) return ''
          return `
            <div style="padding:6px 2px;min-width:160px;">
              <div style="font-weight:700;margin-bottom:8px;">实时频谱点位</div>
              <div style="margin-bottom:4px;">频率：${mainItem.axisValue}</div>
              <div style="margin-bottom:4px;">功率：${mainItem.data} dBm</div>
              <div>站点：${currentStationName.value || '-'}</div>
            </div>
          `
        }
      },
      grid: {
        left: 56,
        right: 24,
        top: 34,
        bottom: 70
      },
      xAxis: {
        type: 'category',
        data: xData,
        boundaryGap: false,
        name: points.length ? '频率 / MHz' : '',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          color: '#6b7b93',
          fontWeight: 600
        },
        axisLine: {
          lineStyle: {
            color: '#d7e3f2'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#73839d',
          margin: 14,
          showMaxLabel: true,
          showMinLabel: true
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        name: '功率 / dBm',
        nameTextStyle: {
          color: '#6b7b93',
          fontWeight: 600
        },
        axisLabel: {
          color: '#73839d'
        },
        axisLine: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(148, 163, 184, 0.18)',
            type: 'dashed'
          }
        }
      },
      dataZoom: [
        {
          type: 'inside',
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        },
        {
          type: 'slider',
          height: 18,
          bottom: 16,
          borderColor: 'transparent',
          backgroundColor: '#edf3fb',
          fillerColor: 'rgba(37, 99, 235, 0.16)',
          moveHandleSize: 0,
          dataBackground: {
            lineStyle: {
              color: '#bfd5f7'
            },
            areaStyle: {
              color: '#e8f0fd'
            }
          }
        }
      ],
      series: [
        {
          name: '柔和包络线',
          type: 'line',
          smooth: 0.45,
          showSymbol: false,
          silent: true,
          z: 1,
          lineStyle: {
            width: 9,
            color: 'rgba(59, 130, 246, 0.16)',
            cap: 'round',
            join: 'round'
          },
          data: envelopePoints
        },
        {
          name: '实时频谱',
          type: 'line',
          smooth: enableCurveSmoothing.value ? 0.22 : 0,
          showSymbol: false,
          sampling: 'lttb',
          z: 3,
          lineStyle: {
            width: 3,
            color: '#2563eb',
            cap: 'round',
            join: 'round'
          },
          itemStyle: {
            color: '#2563eb'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(37, 99, 235, 0.18)' },
              { offset: 0.55, color: 'rgba(59, 130, 246, 0.06)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
            ])
          },
          markLine: points.length
            ? {
                silent: true,
                symbol: 'none',
                lineStyle: {
                  color: '#f59e0b',
                  type: 'dashed',
                  width: 1.5
                },
                label: {
                  color: '#b45309',
                  formatter: `均值 ${avgValue} dBm`
                },
                data: [{ yAxis: avgValue }]
              }
            : undefined,
          data: points
        },
        {
          name: '峰值呼吸点',
          type: 'effectScatter',
          z: 6,
          showEffectOn: 'render',
          rippleEffect: {
            scale: 2.2,
            brushType: 'stroke',
            period: 4
          },
          symbolSize: 12,
          itemStyle: {
            color: '#16a34a',
            borderColor: '#ffffff',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(22, 163, 74, 0.25)'
          },
          label: {
            show: true,
            position: 'top',
            color: '#15803d',
            fontWeight: 700,
            formatter: ({ data }) => (data ? `峰值 ${data[1]} dBm` : '')
          },
          data: maxIndex === null || maxValue === null ? [] : [[xData[maxIndex], maxValue]]
        }
      ]
    },
    true
  )
}

const animateDisplayedPoints = (targetPoints, targetXAxis) => {
  cancelPointAnimation()

  if (!targetPoints.length) {
    displayedPoints.value = []
    displayedXAxis.value = []
    renderLineChart()
    return
  }

  const source = [...displayedPoints.value]
  const needDirectApply = source.length === 0 || source.length !== targetPoints.length

  displayedXAxis.value = [...targetXAxis]

  if (needDirectApply) {
    displayedPoints.value = [...targetPoints]
    renderLineChart()
    return
  }

  const duration = Number(transitionDuration.value) || 320
  const start = performance.now()

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = easeInOutCubic(progress)

    displayedPoints.value = targetPoints.map((value, index) => {
      const from = Number(source[index] ?? value)
      const to = Number(value)
      return Number((from + (to - from) * eased).toFixed(2))
    })

    renderLineChart()

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step)
    } else {
      displayedPoints.value = [...targetPoints]
      renderLineChart()
      animationFrameId = null
    }
  }

  animationFrameId = requestAnimationFrame(step)
}

const clearNetworkError = () => {
  networkErrorMessage.value = ''
  networkWarnShown = false
}

const resetSnapshot = async () => {
  cancelPointAnimation()
  Object.assign(latestSnapshot, createDefaultSnapshot())
  displayedPoints.value = []
  displayedXAxis.value = []
  lastAppliedSnapshotId = null
  await nextTick()
  renderLineChart()
}

const getReadableErrorText = (error) => {
  const msg = String(error?.message || error?.msg || '')
  if (!msg) return '未知异常'
  if (msg.includes('Network Error')) return '网络连接异常'
  if (msg.includes('ERR_NETWORK_CHANGED')) return '网络环境发生切换'
  return msg
}

const applyTransitionDuration = () => {
  // 只修改后续帧过渡时长，不需要额外处理
}

const applySnapshot = async (raw, options = {}) => {
  const { fromPush = false } = options

  if (!raw) {
    await resetSnapshot()
    return
  }

  const snapshotId = raw.id ?? null
  if (fromPush && snapshotId !== null && snapshotId === lastAppliedSnapshotId) {
    return
  }

  latestSnapshot.id = raw.id ?? ''
  latestSnapshot.stationId = raw.stationId ?? ''
  latestSnapshot.stationName = raw.stationName ?? ''
  latestSnapshot.deviceName = raw.deviceName ?? ''
  latestSnapshot.taskName = raw.taskName ?? ''
  latestSnapshot.signalType = raw.signalType ?? ''
  latestSnapshot.channelModel = raw.channelModel ?? ''
  latestSnapshot.aiLabel = raw.aiLabel ?? ''
  latestSnapshot.aiRequestMode = raw.aiRequestMode ?? raw.requestMode ?? ''
  latestSnapshot.aiActualMode = raw.aiActualMode ?? raw.actualMode ?? raw.inferenceMode ?? ''
  latestSnapshot.aiFallbackUsed = raw.aiFallbackUsed ?? raw.fallbackUsed ?? 0
  latestSnapshot.aiFallbackUsedText = Number(raw.aiFallbackUsed ?? raw.fallbackUsed ?? 0) === 1 ? '已发生' : '未发生'
  latestSnapshot.aiModelName = raw.aiModelName ?? raw.modelName ?? ''
  latestSnapshot.aiReason = raw.aiReason ?? raw.reason ?? ''
  latestSnapshot.centerFreqMhz = raw.centerFreqMhz ?? null
  latestSnapshot.bandwidthKhz = raw.bandwidthKhz ?? null
  latestSnapshot.peakPowerDbm = raw.peakPowerDbm ?? null
  latestSnapshot.snrDb = raw.snrDb ?? null
  latestSnapshot.captureTime = raw.captureTime ?? ''
  latestSnapshot.powerPointsJson = raw.powerPointsJson ?? raw.powerPoints ?? '[]'

  const targetPoints = parsePoints(latestSnapshot.powerPointsJson)
  const targetXAxis = buildXAxis(targetPoints, latestSnapshot.centerFreqMhz, latestSnapshot.bandwidthKhz)

  clearNetworkError()
  lastAppliedSnapshotId = snapshotId

  await nextTick()
  animateDisplayedPoints(targetPoints, targetXAxis)
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
    await applySnapshot(snapshot, { fromPush: true })
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
    if (wsConnected.value) return
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
  const host = window.location.host
  if (host) {
    return `${protocol}://${host.replace(/:\d+$/, ':9000')}`
  }

  const hostname = window.location.hostname || 'localhost'
  return `${protocol}://${hostname}:9000`
}

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

const scheduleReconnect = () => {
  clearReconnectTimer()

  if (!queryForm.stationId) return

  reconnectTimer = setTimeout(() => {
    connectWs()
  }, 1500)
}

const disconnectWs = () => {
  wsConnected.value = false
  clearReconnectTimer()

  if (!socket) return

  const currentSocket = socket
  socket = null

  currentSocket.onopen = null
  currentSocket.onmessage = null
  currentSocket.onerror = null
  currentSocket.onclose = null

  if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
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

      try {
        currentSocket.send('refresh')
      } catch (error) {
        console.warn('WS refresh 发送失败：', error)
      }
    }

    currentSocket.onmessage = async (event) => {
      if (currentSession !== wsSessionId) return

      try {
        const message = JSON.parse(event.data)
        if (message?.type === 'pong') return
        await applySnapshot(message?.data || message, { fromPush: true })
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
      scheduleReconnect()
    }
  } catch (error) {
    wsConnected.value = false
    console.error('实时频谱 WS 连接失败：', error)
    scheduleReconnect()
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
  if (socket && wsConnected.value && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send('refresh')
    } catch (error) {
      console.warn('WS 手动刷新发送失败，改走 HTTP：', error)
    }
  }
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
  if (lineChartInstance) {
    lineChartInstance.resize()
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
  clearReconnectTimer()
  cancelPointAnimation()

  window.removeEventListener('resize', handleResize)
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  if (lineChartInstance) {
    lineChartInstance.dispose()
    lineChartInstance = null
  }
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 112px);
}

.top-metrics {
  margin-bottom: 16px;
}

.metric-card {
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  border: none;
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
}

.metric-value {
  margin-top: 14px;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 700;
  color: #ffffff;
}

.metric-desc {
  margin-top: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.84);
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-blue {
  background: linear-gradient(135deg, #409eff, #67c6ff);
}

.metric-cyan {
  background: linear-gradient(135deg, #36cfc9, #5fe3da);
}

.metric-green {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.metric-orange {
  background: linear-gradient(135deg, #e6a23c, #f3c26b);
}

.page-card {
  border-radius: 18px;
}

.query-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chart-header {
  align-items: flex-start;
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
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-form {
  margin-bottom: 4px;
}

.network-tip {
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-size: 13px;
  line-height: 1.6;
}

.monitor-content-row {
  align-items: stretch;
}

.equal-height-col {
  display: flex;
}

.equal-height-card {
  width: 100%;
}

.spectrum-card {
  width: 100%;
  height: 100%;
}

.spectrum-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.chart-top-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-pill {
  width: 148px;
  min-width: 148px;
  min-height: 74px;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f7faff;
  border: 1px solid #e5edf8;
}

.stat-pill-label {
  display: block;
  font-size: 12px;
  color: #7b8aa3;
}

.stat-pill-value {
  display: block;
  margin-top: 6px;
  min-height: 28px;
  line-height: 28px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2a37;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.chart-shell {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #edf2f9;
  padding: 10px;
  display: flex;
}

.line-chart {
  width: 100%;
  flex: 1;
  min-height: 620px;
}

.chart-empty-mask {
  position: absolute;
  inset: 10px;
  border-radius: 16px;
  background: rgba(248, 251, 255, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #7b8aa3;
  text-align: center;
}

.chart-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #44536a;
}

.chart-empty-desc {
  margin-top: 8px;
  font-size: 13px;
}

.side-panel-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.side-panel-card {
  width: 100%;
}

.ai-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ai-status-item {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e8eff8;
}

.ai-status-label {
  font-size: 12px;
  color: #7b8aa3;
}

.ai-status-value {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #25324a;
  word-break: break-word;
}

.ai-reason-box {
  margin-top: 14px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #e8eff8;
}

.reason-title {
  font-size: 13px;
  font-weight: 700;
  color: #25324a;
}

.reason-content {
  margin-top: 8px;
  line-height: 1.7;
  color: #65758e;
  font-size: 13px;
}

.params-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px dashed #e8eff8;
}

.param-row:last-child {
  border-bottom: none;
}

.param-label {
  min-width: 84px;
  font-size: 13px;
  color: #7b8aa3;
}

.param-value {
  flex: 1;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #25324a;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1400px) {
  .chart-header {
    flex-direction: column;
  }

  .chart-top-stats {
    justify-content: flex-start;
  }
}

@media (max-width: 1200px) {
  .monitor-content-row .el-col {
    width: 100%;
    max-width: 100%;
    flex: 0 0 100%;
  }

  .side-panel-stack {
    margin-top: 16px;
  }

  .line-chart {
    min-height: 520px;
  }
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 26px;
  }

  .stat-pill {
    width: 100%;
    min-width: 100%;
  }

  .line-chart {
    min-height: 380px;
  }

  .ai-status-grid {
    grid-template-columns: 1fr;
  }

  .param-row {
    flex-direction: column;
    gap: 6px;
  }

  .param-value {
    text-align: left;
  }
}
</style>
