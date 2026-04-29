<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">历史总记录数</div>
          <div class="metric-number">{{ pageState.total }}</div>
          <div class="metric-desc">当前筛选条件下总快照数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-red" shadow="hover">
          <div class="metric-label">当前页告警快照</div>
          <div class="metric-number">{{ alarmSnapshotCount }}</div>
          <div class="metric-desc">可用于异常历史回放演示</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">回放总帧数</div>
          <div class="metric-number">{{ replayRecords.length }}</div>
          <div class="metric-desc">当前筛选条件下用于回放的完整帧数</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">当前回放状态</div>
          <div class="metric-number metric-text">{{ isPlaying ? '回放中' : '已暂停' }}</div>
          <div class="metric-desc">{{ selectedHistory ? formatTime(selectedHistory.captureTime) : '暂无选中帧' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">历史查询</div>
            <div class="header-subtitle">分页表格用于浏览，回放轴自动加载当前筛选条件下的全部历史帧</div>
          </div>
          <div class="header-actions">
            <el-button @click="refreshAllData">刷新数据</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="所属站点">
          <el-select
            v-model="queryForm.stationId"
            placeholder="请选择站点"
            clearable
            filterable
            style="width: 220px;"
          >
            <el-option
              v-for="item in stationOptions"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="信号制式">
          <el-select
            v-model="queryForm.signalType"
            placeholder="请选择信号制式"
            clearable
            style="width: 180px;"
          >
            <el-option label="AM" value="AM" />
            <el-option label="FM" value="FM" />
            <el-option label="BPSK" value="BPSK" />
            <el-option label="QPSK" value="QPSK" />
            <el-option label="16QAM" value="16QAM" />
          </el-select>
        </el-form-item>

        <el-form-item label="开始时间">
          <el-date-picker
            v-model="queryForm.startTime"
            type="datetime"
            placeholder="请选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 220px;"
          />
        </el-form-item>

        <el-form-item label="结束时间">
          <el-date-picker
            v-model="queryForm.endTime"
            type="datetime"
            placeholder="请选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 220px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="workbench-row">
      <el-col :span="14" class="workbench-col">
        <el-card class="page-card equal-height-card history-list-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">历史记录列表</div>
                <div class="header-subtitle">点击任意记录可定位到对应回放帧</div>
              </div>
              <el-tag type="info">共 {{ pageState.total }} 条</el-tag>
            </div>
          </template>

          <div class="history-list-content">
            <div class="history-table-wrap">
              <el-table
                ref="tableRef"
                :data="pageState.records"
                stripe
                border
                highlight-current-row
                v-loading="loading"
                empty-text="暂无历史快照数据"
                @current-change="handleRowSelect"
                class="beauty-table history-table"
              >
                <el-table-column type="index" label="序号" width="70" />
                <el-table-column prop="stationName" label="站点名称" min-width="130" />
                <el-table-column prop="deviceName" label="设备名称" min-width="170" />
                <el-table-column prop="taskName" label="任务名称" min-width="180" />
                <el-table-column prop="signalType" label="信号制式" width="110">
                  <template #default="scope">
                    <el-tag type="primary" effect="plain">{{ scope.row.signalType }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="推理模式" min-width="150">
                  <template #default="scope">
                    <div>{{ formatAiMode(scope.row.aiActualMode) }}</div>
                    <div class="table-sub-text">请求 {{ formatAiMode(scope.row.aiRequestMode) }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="Fallback" width="100">
                  <template #default="scope">
                    <el-tag :type="normalizeFallbackFlag(scope.row.aiFallbackUsed) === 1 ? 'danger' : 'success'">
                      {{ normalizeFallbackFlag(scope.row.aiFallbackUsed) === 1 ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="centerFreqMhz" label="中心频率(MHz)" min-width="130" />
                <el-table-column prop="peakPowerDbm" label="峰值功率(dBm)" min-width="130" />
                <el-table-column prop="snrDb" label="SNR(dB)" min-width="100" />
                <el-table-column prop="alarmFlag" label="告警标记" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.alarmFlag === 1 ? 'danger' : 'success'">
                      {{ scope.row.alarmFlag === 1 ? '告警' : '正常' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="captureTime" label="采集时间" min-width="180">
                  <template #default="scope">
                    {{ formatTime(scope.row.captureTime) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="pagination-wrap">
              <el-pagination
                background
                layout="total, prev, pager, next, jumper"
                :total="pageState.total"
                :current-page="queryForm.current"
                :page-size="queryForm.size"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10" class="workbench-col">
        <el-card class="page-card equal-height-card replay-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">频谱回放</div>
                <div class="header-subtitle">平滑过渡回放 + 强化态势信息展示，支持连续循环播放</div>
              </div>
              <el-tag v-if="selectedHistory" :type="selectedHistory.alarmFlag === 1 ? 'danger' : 'success'">
                {{ selectedHistory.alarmFlag === 1 ? '异常快照' : '正常快照' }}
              </el-tag>
            </div>
          </template>

          <div class="replay-card-body">
            <div class="replay-hero" :class="selectedHistory?.alarmFlag === 1 ? 'hero-alert' : 'hero-normal'">
              <div class="hero-left">
                <div class="hero-kicker">历史回放工作台</div>
                <div class="hero-title">
                  {{ selectedHistory ? `${selectedHistory.stationName || '-'} / ${selectedHistory.signalType || '-'}` : '暂无可回放历史帧' }}
                </div>
                <div class="hero-subtitle">
                  {{ selectedHistory ? `${selectedHistory.taskName || '-'} · ${formatTime(selectedHistory.captureTime)}` : '请先通过上方筛选条件加载历史帧' }}
                </div>
              </div>

              <div class="hero-right">
                <div class="hero-frame-badge">
                  <span class="hero-frame-label">当前帧</span>
                  <span class="hero-frame-value">{{ replayRecords.length ? currentFrameIndex + 1 : 0 }}</span>
                </div>
                <div class="hero-state-badge" :class="isPlaying ? 'state-playing' : 'state-paused'">
                  {{ isPlaying ? '回放中' : '已暂停' }}
                </div>
              </div>
            </div>

            <div class="replay-toolbar">
              <div class="toolbar-left">
                <el-button-group>
                  <el-button @click="prevFrame" :disabled="!replayRecords.length">上一帧</el-button>
                  <el-button type="primary" @click="toggleReplay" :disabled="replayRecords.length <= 1">
                    {{ isPlaying ? '暂停回放' : '开始回放' }}
                  </el-button>
                  <el-button @click="nextFrame" :disabled="!replayRecords.length">下一帧</el-button>
                </el-button-group>
              </div>

              <div class="toolbar-right">
                <div class="speed-box">
                  <span class="speed-label">速度</span>
                  <el-select v-model="replaySpeed" style="width: 110px" @change="handleSpeedChange">
                    <el-option :value="400" label="2.5x" />
                    <el-option :value="600" label="2x" />
                    <el-option :value="1000" label="1x" />
                    <el-option :value="1500" label="0.75x" />
                    <el-option :value="2000" label="0.5x" />
                  </el-select>
                </div>

                <div class="speed-box">
                  <span class="speed-label">循环</span>
                  <el-switch v-model="loopReplay" />
                </div>
              </div>
            </div>

            <div class="timeline-panel" v-if="replayRecords.length">
              <div class="timeline-header">
                <div class="timeline-frame-text">
                  第 {{ currentFrameIndex + 1 }} 帧 / 共 {{ replayRecords.length }} 帧
                </div>
                <div class="timeline-progress-text">{{ progressPercent }}%</div>
              </div>

              <el-slider
                v-model="currentFrameIndex"
                :min="0"
                :max="replayRecords.length - 1"
                :show-tooltip="false"
                @input="handleSliderChange"
              />

              <div class="timeline-tips">
                <span>{{ replayRecords[0] ? formatTime(replayRecords[0].captureTime) : '-' }}</span>
                <span>{{ selectedHistory ? `当前 ${formatTime(selectedHistory.captureTime)}` : '-' }}</span>
                <span>{{ replayRecords.length ? formatTime(replayRecords[replayRecords.length - 1].captureTime) : '-' }}</span>
              </div>
            </div>

            <div class="chart-stage">
              <div ref="chartRef" class="chart-box replay-chart"></div>

              <div v-if="!selectedHistory" class="chart-empty">
                <div class="chart-empty-title">暂无历史回放数据</div>
                <div class="chart-empty-desc">请通过站点、时间范围和信号制式筛选后加载可回放帧。</div>
              </div>

              <div v-if="selectedHistory" class="chart-overlay">
                <div class="overlay-chip">
                  <div class="overlay-chip-label">峰值功率</div>
                  <div class="overlay-chip-value">{{ formatNumber(selectedHistory.peakPowerDbm, 'dBm') }}</div>
                </div>
                <div class="overlay-chip">
                  <div class="overlay-chip-label">中心频率</div>
                  <div class="overlay-chip-value">{{ formatNumber(selectedHistory.centerFreqMhz, 'MHz') }}</div>
                </div>
                <div class="overlay-chip">
                  <div class="overlay-chip-label">SNR</div>
                  <div class="overlay-chip-value">{{ formatNumber(selectedHistory.snrDb, 'dB') }}</div>
                </div>
                <div class="overlay-chip">
                  <div class="overlay-chip-label">AI标签</div>
                  <div class="overlay-chip-value">{{ selectedHistory.aiLabel || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-if="selectedHistory" class="detail-scroll-area">
              <div class="detail-grid">
                <div class="detail-card">
                  <div class="detail-card-label">站点 / 设备</div>
                  <div class="detail-card-value">{{ selectedHistory.stationName || '-' }}</div>
                  <div class="detail-card-sub">{{ selectedHistory.deviceName || '-' }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card-label">任务 / 制式</div>
                  <div class="detail-card-value">{{ selectedHistory.taskName || '-' }}</div>
                  <div class="detail-card-sub">{{ selectedHistory.signalType || '-' }} · {{ selectedHistory.channelModel || '-' }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card-label">推理模式</div>
                  <div class="detail-card-value">{{ formatAiMode(selectedHistory.aiActualMode) }}</div>
                  <div class="detail-card-sub">请求 {{ formatAiMode(selectedHistory.aiRequestMode) }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card-label">Fallback / 模型</div>
                  <div class="detail-card-value">{{ normalizeFallbackFlag(selectedHistory.aiFallbackUsed) === 1 ? '已发生' : '未发生' }}</div>
                  <div class="detail-card-sub">{{ selectedHistory.aiModelName || '-' }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card-label">带宽 / 占用带宽</div>
                  <div class="detail-card-value">{{ formatNumber(selectedHistory.bandwidthKhz, 'kHz') }}</div>
                  <div class="detail-card-sub">{{ formatNumber(selectedHistory.occupiedBandwidthKhz, 'kHz') }}</div>
                </div>

                <div class="detail-card">
                  <div class="detail-card-label">采集时间</div>
                  <div class="detail-card-value">{{ formatTime(selectedHistory.captureTime) }}</div>
                  <div class="detail-card-sub">{{ selectedHistory.alarmFlag === 1 ? '该帧触发异常告警' : '该帧未触发告警' }}</div>
                </div>
              </div>

              <div class="ai-reason-panel">
                <div class="ai-reason-title">AI 说明</div>
                <div class="ai-reason-text">{{ selectedHistory.aiReason || '当前帧暂无额外 AI 说明。' }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getHistoryPageApi, getStationListApi } from '../../api/overview'

const loading = ref(false)
const stationOptions = ref([])
const selectedHistory = ref(null)
const chartRef = ref(null)
const tableRef = ref(null)

const queryForm = reactive({
  current: 1,
  size: 20,
  stationId: '',
  signalType: '',
  startTime: '',
  endTime: ''
})

const pageState = reactive({
  total: 0,
  records: []
})

const replayRecords = ref([])
const currentFrameIndex = ref(0)
const replaySpeed = ref(1000)
const isPlaying = ref(false)
const loopReplay = ref(true)

let chartInstance = null
let replayTimer = null
let chartTweenFrame = null
let lastRenderedPoints = []

const alarmSnapshotCount = computed(() => pageState.records.filter(item => item.alarmFlag === 1).length)

const progressPercent = computed(() => {
  if (!replayRecords.value.length) return 0
  return Number((((currentFrameIndex.value + 1) / replayRecords.value.length) * 100).toFixed(0))
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

const formatAiMode = (value) => {
  const mode = String(value || '').trim().toUpperCase()
  if (mode === 'AI') return 'CNN'
  if (mode === 'RULE' || mode === 'CNN' || mode === 'AUTO') return mode
  return '-'
}

const normalizeFallbackFlag = (value) => {
  return Number(value || 0) === 1 ? 1 : 0
}

const sortFramesByTime = (list) => {
  return [...list].sort((a, b) => {
    const t1 = new Date(a.captureTime || a.createTime || 0).getTime()
    const t2 = new Date(b.captureTime || b.createTime || 0).getTime()
    return t1 - t2
  })
}

const parsePowerPoints = (value) => {
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
  const bwKhz = Number(bandwidthKhz)

  if (Number.isNaN(center) || Number.isNaN(bwKhz) || bwKhz <= 0) {
    return points.map((_, index) => index + 1)
  }

  const start = center - bwKhz / 2000
  const step = (bwKhz / 1000) / Math.max(points.length - 1, 1)

  return points.map((_, index) => Number((start + step * index).toFixed(3)))
}

const ensureChart = () => {
  if (!chartRef.value) return null
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  return chartInstance
}

const stopChartTween = () => {
  if (chartTweenFrame) {
    cancelAnimationFrame(chartTweenFrame)
    chartTweenFrame = null
  }
}

const getSeriesTheme = (record) => {
  const isAlarm = Number(record?.alarmFlag || 0) === 1
  return isAlarm
    ? {
        line: '#fb7185',
        glow: 'rgba(251, 113, 133, 0.28)',
        areaTop: 'rgba(251, 113, 133, 0.32)',
        areaMid: 'rgba(251, 113, 133, 0.10)',
        areaBottom: 'rgba(251, 113, 133, 0.02)',
        mark: '#f97316',
        avg: '#f59e0b',
        axis: '#cbd5e1',
        text: '#cbd5e1',
        split: 'rgba(148, 163, 184, 0.14)'
      }
    : {
        line: '#60a5fa',
        glow: 'rgba(96, 165, 250, 0.26)',
        areaTop: 'rgba(96, 165, 250, 0.30)',
        areaMid: 'rgba(59, 130, 246, 0.10)',
        areaBottom: 'rgba(59, 130, 246, 0.02)',
        mark: '#34d399',
        avg: '#fbbf24',
        axis: '#cbd5e1',
        text: '#cbd5e1',
        split: 'rgba(148, 163, 184, 0.14)'
      }
}

const createChartOption = ({ points, xData, avgValue, previousPoints, record }) => {
  const theme = getSeriesTheme(record)
  const hasPrev = Array.isArray(previousPoints) && previousPoints.length === points.length && points.length > 0

  return {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.45)',
          width: 1
        }
      },
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderColor: 'rgba(96, 165, 250, 0.35)',
      borderWidth: 1,
      padding: [10, 12],
      textStyle: {
        color: '#e5eefc'
      },
      formatter: (params) => {
        const current = params?.find(item => item.seriesName === '当前帧')
        const previous = params?.find(item => item.seriesName === '上一帧')
        const currentValue = current?.data ?? '-'
        const prevValue = previous?.data ?? '-'
        return `
          <div style="padding:2px 0;">
            <div style="font-weight:700;margin-bottom:6px;">频谱回放帧</div>
            <div>频率：${current?.axisValue ?? '-'}</div>
            <div>当前帧：${currentValue} dBm</div>
            ${previous ? `<div>上一帧：${prevValue} dBm</div>` : ''}
          </div>
        `
      }
    },
    grid: {
      left: 54,
      right: 18,
      top: 28,
      bottom: 54
    },
    xAxis: {
      type: 'category',
      data: xData,
      boundaryGap: false,
      name: points.length ? '频率 / MHz' : '',
      nameGap: 26,
      nameTextStyle: {
        color: theme.text,
        fontSize: 12,
        padding: [8, 0, 0, 0]
      },
      axisLine: {
        lineStyle: {
          color: theme.axis
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: theme.text,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '功率 / dBm',
      nameTextStyle: {
        color: theme.text,
        fontSize: 12
      },
      axisLabel: {
        color: theme.text,
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: theme.split,
          type: 'dashed'
        }
      }
    },
    series: [
      ...(hasPrev
        ? [
            {
              name: '上一帧',
              type: 'line',
              smooth: 0.3,
              symbol: 'none',
              silent: true,
              z: 1,
              lineStyle: {
                width: 1.5,
                type: 'dashed',
                color: 'rgba(148, 163, 184, 0.72)'
              },
              data: previousPoints
            }
          ]
        : []),
      {
        name: '当前帧',
        type: 'line',
        smooth: 0.35,
        symbol: 'none',
        z: 3,
        lineStyle: {
          width: 3,
          color: theme.line,
          shadowColor: theme.glow,
          shadowBlur: 12
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: theme.areaTop },
            { offset: 0.65, color: theme.areaMid },
            { offset: 1, color: theme.areaBottom }
          ])
        },
        markPoint: points.length
          ? {
              symbol: 'circle',
              symbolSize: 34,
              itemStyle: { color: theme.mark },
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
                color: theme.avg,
                type: 'dashed'
              },
              label: {
                color: theme.avg,
                formatter: `均值 ${avgValue}`
              },
              data: [{ yAxis: avgValue }]
            }
          : undefined,
        data: points
      }
    ]
  }
}

const renderChartOption = (points, record, previousPoints = []) => {
  const chart = ensureChart()
  if (!chart) return

  const xData = buildXAxis(points, record?.centerFreqMhz, record?.bandwidthKhz)
  const avgValue = points.length
    ? Number((points.reduce((sum, item) => sum + Number(item || 0), 0) / points.length).toFixed(2))
    : 0

  chart.setOption(
    createChartOption({
      points,
      xData,
      avgValue,
      previousPoints,
      record
    }),
    true
  )
  chart.resize()
}

const renderSelectedHistory = async (animateTransition = true) => {
  await nextTick()
  const chart = ensureChart()
  if (!chart) return

  const targetPoints = parsePowerPoints(selectedHistory.value?.powerPointsJson)

  if (!selectedHistory.value || !targetPoints.length) {
    stopChartTween()
    lastRenderedPoints = []
    chart.clear()
    chart.resize()
    return
  }

  const previousPoints =
    Array.isArray(lastRenderedPoints) && lastRenderedPoints.length === targetPoints.length
      ? [...lastRenderedPoints]
      : [...targetPoints]

  if (!animateTransition || previousPoints.length !== targetPoints.length) {
    stopChartTween()
    renderChartOption(targetPoints, selectedHistory.value, previousPoints)
    lastRenderedPoints = [...targetPoints]
    return
  }

  stopChartTween()

  const start = performance.now()
  const duration = 340
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration)
    const eased = easeOutCubic(progress)
    const mixed = targetPoints.map((value, index) => {
      const from = previousPoints[index]
      return Number((from + (value - from) * eased).toFixed(2))
    })

    renderChartOption(mixed, selectedHistory.value, previousPoints)

    if (progress < 1) {
      chartTweenFrame = requestAnimationFrame(step)
    } else {
      chartTweenFrame = null
      renderChartOption(targetPoints, selectedHistory.value, previousPoints)
      lastRenderedPoints = [...targetPoints]
    }
  }

  chartTweenFrame = requestAnimationFrame(step)
}

const stopReplay = () => {
  isPlaying.value = false
  if (replayTimer) {
    clearTimeout(replayTimer)
    replayTimer = null
  }
}

const syncFrameByIndex = async (index, animateTransition = true) => {
  const row = replayRecords.value[index]
  if (!row) return

  selectedHistory.value = row
  await renderSelectedHistory(animateTransition)

  if (tableRef.value) {
    const matched = pageState.records.find(item => item.id === row.id)
    if (matched) {
      tableRef.value.setCurrentRow(matched)
    } else {
      tableRef.value.setCurrentRow()
    }
  }
}

const scheduleNextFrame = () => {
  if (!isPlaying.value) return
  if (replayRecords.value.length <= 1) {
    stopReplay()
    return
  }

  replayTimer = setTimeout(async () => {
    if (!isPlaying.value) return

    let nextIndex = currentFrameIndex.value + 1

    if (nextIndex >= replayRecords.value.length) {
      if (loopReplay.value) {
        nextIndex = 0
      } else {
        stopReplay()
        return
      }
    }

    currentFrameIndex.value = nextIndex
    await syncFrameByIndex(nextIndex, true)
    scheduleNextFrame()
  }, Number(replaySpeed.value))
}

const toggleReplay = async () => {
  if (!replayRecords.value.length) {
    ElMessage.warning('当前没有可回放的历史帧')
    return
  }

  if (isPlaying.value) {
    stopReplay()
    return
  }

  isPlaying.value = true
  await syncFrameByIndex(currentFrameIndex.value, true)
  scheduleNextFrame()
}

const prevFrame = async () => {
  stopReplay()
  if (!replayRecords.value.length) return

  currentFrameIndex.value = Math.max(0, currentFrameIndex.value - 1)
  await syncFrameByIndex(currentFrameIndex.value, true)
}

const nextFrame = async () => {
  stopReplay()
  if (!replayRecords.value.length) return

  currentFrameIndex.value = Math.min(replayRecords.value.length - 1, currentFrameIndex.value + 1)
  await syncFrameByIndex(currentFrameIndex.value, true)
}

const handleSliderChange = async (value) => {
  stopReplay()
  await syncFrameByIndex(value, true)
}

const handleSpeedChange = () => {
  if (isPlaying.value) {
    stopReplay()
    isPlaying.value = true
    scheduleNextFrame()
  }
}

const buildHistoryParams = (page, size) => {
  return {
    current: page,
    size,
    stationId: queryForm.stationId || undefined,
    signalType: queryForm.signalType || undefined,
    startTime: queryForm.startTime || undefined,
    endTime: queryForm.endTime || undefined
  }
}

const loadStationOptions = async () => {
  const res = await getStationListApi()
  stationOptions.value = res.data || []
}

const normalizeRecord = (item) => ({
  ...item,
  aiRequestMode: formatAiMode(item.aiRequestMode),
  aiActualMode: formatAiMode(item.aiActualMode),
  aiFallbackUsed: normalizeFallbackFlag(item.aiFallbackUsed)
})

const loadPage = async () => {
  try {
    loading.value = true
    const res = await getHistoryPageApi(buildHistoryParams(queryForm.current, queryForm.size))
    const data = res.data || {}

    pageState.total = data.total || 0
    pageState.records = (data.records || []).map(normalizeRecord)
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '历史列表加载失败')
  } finally {
    loading.value = false
  }
}

const loadReplayTimeline = async () => {
  stopReplay()

  try {
    const pageSize = 200
    let current = 1
    let total = 0
    let allRecords = []

    while (true) {
      const res = await getHistoryPageApi(buildHistoryParams(current, pageSize))
      const data = res.data || {}
      const records = (data.records || []).map(normalizeRecord)

      total = data.total || records.length
      allRecords = allRecords.concat(records)

      if (records.length === 0) break
      if (allRecords.length >= total) break

      current += 1
      if (current > 100) break
    }

    replayRecords.value = sortFramesByTime(allRecords)

    if (replayRecords.value.length > 0) {
      currentFrameIndex.value = 0
      selectedHistory.value = replayRecords.value[0]
      await renderSelectedHistory(false)
    } else {
      currentFrameIndex.value = 0
      selectedHistory.value = null
      lastRenderedPoints = []
      await renderSelectedHistory(false)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '历史回放帧加载失败')
  }
}

const refreshAllData = async () => {
  await loadPage()
  await loadReplayTimeline()
}

const handleRowSelect = async (row) => {
  if (!row) return

  stopReplay()

  const index = replayRecords.value.findIndex(item => item.id === row.id)
  if (index >= 0) {
    currentFrameIndex.value = index
    await syncFrameByIndex(index, true)
  } else {
    selectedHistory.value = row
    await renderSelectedHistory(true)
  }
}

const handleSearch = async () => {
  queryForm.current = 1
  await refreshAllData()
}

const resetQuery = async () => {
  queryForm.current = 1
  queryForm.size = 20
  queryForm.stationId = ''
  queryForm.signalType = ''
  queryForm.startTime = ''
  queryForm.endTime = ''
  await refreshAllData()
}

const handleCurrentChange = async (page) => {
  queryForm.current = page
  await loadPage()
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(async () => {
  await loadStationOptions()
  await refreshAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopReplay()
  stopChartTween()
  window.removeEventListener('resize', handleResize)

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
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 94px;
  height: 94px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
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
.metric-red::before,
.metric-cyan::before,
.metric-green::before {
  content: '';
  display: block;
  height: 4px;
  margin: -18px -22px 16px;
}

.metric-blue::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.metric-red::before {
  background: linear-gradient(90deg, #ef4444, #fca5a5);
}

.metric-cyan::before {
  background: linear-gradient(90deg, #06b6d4, #67e8f9);
}

.metric-green::before {
  background: linear-gradient(90deg, #22c55e, #86efac);
}

.page-card,
.equal-height-card {
  border-radius: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-form {
  margin-bottom: -6px;
}

.workbench-row {
  display: flex;
  align-items: stretch;
}

.workbench-col {
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
  overflow: hidden;
}

.history-list-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.history-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.history-table {
  height: 100%;
}

.table-sub-text {
  margin-top: 2px;
  font-size: 12px;
  color: #8a97ab;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.replay-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.replay-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.hero-normal {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(14, 165, 233, 0.06));
}

.hero-alert {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.10), rgba(249, 115, 22, 0.06));
}

.hero-kicker {
  font-size: 12px;
  color: #64748b;
}

.hero-title {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  line-height: 1.3;
}

.hero-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

.hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.hero-frame-badge {
  min-width: 84px;
  padding: 10px 14px;
  border-radius: 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.hero-frame-label {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.hero-frame-value {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 800;
  color: #111827;
}

.hero-state-badge {
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.state-playing {
  color: #166534;
  background: rgba(34, 197, 94, 0.14);
}

.state-paused {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.12);
}

.replay-toolbar {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.speed-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speed-label {
  font-size: 13px;
  color: #6b7280;
}

.timeline-panel {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  border: 1px solid #e5eefb;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.timeline-frame-text,
.timeline-progress-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.timeline-tips {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.chart-stage {
  position: relative;
  margin-top: 14px;
  flex: 1;
  min-height: 360px;
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.14), transparent 30%),
    linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.replay-chart {
  width: 100%;
  height: 100%;
  min-height: 360px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
  text-align: center;
  z-index: 2;
}

.chart-empty-title {
  font-size: 22px;
  font-weight: 800;
}

.chart-empty-desc {
  max-width: 360px;
  font-size: 13px;
  line-height: 1.8;
  color: #cbd5e1;
}

.chart-overlay {
  position: absolute;
  right: 16px;
  top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(108px, 1fr));
  gap: 10px;
  z-index: 2;
}

.overlay-chip {
  padding: 10px 12px;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  background: rgba(15, 23, 42, 0.52);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.overlay-chip-label {
  font-size: 11px;
  color: #94a3b8;
}

.overlay-chip-value {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.detail-scroll-area {
  margin-top: 14px;
  flex-shrink: 0;
  overflow: auto;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 14px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  border: 1px solid #e6edf8;
}

.detail-card-label {
  font-size: 12px;
  color: #64748b;
}

.detail-card-value {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  line-height: 1.45;
  word-break: break-word;
}

.detail-card-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  word-break: break-word;
}

.ai-reason-panel {
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.ai-reason-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.ai-reason-text {
  margin-top: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  font-size: 13px;
  color: #475569;
}

@media (max-width: 1400px) {
  .chart-overlay {
    grid-template-columns: 1fr 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .workbench-row {
    display: block;
  }

  .workbench-col {
    display: block;
    margin-bottom: 16px;
  }

  .replay-chart,
  .chart-stage {
    min-height: 320px;
  }

  .hero-right {
    width: 100%;
    justify-content: flex-start;
  }

  .replay-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>