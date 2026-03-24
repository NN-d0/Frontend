<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">当前页告警数</div>
          <div class="metric-value">{{ pageState.records.length }}</div>
          <div class="metric-sub">地图与列表严格同步</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">可定位点位数</div>
          <div class="metric-value">{{ currentPagePoints.length }}</div>
          <div class="metric-sub">具备经纬度的告警点位数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">未处理告警</div>
          <div class="metric-value">{{ pendingCount }}</div>
          <div class="metric-sub">红色状态标识</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">已确认 / 已处理</div>
          <div class="metric-value">{{ confirmedCount + handledCount }}</div>
          <div class="metric-sub">蓝色 / 绿色状态标识</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <div class="header-right">
            <span class="legend-item"><i class="legend-dot high"></i>高等级</span>
            <span class="legend-item"><i class="legend-dot medium"></i>中等级</span>
            <span class="legend-item"><i class="legend-dot low"></i>低等级</span>
            <span class="legend-item"><i class="legend-line pending"></i>未处理</span>
            <span class="legend-item"><i class="legend-line confirmed"></i>已确认</span>
            <span class="legend-item"><i class="legend-line handled"></i>已处理</span>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm">
        <el-form-item label="处理状态">
          <el-select
            v-model="queryForm.alarmStatus"
            placeholder="请选择状态"
            clearable
            style="width: 180px"
          >
            <el-option label="未处理" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已处理" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button @click="loadData">刷新</el-button>
        </el-form-item>
      </el-form>

      <div class="page-tip">
        当前地图严格展示“当前页告警点位列表”的数据。<br />
        未处理、已确认、已处理三种状态都会显示，并通过边框颜色区分；重复坐标点会自动散开。
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px" class="panel-row">
      <el-col :span="15" class="panel-col">
        <el-card class="page-card panel-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>告警地图</span>
              <el-tag type="primary">状态可视化</el-tag>
            </div>
          </template>

          <div class="panel-body">
            <div ref="mapRef" class="map-box panel-fill"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="9" class="panel-col">
        <el-card class="page-card panel-card" shadow="hover">
          <template #header>
            <span>当前选中告警</span>
          </template>

          <div class="panel-body">
            <div class="detail-wrap">
              <el-descriptions :column="1" border v-if="selectedPoint">
                <el-descriptions-item label="告警编号">{{ selectedPoint.alarmNo || '-' }}</el-descriptions-item>
                <el-descriptions-item label="站点名称">{{ selectedPoint.stationName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="设备名称">{{ selectedPoint.deviceName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="告警类型">{{ selectedPoint.alarmType || '-' }}</el-descriptions-item>
                <el-descriptions-item label="告警级别">
                  <el-tag :type="alarmLevelTag(selectedPoint.alarmLevel)">
                    {{ selectedPoint.alarmLevel || '-' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="处理状态">
                  <el-tag :type="alarmStatusTag(selectedPoint.alarmStatus)">
                    {{ alarmStatusText(selectedPoint.alarmStatus) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="告警标题">{{ selectedPoint.title || '-' }}</el-descriptions-item>
                <el-descriptions-item label="位置描述">{{ selectedPoint.locationText || '-' }}</el-descriptions-item>
                <el-descriptions-item label="告警时间">{{ formatTime(selectedPoint.alarmTime) }}</el-descriptions-item>
                <el-descriptions-item label="确认时间">{{ formatTime(selectedPoint.confirmTime) }}</el-descriptions-item>
                <el-descriptions-item label="处理时间">{{ formatTime(selectedPoint.handleTime) }}</el-descriptions-item>
                <el-descriptions-item label="处理备注">{{ selectedPoint.handleNote || '-' }}</el-descriptions-item>
                <el-descriptions-item label="告警内容">{{ selectedPoint.content || '-' }}</el-descriptions-item>
              </el-descriptions>

              <el-empty v-else description="请先点击地图点位或表格行" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>告警点位列表</span>
          <el-tag type="info">地图与当前页列表同步</el-tag>
        </div>
      </template>

      <el-table
        :data="pageState.records"
        stripe
        border
        v-loading="loading"
        highlight-current-row
        empty-text="暂无告警点位数据"
        @current-change="handleRowSelect"
      >
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="alarmNo" label="告警编号" min-width="170" />
        <el-table-column prop="stationName" label="站点名称" min-width="130" />
        <el-table-column prop="deviceName" label="设备名称" min-width="160" />
        <el-table-column prop="alarmType" label="告警类型" min-width="130" />
        <el-table-column prop="alarmLevel" label="告警级别" width="110">
          <template #default="scope">
            <el-tag :type="alarmLevelTag(scope.row.alarmLevel)">
              {{ scope.row.alarmLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmStatus" label="处理状态" width="110">
          <template #default="scope">
            <el-tag :type="alarmStatusTag(scope.row.alarmStatus)">
              {{ alarmStatusText(scope.row.alarmStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="告警标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="alarmTime" label="告警时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.alarmTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="pageState.total"
          :current-page="queryForm.current"
          :page-size="FIXED_PAGE_SIZE"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import L from 'leaflet'
import { getAlarmMapPageApi } from '../../api/alarm'

const loading = ref(false)
const selectedPoint = ref(null)
const mapRef = ref(null)
const FIXED_PAGE_SIZE = 10

const queryForm = reactive({
  current: 1,
  size: FIXED_PAGE_SIZE,
  alarmStatus: ''
})

const pageState = reactive({
  total: 0,
  records: []
})

let mapInstance = null
let markerLayer = null
const markerMap = new Map()

const currentPagePoints = computed(() =>
  pageState.records.filter(item => isValidCoord(item.latitude, item.longitude))
)

const pendingCount = computed(() => pageState.records.filter(item => item.alarmStatus === 0).length)
const confirmedCount = computed(() => pageState.records.filter(item => item.alarmStatus === 1).length)
const handledCount = computed(() => pageState.records.filter(item => item.alarmStatus === 2).length)

const isValidCoord = (lat, lng) => {
  return lat !== null && lat !== undefined && lng !== null && lng !== undefined && lat !== '' && lng !== ''
}

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

const getAlarmMeta = (level, status) => {
  const levelColorMap = {
    HIGH: '#f56c6c',
    MEDIUM: '#e6a23c',
    LOW: '#67c23a'
  }

  const statusBorderMap = {
    0: '#ef4444',
    1: '#2563eb',
    2: '#10b981'
  }

  const statusTextMap = {
    0: '未',
    1: '确',
    2: '处'
  }

  return {
    fillColor: levelColorMap[level] || '#409eff',
    borderColor: statusBorderMap[status] || '#94a3b8',
    shortStatus: statusTextMap[status] || '告'
  }
}

const buildDisplayPoints = (records) => {
  const validRecords = records.filter(item => isValidCoord(item.latitude, item.longitude))
  const groups = new Map()

  validRecords.forEach(item => {
    const lat = Number(item.latitude)
    const lng = Number(item.longitude)
    const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(item)
  })

  const result = []

  groups.forEach((group) => {
    if (group.length === 1) {
      const item = group[0]
      result.push({
        ...item,
        displayLat: Number(item.latitude),
        displayLng: Number(item.longitude)
      })
      return
    }

    const centerLat = Number(group[0].latitude)
    const centerLng = Number(group[0].longitude)
    const radius = 0.00035

    group.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / group.length
      const latOffset = radius * Math.sin(angle)
      const lngOffset = (radius * Math.cos(angle)) / Math.max(Math.cos(centerLat * Math.PI / 180), 0.3)

      result.push({
        ...item,
        displayLat: Number((centerLat + latOffset).toFixed(6)),
        displayLng: Number((centerLng + lngOffset).toFixed(6))
      })
    })
  })

  return result
}

const buildAlarmMarkerHtml = (item, active = false) => {
  const meta = getAlarmMeta(item.alarmLevel, item.alarmStatus)
  const size = active ? 40 : 30
  const border = active ? `4px solid ${meta.borderColor}` : `3px solid ${meta.borderColor}`
  const glow = active
    ? '0 0 0 6px rgba(37,99,235,0.16), 0 12px 26px rgba(0,0,0,0.18)'
    : '0 8px 18px rgba(0,0,0,0.16)'

  return `
    <div style="position:relative;transform:translate(-${size / 2}px,-${size + 12}px);">
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${meta.fillColor};
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:800;
        font-size:${active ? '15px' : '13px'};
        border:${border};
        box-shadow:${glow};
      ">${meta.shortStatus}</div>
      <div style="
        position:absolute;
        left:50%;
        bottom:-10px;
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:12px solid ${meta.fillColor};
        transform:translateX(-50%);
      "></div>
    </div>
  `
}

const buildPopupHtml = (item) => {
  return `
    <div style="width:280px;padding:2px 2px 6px 2px;">
      <div style="font-size:16px;font-weight:700;color:#303133;">${item.title || '未命名告警'}</div>
      <div style="margin-top:8px;color:#606266;">告警编号：${item.alarmNo || '-'}</div>
      <div style="margin-top:6px;color:#606266;">站点名称：${item.stationName || '-'}</div>
      <div style="margin-top:6px;color:#606266;">设备名称：${item.deviceName || '-'}</div>
      <div style="margin-top:6px;color:#606266;">告警类型：${item.alarmType || '-'}</div>
      <div style="margin-top:6px;color:#606266;">告警时间：${formatTime(item.alarmTime)}</div>
      <div style="margin-top:10px;color:#303133;line-height:1.7;">${item.content || '-'}</div>
    </div>
  `
}

const buildIcon = (item, active = false) => {
  return L.divIcon({
    className: 'custom-alarm-marker',
    html: buildAlarmMarkerHtml(item, active),
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -42]
  })
}

const initMap = () => {
  if (mapInstance || !mapRef.value) return

  mapInstance = L.map(mapRef.value, {
    zoomControl: true
  }).setView([22.55, 114.05], 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance)

  markerLayer = L.layerGroup().addTo(mapInstance)
}

const highlightMarker = (alarmId) => {
  markerMap.forEach(({ marker, item }, id) => {
    marker.setIcon(buildIcon(item, String(id) === String(alarmId)))
  })
}

const renderMap = async () => {
  initMap()

  if (!markerLayer) return
  markerLayer.clearLayers()
  markerMap.clear()

  const displayPoints = buildDisplayPoints(pageState.records)

  displayPoints.forEach(item => {
    const marker = L.marker(
      [Number(item.displayLat), Number(item.displayLng)],
      { icon: buildIcon(item, selectedPoint.value && String(selectedPoint.value.id) === String(item.id)) }
    )

    marker.bindPopup(buildPopupHtml(item), {
      maxWidth: 320,
      className: 'beauty-popup'
    })

    marker.on('click', () => {
      selectedPoint.value = { ...item }
      highlightMarker(item.id)
    })

    marker.addTo(markerLayer)
    markerMap.set(String(item.id), { marker, item })
  })

  if (displayPoints.length > 0) {
    const latlngs = displayPoints.map(item => [Number(item.displayLat), Number(item.displayLng)])
    mapInstance.fitBounds(latlngs, { padding: [28, 28] })
  }

  setTimeout(() => {
    mapInstance.invalidateSize()
  }, 200)
}

const loadData = async () => {
  try {
    loading.value = true

    const res = await getAlarmMapPageApi({
      current: queryForm.current,
      size: queryForm.size,
      alarmStatus: queryForm.alarmStatus === '' ? undefined : queryForm.alarmStatus
    })

    const data = res.data || {}
    pageState.total = data.total || 0
    pageState.records = data.records || []

    if (selectedPoint.value) {
      const match = pageState.records.find(item => String(item.id) === String(selectedPoint.value.id))
      selectedPoint.value = match ? { ...match } : null
    }

    await nextTick()
    await renderMap()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  queryForm.current = 1
  await loadData()
}

const resetQuery = async () => {
  queryForm.current = 1
  queryForm.alarmStatus = ''
  selectedPoint.value = null
  await loadData()
}

const handleCurrentChange = async (page) => {
  queryForm.current = page
  await loadData()
}

const handleRowSelect = (row) => {
  if (!row) return
  selectedPoint.value = { ...row }
  highlightMarker(row.id)

  const markerEntry = markerMap.get(String(row.id))
  if (markerEntry) {
    mapInstance.setView(markerEntry.marker.getLatLng(), Math.max(mapInstance.getZoom(), 12))
    markerEntry.marker.openPopup()
  }
}

const handleResize = () => {
  if (mapInstance) {
    mapInstance.invalidateSize()
  }
}

onMounted(async () => {
  await nextTick()
  initMap()
  await loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-item {
  font-size: 12px;
  color: #606266;
}

.legend-dot,
.legend-line {
  display: inline-block;
  margin-right: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-line {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #ccc;
}

.legend-dot.high {
  background: #f56c6c;
}

.legend-dot.medium {
  background: #e6a23c;
}

.legend-dot.low {
  background: #67c23a;
}

.legend-line.pending {
  border-color: #ef4444;
}

.legend-line.confirmed {
  border-color: #2563eb;
}

.legend-line.handled {
  border-color: #10b981;
}

.page-tip {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}

.panel-row {
  align-items: stretch;
}

.panel-col {
  display: flex;
}

.panel-card {
  width: 100%;
}

.panel-card :deep(.el-card__body) {
  padding: 0 22px 22px 22px;
}

.panel-body {
  height: 620px;
}

.panel-fill {
  width: 100%;
  height: 100%;
  border-radius: 18px;
  overflow: hidden;
}

.detail-wrap {
  height: 100%;
  overflow: auto;
}

.map-box {
  min-height: 560px;
}

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}
</style>