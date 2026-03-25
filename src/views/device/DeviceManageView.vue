<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前页设备数</div>
          <div class="metric-number">{{ pageState.records.length }}</div>
          <div class="metric-desc">分页结果中的当前页数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">设备总数</div>
          <div class="metric-number">{{ pageState.total }}</div>
          <div class="metric-desc">当前筛选条件下的设备总量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">在线设备</div>
          <div class="metric-number">{{ runningCount }}</div>
          <div class="metric-desc">当前页内离线超时内有采集数据的设备数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-red" shadow="hover">
          <div class="metric-label">离线设备</div>
          <div class="metric-number">{{ stopCount }}</div>
          <div class="metric-desc">当前页内超过离线阈值未收到采集数据的设备数量</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card status-meaning-card" shadow="never">
      <div class="status-meaning-header">
        <div class="status-meaning-title">状态说明</div>
        <div class="status-meaning-subtitle">设备页展示的是“在线状态”，依据最近采集数据是否超时判定，不等同于任务是否启动。</div>
      </div>
      <div class="status-meaning-grid">
        <div v-for="item in deviceStatusTips" :key="item.value" class="status-meaning-item">
          <el-tag :type="item.tagType">{{ item.label }}</el-tag>
          <div class="status-meaning-text">{{ item.meaning }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">设备查询</div>
            <div class="header-subtitle">按站点、在线状态、关键字快速筛选设备</div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="openCreateDialog">新增设备</el-button>
            <el-button @click="refreshAllData">刷新数据</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="所属站点">
          <el-select v-model="queryForm.stationId" clearable filterable placeholder="请选择站点" style="width: 220px;">
            <el-option
              v-for="item in stationOptions"
              :key="item.id"
              :label="item.stationName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="设备在线状态">
          <el-select v-model="queryForm.runStatus" clearable placeholder="请选择状态" style="width: 180px;">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键字">
          <el-input v-model="queryForm.keyword" clearable placeholder="设备编码 / 设备名称" style="width: 240px;" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="quick-tags">
        <span class="quick-label">快捷状态：</span>
        <el-tag class="click-tag" :effect="queryForm.runStatus === '' ? 'dark' : 'plain'" @click="setQuickStatus('')">全部</el-tag>
        <el-tag class="click-tag" type="success" :effect="queryForm.runStatus === 1 ? 'dark' : 'plain'" @click="setQuickStatus(1)">在线</el-tag>
        <el-tag class="click-tag" type="danger" :effect="queryForm.runStatus === 0 ? 'dark' : 'plain'" @click="setQuickStatus(0)">离线</el-tag>
      </div>
    </el-card>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">设备在线态势地图</div>
            <div class="header-subtitle">按站点展示设备在线/离线分布</div>
          </div>
          <div class="legend-row">
            <span class="legend-item"><i class="legend-dot success"></i>全部在线</span>
            <span class="legend-item"><i class="legend-dot warning"></i>混合状态</span>
            <span class="legend-item"><i class="legend-dot danger"></i>全部离线</span>
            <span class="legend-item"><i class="legend-dot info"></i>暂无设备</span>
          </div>
        </div>
      </template>

      <div class="map-tip">
        点击站点标记可以查看该站点设备明细。点击“地图选择/新建站点”可以直接在地图上选中已有站点，或者点击地图空白处新建站点。
      </div>
      <div ref="deviceMapRef" class="map-box"></div>
    </el-card>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">设备列表</div>
            <div class="header-subtitle">支持分页浏览、新增、修改、删除</div>
          </div>
          <el-tag type="info">共 {{ pageState.total }} 条</el-tag>
        </div>
      </template>

      <el-table
        :data="pageState.records"
        stripe
        border
        v-loading="loading"
        empty-text="暂无设备数据"
        class="beauty-table"
      >
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="deviceCode" label="设备编码" min-width="150" />
        <el-table-column prop="deviceName" label="设备名称" min-width="160" />
        <el-table-column prop="stationName" label="所属站点" min-width="140" />
        <el-table-column prop="deviceType" label="设备类型" width="150">
          <template #default="scope">
            <el-tag type="info">
              {{ scope.row.deviceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddr" label="IP 地址" min-width="150" />
        <el-table-column prop="runStatus" label="在线状态" width="110">
          <template #default="scope">
            <el-tag :type="deviceOnlineTag(scope.row.runStatus)">
              {{ deviceOnlineText(scope.row.runStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastOnlineTime" label="最后在线时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.lastOnlineTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEditDialog(scope.row)">修改</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="pageState.total"
          :current-page="queryForm.current"
          :page-size="queryForm.size"
          :page-sizes="[10, 20, 30, 50]"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增设备' : '修改设备'"
      width="720px"
      destroy-on-close
      @close="handleDeviceDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属站点" prop="stationId">
              <el-select v-model="form.stationId" filterable clearable placeholder="请选择站点" style="width: 100%;">
                <el-option
                  v-for="item in stationOptions"
                  :key="item.id"
                  :label="item.stationName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="form.deviceType" placeholder="请选择设备类型" style="width: 100%;">
                <el-option label="SPECTRUM_SENSOR" value="SPECTRUM_SENSOR" />
                <el-option label="MONITOR_HOST" value="MONITOR_HOST" />
                <el-option label="PORTABLE_NODE" value="PORTABLE_NODE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="IP 地址" prop="ipAddr">
              <el-input v-model="form.ipAddr" placeholder="请输入设备 IP" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备在线状态" prop="runStatus">
              <el-radio-group v-model="form.runStatus">
                <el-radio :value="1">在线</el-radio>
                <el-radio :value="0">离线</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDeviceDialogClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="mapDialogVisible"
      title="地图选择 / 新建站点"
      width="860px"
      destroy-on-close
      @close="handleMapDialogClose"
    >
      <div class="map-dialog-toolbar">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="点击已有站点可直接选中；点击地图空白处可创建一个新的站点。"
        />
      </div>

      <div ref="stationMapRef" class="station-map-box"></div>

      <el-card class="select-station-card" shadow="never">
        <div class="select-station-title">当前选中站点</div>
        <div class="select-station-content">
          <template v-if="selectedStation.id">
            <div>站点名称：{{ selectedStation.stationName || '-' }}</div>
            <div>站点编码：{{ selectedStation.stationCode || '-' }}</div>
            <div>经纬度：{{ selectedStation.longitude }}, {{ selectedStation.latitude }}</div>
          </template>
          <template v-else>
            <el-empty description="尚未选择站点" :image-size="70" />
          </template>
        </div>
      </el-card>

      <template #footer>
        <el-button @click="handleMapDialogClose">关闭</el-button>
        <el-button type="primary" :disabled="!selectedStation.id" @click="handleConfirmSelectedStation">使用该站点</el-button>
        <el-button type="success" @click="openCreateStationDialog">新建站点</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="stationDialogVisible"
      title="新建站点"
      width="620px"
      destroy-on-close
      @close="handleStationDialogClose"
    >
      <el-form ref="stationFormRef" :model="stationForm" :rules="stationRules" label-width="110px">
        <el-form-item label="站点编码" prop="stationCode">
          <el-input v-model="stationForm.stationCode" placeholder="请输入站点编码" />
        </el-form-item>
        <el-form-item label="站点名称" prop="stationName">
          <el-input v-model="stationForm.stationName" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="位置说明" prop="locationText">
          <el-input v-model="stationForm.locationText" placeholder="请输入位置说明" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="stationForm.longitude" :precision="6" :step="0.000001" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="stationForm.latitude" :precision="6" :step="0.000001" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="handleStationDialogClose">取消</el-button>
        <el-button type="primary" :loading="stationSubmitLoading" @click="handleCreateStation">保存站点</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import L from 'leaflet'
import { getDeviceListApi, getStationListApi } from '../../api/overview'
import {
  createDeviceApi,
  createStationApi,
  deleteDeviceApi,
  getDevicePageApi,
  updateDeviceApi
} from '../../api/manage'
import {
  deviceOnlineColor,
  deviceOnlineTag,
  deviceOnlineText,
  deviceStatusTips,
  getStationDeviceOnlineMeta
} from '../../utils/status'

const loading = ref(false)
const submitLoading = ref(false)
const stationSubmitLoading = ref(false)
const dialogVisible = ref(false)
const mapDialogVisible = ref(false)
const stationDialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)
const stationFormRef = ref(null)
const stationMapRef = ref(null)
const deviceMapRef = ref(null)

const stationOptions = ref([])
const allDeviceList = ref([])

const pageState = reactive({
  total: 0,
  records: []
})

const queryForm = reactive({
  current: 1,
  size: 10,
  stationId: '',
  runStatus: '',
  keyword: ''
})

const form = reactive({
  id: null,
  deviceCode: '',
  deviceName: '',
  stationId: '',
  deviceType: 'SPECTRUM_SENSOR',
  ipAddr: '',
  runStatus: 1,
  remark: ''
})

const stationForm = reactive({
  stationCode: '',
  stationName: '',
  locationText: '',
  longitude: 114.057868,
  latitude: 22.543099
})

const selectedStation = reactive({
  id: null,
  stationCode: '',
  stationName: '',
  locationText: '',
  longitude: null,
  latitude: null
})

const rules = {
  deviceCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  stationId: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  ipAddr: [{ required: true, message: '请输入 IP 地址', trigger: 'blur' }],
  runStatus: [{ required: true, message: '请选择设备在线状态', trigger: 'change' }]
}

const stationRules = {
  stationCode: [{ required: true, message: '请输入站点编码', trigger: 'blur' }],
  stationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  locationText: [{ required: true, message: '请输入位置说明', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'change' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'change' }]
}

const runningCount = computed(() => pageState.records.filter(item => item.runStatus === 1).length)
const stopCount = computed(() => pageState.records.filter(item => item.runStatus === 0).length)

let deviceStatusMap = null
let deviceStatusLayer = null
let stationSelectMap = null
let stationSelectLayer = null
let pendingCreateMarker = null

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const buildStationDeviceMap = () => {
  const map = new Map()
  allDeviceList.value.forEach(item => {
    if (!map.has(item.stationId)) {
      map.set(item.stationId, [])
    }
    map.get(item.stationId).push(item)
  })
  return map
}

const getStationStatusMeta = (devices) => getStationDeviceOnlineMeta(devices)

const buildStatusMarkerHtml = (station, devices) => {
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

const buildStationPopupHtml = (station, deviceList) => {
  const total = deviceList.length
  const online = deviceList.filter(item => item.runStatus === 1).length
  const offline = deviceList.filter(item => item.runStatus === 0).length

  const detailHtml = deviceList.length > 0
    ? deviceList.map(item => {
        const statusText = deviceOnlineText(item.runStatus)
        const statusColor = deviceOnlineColor(item.runStatus)
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px 10px;background:#f7f9fc;border-radius:8px;">
            <span style="color:#303133;">${item.deviceName}</span>
            <span style="color:${statusColor};font-weight:600;">${statusText}</span>
          </div>
        `
      }).join('')
    : '<div style="margin-top:10px;color:#909399;">暂无设备</div>'

  return `
    <div style="width:300px;padding:2px 2px 6px 2px;">
      <div style="font-size:16px;font-weight:700;color:#303133;">${station.stationName || '-'}</div>
      <div style="margin-top:8px;color:#606266;">站点编码：${station.stationCode || '-'}</div>
      <div style="margin-top:4px;color:#606266;">位置：${station.locationText || '-'}</div>
      <div style="margin-top:4px;color:#606266;">设备总数：${total}</div>
      <div style="margin-top:4px;color:#606266;">在线：${online} / 离线：${offline}</div>
      <div style="margin-top:12px;font-weight:700;color:#303133;">设备明细</div>
      ${detailHtml}
    </div>
  `
}

const buildSelectMarkerHtml = (station) => {
  return `
    <div style="position:relative;transform:translate(-22px,-48px);">
      <div style="
        min-width:82px;
        padding:8px 12px;
        border-radius:14px;
        background:#409eff;
        color:#fff;
        box-shadow:0 8px 20px rgba(64,158,255,0.28);
        border:2px solid rgba(255,255,255,0.95);
        text-align:center;
      ">
        <div style="font-size:12px;font-weight:700;white-space:nowrap;">${station.stationName || '站点'}</div>
      </div>
      <div style="
        position:absolute;
        left:50%;
        bottom:-10px;
        width:0;height:0;
        border-left:9px solid transparent;
        border-right:9px solid transparent;
        border-top:11px solid #409eff;
        transform:translateX(-50%);
      "></div>
    </div>
  `
}

const buildPendingMarkerHtml = () => {
  return `
    <div style="position:relative;transform:translate(-18px,-42px);">
      <div style="
        width:36px;
        height:36px;
        border-radius:50%;
        background:#e6a23c;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:16px;
        border:3px solid rgba(255,255,255,0.96);
        box-shadow:0 8px 20px rgba(230,162,60,0.32);
      ">+</div>
      <div style="
        position:absolute;
        left:50%;
        bottom:-9px;
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:10px solid #e6a23c;
        transform:translateX(-50%);
      "></div>
    </div>
  `
}

const createDivIcon = (html, width = 48, height = 58, anchorX = 24, anchorY = 58, popupY = -48) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html,
    iconSize: [width, height],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, popupY]
  })
}

const initDeviceStatusMap = () => {
  if (deviceStatusMap || !deviceMapRef.value) return

  deviceStatusMap = L.map(deviceMapRef.value, {
    zoomControl: true
  }).setView([22.55, 114.05], 10)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(deviceStatusMap)

  deviceStatusLayer = L.layerGroup().addTo(deviceStatusMap)
}

const renderDeviceStatusMap = async () => {
  initDeviceStatusMap()
  if (!deviceStatusMap || !deviceStatusLayer) return

  deviceStatusLayer.clearLayers()

  const stationDeviceMap = buildStationDeviceMap()
  const validStations = stationOptions.value.filter(item => item.latitude && item.longitude)

  validStations.forEach(station => {
    const devices = stationDeviceMap.get(station.id) || []
    const marker = L.marker([station.latitude, station.longitude], {
      icon: createDivIcon(buildStatusMarkerHtml(station, devices))
    })

    marker.bindPopup(buildStationPopupHtml(station, devices), {
      maxWidth: 340
    })

    marker.addTo(deviceStatusLayer)
  })

  await nextTick()

  if (validStations.length > 0) {
    const bounds = L.latLngBounds(validStations.map(item => [item.latitude, item.longitude]))
    deviceStatusMap.fitBounds(bounds.pad(0.25))
  }
}

const initStationSelectMap = () => {
  if (stationSelectMap || !stationMapRef.value) return

  stationSelectMap = L.map(stationMapRef.value, {
    zoomControl: true
  }).setView([22.55, 114.05], 11)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(stationSelectMap)

  stationSelectLayer = L.layerGroup().addTo(stationSelectMap)

  stationSelectMap.on('click', (event) => {
    if (pendingCreateMarker) {
      pendingCreateMarker.remove()
      pendingCreateMarker = null
    }

    selectedStation.id = null
    selectedStation.stationCode = ''
    selectedStation.stationName = ''
    selectedStation.locationText = ''
    selectedStation.longitude = Number(event.latlng.lng.toFixed(6))
    selectedStation.latitude = Number(event.latlng.lat.toFixed(6))

    stationForm.longitude = selectedStation.longitude
    stationForm.latitude = selectedStation.latitude

    pendingCreateMarker = L.marker([event.latlng.lat, event.latlng.lng], {
      icon: createDivIcon(buildPendingMarkerHtml(), 36, 42, 18, 42, -36)
    }).addTo(stationSelectLayer)
  })
}

const renderStationSelectMap = async () => {
  initStationSelectMap()
  if (!stationSelectMap || !stationSelectLayer) return

  stationSelectLayer.clearLayers()
  pendingCreateMarker = null

  const validStations = stationOptions.value.filter(item => item.latitude && item.longitude)

  validStations.forEach(station => {
    const marker = L.marker([station.latitude, station.longitude], {
      icon: createDivIcon(buildSelectMarkerHtml(station), 82, 48, 22, 48, -40)
    })

    marker.on('click', () => {
      selectedStation.id = station.id
      selectedStation.stationCode = station.stationCode || ''
      selectedStation.stationName = station.stationName || ''
      selectedStation.locationText = station.locationText || ''
      selectedStation.longitude = station.longitude
      selectedStation.latitude = station.latitude
    })

    marker.addTo(stationSelectLayer)
  })

  await nextTick()

  if (validStations.length > 0) {
    const bounds = L.latLngBounds(validStations.map(item => [item.latitude, item.longitude]))
    stationSelectMap.fitBounds(bounds.pad(0.25))
  }
}

const loadStationOptions = async () => {
  const res = await getStationListApi()
  stationOptions.value = res.data || []
}

const loadDeviceMapData = async () => {
  const res = await getDeviceListApi()
  allDeviceList.value = res.data || []
}

const loadPage = async () => {
  try {
    loading.value = true
    const res = await getDevicePageApi({
      current: queryForm.current,
      size: queryForm.size,
      stationId: queryForm.stationId || undefined,
      runStatus: queryForm.runStatus === '' ? undefined : queryForm.runStatus,
      keyword: queryForm.keyword || undefined
    })
    const data = res.data || {}
    pageState.total = data.total || 0
    pageState.records = data.records || []
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '设备列表加载失败')
  } finally {
    loading.value = false
  }
}

const refreshAllData = async () => {
  await Promise.all([loadStationOptions(), loadDeviceMapData(), loadPage()])
  await nextTick()
  await renderDeviceStatusMap()
}

const setQuickStatus = async (status) => {
  queryForm.runStatus = status
  queryForm.current = 1
  await loadPage()
}

const handleSearch = async () => {
  queryForm.current = 1
  await loadPage()
}

const resetQuery = async () => {
  queryForm.current = 1
  queryForm.size = 10
  queryForm.stationId = ''
  queryForm.runStatus = ''
  queryForm.keyword = ''
  await loadPage()
}

const handleCurrentChange = async (page) => {
  queryForm.current = page
  await loadPage()
}

const handleSizeChange = async (size) => {
  queryForm.size = size
  queryForm.current = 1
  await loadPage()
}

const resetForm = () => {
  form.id = null
  form.deviceCode = ''
  form.deviceName = ''
  form.stationId = ''
  form.deviceType = 'SPECTRUM_SENSOR'
  form.ipAddr = ''
  form.runStatus = 1
  form.remark = ''
}

const clearDeviceValidate = async () => {
  await nextTick()
  formRef.value?.clearValidate?.()
}

const clearStationValidate = async () => {
  await nextTick()
  stationFormRef.value?.clearValidate?.()
}

const openCreateDialog = async () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
  await clearDeviceValidate()
}

const openEditDialog = async (row) => {
  dialogMode.value = 'edit'
  form.id = row.id
  form.deviceCode = row.deviceCode || ''
  form.deviceName = row.deviceName || ''
  form.stationId = row.stationId || ''
  form.deviceType = row.deviceType || 'SPECTRUM_SENSOR'
  form.ipAddr = row.ipAddr || ''
  form.runStatus = row.runStatus ?? 1
  form.remark = row.remark || ''
  dialogVisible.value = true
  await clearDeviceValidate()
}

const handleDeviceDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.clearValidate?.()
}

const validateDeviceForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleSubmit = async () => {
  const valid = await validateDeviceForm()
  if (!valid) {
    ElMessage.warning('请先把设备表单填写完整')
    return
  }

  if (!form.deviceCode?.trim()) {
    ElMessage.warning('请输入设备编码')
    return
  }

  if (!form.deviceName?.trim()) {
    ElMessage.warning('请输入设备名称')
    return
  }

  if (!form.stationId) {
    ElMessage.warning('请选择所属站点')
    return
  }

  if (!form.ipAddr?.trim()) {
    ElMessage.warning('请输入设备 IP')
    return
  }

  const payload = {
    id: form.id,
    deviceCode: form.deviceCode.trim(),
    deviceName: form.deviceName.trim(),
    stationId: form.stationId,
    deviceType: form.deviceType,
    ipAddr: form.ipAddr.trim(),
    runStatus: form.runStatus,
    remark: form.remark?.trim() || ''
  }

  try {
    submitLoading.value = true

    if (dialogMode.value === 'create') {
      await createDeviceApi(payload)
      ElMessage.success('设备新增成功')
    } else {
      await updateDeviceApi(payload)
      ElMessage.success('设备修改成功')
    }

    dialogVisible.value = false
    formRef.value?.clearValidate?.()
    await refreshAllData()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '设备保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除设备【${row.deviceName}】吗？`, '删除确认', {
      type: 'warning'
    })

    await deleteDeviceApi(row.id)
    ElMessage.success('设备删除成功')

    if (pageState.records.length === 1 && queryForm.current > 1) {
      queryForm.current -= 1
    }

    await refreshAllData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error(error?.message || '设备删除失败')
    }
  }
}

const resetSelectedStation = () => {
  selectedStation.id = null
  selectedStation.stationCode = ''
  selectedStation.stationName = ''
  selectedStation.locationText = ''
  selectedStation.longitude = null
  selectedStation.latitude = null
}

const openMapDialog = async () => {
  mapDialogVisible.value = true
  resetSelectedStation()
  await nextTick()
  await renderStationSelectMap()
}

const handleMapDialogClose = () => {
  mapDialogVisible.value = false
  resetSelectedStation()
}

const handleConfirmSelectedStation = () => {
  if (!selectedStation.id) {
    ElMessage.warning('请先选择一个站点')
    return
  }

  form.stationId = selectedStation.id
  mapDialogVisible.value = false
  ElMessage.success('已选择站点')
}

const openCreateStationDialog = async () => {
  stationDialogVisible.value = true
  stationForm.stationCode = ''
  stationForm.stationName = ''
  stationForm.locationText = ''
  await clearStationValidate()
}

const handleStationDialogClose = () => {
  stationDialogVisible.value = false
  stationFormRef.value?.clearValidate?.()
}

const validateStationForm = async () => {
  if (!stationFormRef.value) return false
  try {
    await stationFormRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleCreateStation = async () => {
  const valid = await validateStationForm()
  if (!valid) {
    ElMessage.warning('请先把站点表单填写完整')
    return
  }

  const payload = {
    stationCode: stationForm.stationCode.trim(),
    stationName: stationForm.stationName.trim(),
    locationText: stationForm.locationText.trim(),
    longitude: stationForm.longitude,
    latitude: stationForm.latitude
  }

  try {
    stationSubmitLoading.value = true
    const res = await createStationApi(payload)
    const created = res.data || {}
    ElMessage.success('站点新增成功')

    await loadStationOptions()
    await loadDeviceMapData()
    await nextTick()
    await renderDeviceStatusMap()
    await renderStationSelectMap()

    if (created.id) {
      form.stationId = created.id
    }

    stationDialogVisible.value = false
    stationFormRef.value?.clearValidate?.()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '站点新增失败')
  } finally {
    stationSubmitLoading.value = false
  }
}

const handleResize = () => {
  if (deviceStatusMap) {
    deviceStatusMap.invalidateSize()
  }
  if (stationSelectMap) {
    stationSelectMap.invalidateSize()
  }
}

onMounted(async () => {
  await refreshAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (deviceStatusMap) {
    deviceStatusMap.remove()
    deviceStatusMap = null
  }

  if (stationSelectMap) {
    stationSelectMap.remove()
    stationSelectMap = null
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
  position: relative;
  overflow: hidden;
  border-radius: 18px;
}

.metric-card::after {
  content: '';
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.metric-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.metric-number {
  margin-top: 14px;
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
  color: #ffffff;
}

.metric-desc {
  margin-top: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
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

.metric-red {
  background: linear-gradient(135deg, #f56c6c, #ff8f8f);
}

.page-card {
  border-radius: 18px;
}

.query-card {
  margin-top: 0;
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
}

.filter-form {
  margin-bottom: 10px;
}

.quick-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-label {
  font-size: 13px;
  color: #606266;
}

.click-tag {
  cursor: pointer;
  user-select: none;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #606266;
}

.legend-item {
  display: inline-flex;
  align-items: center;
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

.map-tip {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
}

.map-box {
  width: 100%;
  height: 420px;
  border-radius: 14px;
  overflow: hidden;
}

.beauty-table :deep(.el-table__header th) {
  background: #f7f9fc;
  color: #303133;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.map-dialog-toolbar {
  margin-bottom: 12px;
}

.station-map-box {
  width: 100%;
  height: 420px;
  border-radius: 14px;
  overflow: hidden;
}

.select-station-card {
  margin-top: 16px;
  border-radius: 14px;
}

.select-station-title {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}

.select-station-content {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  color: #606266;
  font-size: 13px;
}

.status-meaning-card {
  margin-bottom: 16px;
  border: 1px solid #e4ecf7;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.status-meaning-header {
  margin-bottom: 14px;
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

.status-meaning-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.status-meaning-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #f7faff;
  border: 1px solid #e8eef8;
  border-radius: 12px;
}

.status-meaning-text {
  line-height: 1.6;
  color: #606266;
  font-size: 13px;
}

@media (max-width: 900px) {
  .status-meaning-grid {
    grid-template-columns: 1fr;
  }
}
</style>