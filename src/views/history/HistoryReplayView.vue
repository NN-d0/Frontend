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

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="14">
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

      <el-col :span="10">
        <el-card class="page-card equal-height-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="header-title">频谱回放</div>
                <div class="header-subtitle">当前筛选条件下的完整历史帧，可连续循环播放</div>
              </div>
              <el-tag v-if="selectedHistory" :type="selectedHistory.alarmFlag === 1 ? 'danger' : 'success'">
                {{ selectedHistory.alarmFlag === 1 ? '异常快照' : '正常快照' }}
              </el-tag>
            </div>
          </template>

          <div class="replay-toolbar">
            <el-button-group>
              <el-button @click="prevFrame" :disabled="!replayRecords.length">上一帧</el-button>
              <el-button type="primary" @click="toggleReplay" :disabled="replayRecords.length <= 1">
                {{ isPlaying ? '暂停回放' : '开始回放' }}
              </el-button>
              <el-button @click="nextFrame" :disabled="!replayRecords.length">下一帧</el-button>
            </el-button-group>

            <div class="toolbar-right">
              <div class="speed-box">
                <span class="speed-label">速度</span>
                <el-select v-model="replaySpeed" style="width: 110px" @change="handleSpeedChange">
                  <el-option :value="500" label="2x" />
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

          <div class="frame-progress" v-if="replayRecords.length">
            <div class="frame-label">
              第 {{ currentFrameIndex + 1 }} 帧 / 共 {{ replayRecords.length }} 帧
            </div>
            <el-slider
              v-model="currentFrameIndex"
              :min="0"
              :max="replayRecords.length - 1"
              :show-tooltip="false"
              @input="handleSliderChange"
            />
          </div>

          <div ref="chartRef" class="chart-box replay-chart"></div>

          <div v-if="selectedHistory" class="selected-summary">
            <div class="selected-summary-title">
              {{ selectedHistory.stationName || '-' }} / {{ selectedHistory.deviceName || '-' }}
            </div>
            <div class="selected-summary-sub">
              {{ selectedHistory.taskName || '-' }} · {{ selectedHistory.signalType || '-' }} · {{ formatTime(selectedHistory.captureTime) }}
            </div>
          </div>

          <el-descriptions
            v-if="selectedHistory"
            :column="2"
            border
            style="margin-top: 16px;"
          >
            <el-descriptions-item label="站点名称">{{ selectedHistory.stationName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ selectedHistory.deviceName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任务名称">{{ selectedHistory.taskName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="信号制式">{{ selectedHistory.signalType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="中心频率">{{ selectedHistory.centerFreqMhz || '-' }} MHz</el-descriptions-item>
            <el-descriptions-item label="带宽">{{ selectedHistory.bandwidthKhz || '-' }} kHz</el-descriptions-item>
            <el-descriptions-item label="信道模型">{{ selectedHistory.channelModel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="AI识别">{{ selectedHistory.aiLabel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="请求模式">
              <el-tag type="info" effect="plain">{{ formatAiMode(selectedHistory.aiRequestMode) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="实际推理">
              <el-tag :type="formatAiMode(selectedHistory.aiActualMode) === 'CNN' ? 'primary' : 'success'">
                {{ formatAiMode(selectedHistory.aiActualMode) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Fallback">
              <el-tag :type="normalizeFallbackFlag(selectedHistory.aiFallbackUsed) === 1 ? 'danger' : 'success'">
                {{ normalizeFallbackFlag(selectedHistory.aiFallbackUsed) === 1 ? '已发生' : '未发生' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="实际模型">{{ selectedHistory.aiModelName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="AI说明" :span="2">{{ selectedHistory.aiReason || '-' }}</el-descriptions-item>
            <el-descriptions-item label="峰值功率">{{ selectedHistory.peakPowerDbm || '-' }} dBm</el-descriptions-item>
            <el-descriptions-item label="SNR">{{ selectedHistory.snrDb || '-' }} dB</el-descriptions-item>
            <el-descriptions-item label="占用带宽">{{ selectedHistory.occupiedBandwidthKhz || '-' }} kHz</el-descriptions-item>
            <el-descriptions-item label="采集时间">{{ formatTime(selectedHistory.captureTime) }}</el-descriptions-item>
          </el-descriptions>
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

const alarmSnapshotCount = computed(() => pageState.records.filter(item => item.alarmFlag === 1).length)

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
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
  if (Array.isArray(value)) return value.map(Number)

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(Number) : []
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

  const points = parsePowerPoints(selectedHistory.value?.powerPointsJson)
  const xData = buildXAxis(points, selectedHistory.value?.centerFreqMhz, selectedHistory.value?.bandwidthKhz)
  const avgValue = points.length
    ? Number((points.reduce((sum, item) => sum + Number(item || 0), 0) / points.length).toFixed(2))
    : 0

  chartInstance.setOption({
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 650,
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
            <div style="font-weight:700;margin-bottom:6px;">历史频谱帧</div>
            <div>频率：${item.axisValue}</div>
            <div>功率：${item.data} dBm</div>
          </div>
        `
      }
    },
    grid: {
      left: 55,
      right: 24,
      top: 36,
      bottom: 62
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
        color: '#73839d'
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
        height: 16,
        bottom: 16,
        borderColor: 'transparent',
        backgroundColor: '#eef4fb',
        fillerColor: 'rgba(99, 102, 241, 0.16)',
        moveHandleSize: 0
      }
    ],
    series: [
      {
        name: '历史频谱',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 3,
          color: '#4f46e5'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.36)' },
            { offset: 0.7, color: 'rgba(129, 140, 248, 0.12)' },
            { offset: 1, color: 'rgba(129, 140, 248, 0.02)' }
          ])
        },
        markPoint: points.length
          ? {
              symbol: 'circle',
              symbolSize: 40,
              itemStyle: { color: '#ef4444' },
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

const stopReplay = () => {
  isPlaying.value = false
  if (replayTimer) {
    clearTimeout(replayTimer)
    replayTimer = null
  }
}

const syncFrameByIndex = async (index) => {
  const row = replayRecords.value[index]
  if (!row) return

  selectedHistory.value = row
  await nextTick()
  renderChart()

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
    await syncFrameByIndex(nextIndex)
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
  await syncFrameByIndex(currentFrameIndex.value)
  scheduleNextFrame()
}

const prevFrame = async () => {
  stopReplay()
  if (!replayRecords.value.length) return

  currentFrameIndex.value = Math.max(0, currentFrameIndex.value - 1)
  await syncFrameByIndex(currentFrameIndex.value)
}

const nextFrame = async () => {
  stopReplay()
  if (!replayRecords.value.length) return

  currentFrameIndex.value = Math.min(replayRecords.value.length - 1, currentFrameIndex.value + 1)
  await syncFrameByIndex(currentFrameIndex.value)
}

const handleSliderChange = async (value) => {
  stopReplay()
  await syncFrameByIndex(value)
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

const loadPage = async () => {
  try {
    loading.value = true
    const res = await getHistoryPageApi(buildHistoryParams(queryForm.current, queryForm.size))
    const data = res.data || {}

    pageState.total = data.total || 0
    pageState.records = (data.records || []).map(item => ({
      ...item,
      aiRequestMode: formatAiMode(item.aiRequestMode),
      aiActualMode: formatAiMode(item.aiActualMode),
      aiFallbackUsed: normalizeFallbackFlag(item.aiFallbackUsed)
    }))
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
      const records = data.records || []

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
      await nextTick()
      renderChart()
    } else {
      currentFrameIndex.value = 0
      selectedHistory.value = null
      await nextTick()
      renderChart()
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
    await syncFrameByIndex(index)
  } else {
    selectedHistory.value = row
    await nextTick()
    renderChart()
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
  window.removeEventListener('resize', handleResize)

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

.equal-height-card,
.history-list-card {
  height: 100%;
}

.equal-height-card :deep(.el-card__body),
.history-list-card :deep(.el-card__body) {
  height: calc(100% - 56px);
  display: flex;
  flex-direction: column;
}

.history-list-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.history-table-wrap {
  flex: 1;
  overflow: hidden;
}

.history-table {
  height: 100%;
}

.replay-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
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

.frame-progress {
  margin-top: 16px;
}

.frame-label {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
}

.replay-chart {
  margin-top: 16px;
  height: 360px;
}

.selected-summary {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
  border: 1px solid #dbeafe;
}

.selected-summary-title {
  font-size: 16px;
  font-weight: 800;
  color: #1f2a37;
}

.selected-summary-sub {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>