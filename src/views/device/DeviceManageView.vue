<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <div class="device-metric-card">
          <div class="device-metric-label">设备总数</div>
          <div class="device-metric-value">{{ pageState.total }}</div>
          <div class="device-metric-desc">当前筛选条件下的设备总量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="device-metric-card">
          <div class="device-metric-label">当前页数量</div>
          <div class="device-metric-value">{{ pageState.records.length }}</div>
          <div class="device-metric-desc">当前分页结果中的设备数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="device-metric-card">
          <div class="device-metric-label">运行中设备</div>
          <div class="device-metric-value">{{ runningCount }}</div>
          <div class="device-metric-desc">当前页内处于开启状态的设备数量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="device-metric-card">
          <div class="device-metric-label">停止设备</div>
          <div class="device-metric-value">{{ stopCount }}</div>
          <div class="device-metric-desc">当前页内处于停止状态的设备数量</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="page-card status-meaning-card" shadow="never">
      <div class="status-meaning-header">
        <div class="status-meaning-title">状态说明</div>
        <div class="status-meaning-subtitle">
          设备状态现在支持手动快捷开启/停止。只有“存在运行任务且长时间无数据上报”的设备，才会被离线巡检自动打回停止。
        </div>
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
            <div class="header-subtitle">按站点、设备状态、关键字快速筛选设备</div>
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

        <el-form-item label="设备状态">
          <el-select v-model="queryForm.runStatus" clearable placeholder="请选择状态" style="width: 180px;">
            <el-option label="开启" :value="1" />
            <el-option label="停止" :value="0" />
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
        <el-tag class="click-tag" type="success" :effect="queryForm.runStatus === 1 ? 'dark' : 'plain'" @click="setQuickStatus(1)">开启</el-tag>
        <el-tag class="click-tag" type="danger" :effect="queryForm.runStatus === 0 ? 'dark' : 'plain'" @click="setQuickStatus(0)">停止</el-tag>
      </div>
    </el-card>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">设备运行态势地图</div>
            <div class="header-subtitle">按站点展示设备开启/停止分布</div>
          </div>
          <div class="legend-row">
            <span class="legend-item"><i class="legend-dot success"></i>全部开启</span>
            <span class="legend-item"><i class="legend-dot warning"></i>混合状态</span>
            <span class="legend-item"><i class="legend-dot danger"></i>全部停止</span>
            <span class="legend-item"><i class="legend-dot info"></i>暂无设备</span>
          </div>
        </div>
      </template>

      <div class="map-tip">
        点击站点标记可以查看该站点设备明细；手动开启/停止后，地图颜色会同步更新。
      </div>
      <div ref="deviceMapRef" class="map-box"></div>
    </el-card>

    <el-card class="page-card device-list-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">设备列表</div>
            <div class="header-subtitle">格式已与站点管理保持一致，支持快捷开启/停止与按当前筛选一键启停</div>
          </div>
          <div class="header-actions">
            <el-button
              type="success"
              plain
              :disabled="pageState.total === 0"
              @click="handleBatchChangeStatus(1)"
            >
              按当前筛选全部开启
            </el-button>
            <el-button
              type="warning"
              plain
              :disabled="pageState.total === 0"
              @click="handleBatchChangeStatus(0)"
            >
              按当前筛选全部停止
            </el-button>
            <el-tag type="info">共 {{ pageState.total }} 条</el-tag>
          </div>
        </div>
      </template>

      <div class="device-list-tip">
        当前“全部开启/全部停止”会按你上面的筛选条件生效。若未设置筛选条件，则对全部设备生效。
      </div>

      <el-table
        :data="pageState.records"
        stripe
        border
        v-loading="loading"
        empty-text="暂无设备数据"
        class="device-table"
      >
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="deviceCode" label="设备编码" min-width="140" />
        <el-table-column prop="deviceName" label="设备名称" min-width="160" />
        <el-table-column prop="runStatus" label="设备状态" width="110">
          <template #default="scope">
            <el-tag :type="deviceOnlineTag(scope.row.runStatus)">
              {{ deviceStatusText(scope.row.runStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stationName" label="所属站点" min-width="140" />
        <el-table-column prop="deviceType" label="设备类型" width="160">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.deviceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddr" label="IP 地址" min-width="150" />
        <el-table-column prop="lastOnlineTime" label="最近在线时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.lastOnlineTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEditDialog(scope.row)">修改</el-button>
            <el-button
              link
              :type="Number(scope.row.runStatus) === 1 ? 'warning' : 'success'"
              @click="handleToggleStatus(scope.row)"
            >
              {{ Number(scope.row.runStatus) === 1 ? '快捷停止' : '快捷开启' }}
            </el-button>
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
              <div class="station-select-wrap">
                <el-select v-model="form.stationId" filterable clearable placeholder="请选择站点" style="width: 100%;">
                  <el-option
                    v-for="item in stationOptions"
                    :key="item.id"
                    :label="item.stationName"
                    :value="item.id"
                  />
                </el-select>
                <el-button @click="openMapDialog">地图选站</el-button>
              </div>
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
            <el-form-item label="设备状态" prop="runStatus">
              <el-radio-group v-model="form.runStatus">
                <el-radio :value="1">开启</el-radio>
                <el-radio :value="0">停止</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button native-type="button" @click="handleDeviceDialogClose">取消</el-button>
        <el-button native-type="button" type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="mapDialogVisible"
      title="地图选择 / 新建站点"
      width="860px"
      destroy-on-close
      @opened="handleMapDialogOpened"
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
        <div class="select-station-title">{{ mapDialogMode === 'createStation' ? '当前点选结果' : '当前选中站点' }}</div>
        <div class="select-station-content">
          <template v-if="selectedStation.id">
            <div>站点名称：{{ selectedStation.stationName || '-' }}</div>
            <div>站点编码：{{ selectedStation.stationCode || '-' }}</div>
            <div>经纬度：{{ selectedStation.longitude }}, {{ selectedStation.latitude }}</div>
          </template>
          <template v-else-if="hasSelectedCoordinate">
            <div>点选类型：新建站点坐标</div>
            <div>经度：{{ selectedStation.longitude }}</div>
            <div>纬度：{{ selectedStation.latitude }}</div>
            <div>说明：保存站点后会使用这组地图坐标</div>
          </template>
          <template v-else>
            <el-empty :description="mapDialogMode === 'createStation' ? '尚未点选地图坐标' : '尚未选择站点'" :image-size="70" />
          </template>
        </div>
      </el-card>

      <template #footer>
        <el-button native-type="button" @click="handleMapDialogClose">关闭</el-button>
        <el-button
          native-type="button"
          type="primary"
          :disabled="!canConfirmSelectedStation"
          @click="handleConfirmSelectedStation"
        >
          {{ mapDialogMode === 'createStation' ? '回填坐标' : '使用该站点' }}
        </el-button>
        <el-button native-type="button" type="danger" plain :disabled="!selectedStation.id" @click="handleDeleteSelectedStation">删除该站点</el-button>
        <el-button native-type="button" type="success" @click="openCreateStationDialog">新建站点</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="stationDialogVisible"
      title="新建站点"
      width="680px"
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
        <el-form-item label="位置说明">
          <el-input v-model="stationForm.locationText" placeholder="请输入位置说明（可选）" clearable />
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

        <div class="coord-helper-box">
          <div class="coord-helper-title">坐标辅助</div>
          <div class="coord-helper-actions">
            <el-button native-type="button" @click="fillDefaultStationCoordinate">使用默认坐标</el-button>
            <el-button native-type="button" type="primary" plain @click="openMapDialogForCreateStation">地图点选回填</el-button>
          </div>
          <div class="coord-helper-desc">
            默认坐标：114.057868, 22.543099。点击“地图点选回填”后，在地图上点一下即可自动回填到表单。
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button native-type="button" @click="handleStationDialogClose">取消</el-button>
        <el-button native-type="button" type="primary" :loading="stationSubmitLoading" @click="handleCreateStation">保存站点</el-button>
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
  batchChangeDeviceStatusApi,
  changeDeviceStatusApi,
  createDeviceApi,
  createStationApi,
  deleteDeviceApi,
  deleteStationApi,
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

const DEFAULT_LONGITUDE = 114.057868
const DEFAULT_LATITUDE = 22.543099
const DEFAULT_LOCATION_TEXT = '深圳市中心默认演示点'

const loading = ref(false)
const submitLoading = ref(false)
const stationSubmitLoading = ref(false)
const dialogVisible = ref(false)
const mapDialogVisible = ref(false)
const stationDialogVisible = ref(false)
const dialogMode = ref('create')
const mapDialogMode = ref('selectStation')
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
  locationText: DEFAULT_LOCATION_TEXT,
  longitude: DEFAULT_LONGITUDE,
  latitude: DEFAULT_LATITUDE
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
  runStatus: [{ required: true, message: '请选择设备状态', trigger: 'change' }]
}

const stationRules = {
  stationCode: [{ required: true, message: '请输入站点编码', trigger: 'blur' }],
  stationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'change' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'change' }]
}

const runningCount = computed(() => pageState.records.filter(item => Number(item.runStatus) === 1).length)
const stopCount = computed(() => pageState.records.filter(item => Number(item.runStatus) === 0).length)
const hasSelectedCoordinate = computed(() => selectedStation.longitude !== null && selectedStation.latitude !== null)
const canConfirmSelectedStation = computed(() => {
  if (mapDialogMode.value === 'createStation') {
    return hasSelectedCoordinate.value
  }
  return !!selectedStation.id
})

let deviceStatusMap = null
let deviceStatusLayer = null
let stationSelectMap = null
let stationSelectLayer = null
let pendingCreateMarker = null

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const deviceStatusText = (status) => {
  return Number(status) === 1 ? '开启' : '停止'
}

const emitStationDeviceChanged = (action, extra = {}) => {
  const payload = {
    action,
    stationId: extra.stationId ?? null,
    deviceId: extra.deviceId ?? null,
    at: Date.now()
  }

  try {
    localStorage.setItem('radioStationDeviceChangedAt', String(payload.at))
    localStorage.setItem('radioStationDeviceChangedPayload', JSON.stringify(payload))
  } catch (error) {
    console.warn('写入站点/设备联动事件失败', error)
  }

  window.dispatchEvent(new CustomEvent('radio-station-device-changed', { detail: payload }))
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
  const online = deviceList.filter(item => Number(item.runStatus) === 1).length
  const offline = deviceList.filter(item => Number(item.runStatus) === 0).length

  const detailHtml = deviceList.length > 0
    ? deviceList.map(item => {
        const statusText = deviceStatusText(item.runStatus)
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
      <div style="margin-top:4px;color:#606266;">开启：${online} / 停止：${offline}</div>
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

const destroyStationSelectMap = () => {
  if (pendingCreateMarker) {
    try {
      pendingCreateMarker.remove()
    } catch (error) {
      // ignore
    }
    pendingCreateMarker = null
  }

  if (stationSelectLayer) {
    try {
      stationSelectLayer.clearLayers()
    } catch (error) {
      // ignore
    }
    stationSelectLayer = null
  }

  if (stationSelectMap) {
    try {
      stationSelectMap.off()
      stationSelectMap.remove()
    } catch (error) {
      // ignore
    }
    stationSelectMap = null
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

  stationSelectMap.on('click', async (event) => {
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

    if (!String(stationForm.locationText || '').trim() || String(stationForm.locationText || '').trim() === DEFAULT_LOCATION_TEXT) {
      stationForm.locationText = `地图选点(${selectedStation.longitude}, ${selectedStation.latitude})`
    }

    stationFormRef.value?.clearValidate?.(['longitude', 'latitude'])

    pendingCreateMarker = L.marker([event.latlng.lat, event.latlng.lng], {
      icon: createDivIcon(buildPendingMarkerHtml(), 36, 42, 18, 42, -36)
    }).addTo(stationSelectLayer)

    if (mapDialogMode.value === 'createStation') {
      await nextTick()
      mapDialogVisible.value = false
      stationDialogVisible.value = true
      ElMessage.success(`已自动回填坐标：${selectedStation.longitude}, ${selectedStation.latitude}`)
    }
  })
}

const renderStationSelectMap = async () => {
  await nextTick()
  initStationSelectMap()
  if (!stationSelectMap || !stationSelectLayer) return

  await nextTick()
  stationSelectMap.invalidateSize(true)

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

      if (pendingCreateMarker) {
        pendingCreateMarker.remove()
        pendingCreateMarker = null
      }

      if (mapDialogMode.value === 'createStation') {
        stationForm.longitude = station.longitude
        stationForm.latitude = station.latitude
        if (!String(stationForm.locationText || '').trim() || String(stationForm.locationText || '').trim() === DEFAULT_LOCATION_TEXT) {
          stationForm.locationText = station.locationText || `地图选点(${station.longitude}, ${station.latitude})`
        }
        stationFormRef.value?.clearValidate?.(['longitude', 'latitude'])
      }
    })

    marker.addTo(stationSelectLayer)
  })

  await nextTick()

  if (validStations.length > 0) {
    const bounds = L.latLngBounds(validStations.map(item => [item.latitude, item.longitude]))
    stationSelectMap.fitBounds(bounds.pad(0.25))
  } else {
    stationSelectMap.setView([DEFAULT_LATITUDE, DEFAULT_LONGITUDE], 11)
  }

  stationSelectMap.invalidateSize(true)
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

const resetStationForm = () => {
  stationForm.stationCode = ''
  stationForm.stationName = ''
  stationForm.locationText = DEFAULT_LOCATION_TEXT
  stationForm.longitude = DEFAULT_LONGITUDE
  stationForm.latitude = DEFAULT_LATITUDE
}

const fillDefaultStationCoordinate = () => {
  stationForm.longitude = DEFAULT_LONGITUDE
  stationForm.latitude = DEFAULT_LATITUDE
  if (!String(stationForm.locationText || '').trim()) {
    stationForm.locationText = DEFAULT_LOCATION_TEXT
  }
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

  const payload = {
    id: form.id,
    deviceCode: String(form.deviceCode || '').trim(),
    deviceName: String(form.deviceName || '').trim(),
    stationId: form.stationId,
    deviceType: form.deviceType,
    ipAddr: String(form.ipAddr || '').trim(),
    runStatus: form.runStatus,
    remark: String(form.remark || '').trim()
  }

  try {
    submitLoading.value = true

    if (dialogMode.value === 'create') {
      await createDeviceApi(payload)
      ElMessage.success('设备新增成功')
      emitStationDeviceChanged('device-created', {
        stationId: payload.stationId
      })
    } else {
      await updateDeviceApi(payload)
      ElMessage.success('设备修改成功')
      emitStationDeviceChanged('device-updated', {
        stationId: payload.stationId,
        deviceId: payload.id
      })
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

const handleToggleStatus = async (row) => {
  const targetStatus = Number(row.runStatus) === 1 ? 0 : 1
  const actionText = targetStatus === 1 ? '开启' : '停止'

  try {
    await ElMessageBox.confirm(`确认${actionText}设备【${row.deviceName}】吗？`, '快捷状态切换', {
      type: 'warning'
    })

    await changeDeviceStatusApi({
      id: row.id,
      runStatus: targetStatus
    })

    ElMessage.success(`设备已${actionText}`)
    emitStationDeviceChanged('device-status-changed', {
      stationId: row.stationId,
      deviceId: row.id
    })
    await refreshAllData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error(error?.message || `设备${actionText}失败`)
    }
  }
}

const handleBatchChangeStatus = async (targetStatus) => {
  const actionText = targetStatus === 1 ? '全部开启' : '全部停止'
  try {
    await ElMessageBox.confirm(
      `确认按当前筛选条件执行【${actionText}】吗？未设置筛选条件时会作用于全部设备。`,
      '批量状态切换确认',
      { type: 'warning' }
    )

    const res = await batchChangeDeviceStatusApi({
      stationId: queryForm.stationId || null,
      sourceRunStatus: queryForm.runStatus === '' ? null : queryForm.runStatus,
      keyword: String(queryForm.keyword || '').trim() || null,
      targetRunStatus: targetStatus
    })

    const updatedCount = res?.data ?? 0
    ElMessage.success(`${actionText}完成，共处理 ${updatedCount} 台设备`)
    emitStationDeviceChanged('device-batch-status-changed', {
      stationId: queryForm.stationId || null
    })
    await refreshAllData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error(error?.message || `${actionText}失败`)
    }
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

    emitStationDeviceChanged('device-deleted', {
      stationId: row.stationId,
      deviceId: row.id
    })
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
  mapDialogMode.value = 'selectStation'
  resetSelectedStation()
  mapDialogVisible.value = true
}

const openMapDialogForCreateStation = async () => {
  stationDialogVisible.value = false
  mapDialogMode.value = 'createStation'
  resetSelectedStation()
  mapDialogVisible.value = true
}

const handleMapDialogOpened = async () => {
  await renderStationSelectMap()

  window.requestAnimationFrame(() => {
    stationSelectMap?.invalidateSize?.(true)
  })

  setTimeout(() => {
    stationSelectMap?.invalidateSize?.(true)
  }, 220)
}

const handleMapDialogClose = () => {
  mapDialogVisible.value = false
  if (mapDialogMode.value === 'createStation') {
    stationDialogVisible.value = true
  }
  mapDialogMode.value = 'selectStation'
  resetSelectedStation()
  destroyStationSelectMap()
}

const handleConfirmSelectedStation = () => {
  if (mapDialogMode.value === 'createStation') {
    if (selectedStation.longitude === null || selectedStation.latitude === null) {
      ElMessage.warning('请先在地图上点选位置')
      return
    }

    stationForm.longitude = selectedStation.longitude
    stationForm.latitude = selectedStation.latitude
    if (!String(stationForm.locationText || '').trim() || String(stationForm.locationText || '').trim() === DEFAULT_LOCATION_TEXT) {
      stationForm.locationText = `地图选点(${selectedStation.longitude}, ${selectedStation.latitude})`
    }

    stationFormRef.value?.clearValidate?.(['longitude', 'latitude'])

    mapDialogVisible.value = false
    stationDialogVisible.value = true
    ElMessage.success('坐标已回填到站点表单')
    return
  }

  if (!selectedStation.id) {
    ElMessage.warning('请先选择一个站点')
    return
  }

  form.stationId = selectedStation.id
  formRef.value?.clearValidate?.(['stationId'])
  mapDialogVisible.value = false
  ElMessage.success('已选择站点')
}

const openCreateStationDialog = async () => {
  if (mapDialogVisible.value) {
    mapDialogMode.value = 'selectStation'
    mapDialogVisible.value = false
    await nextTick()
  }

  stationDialogVisible.value = true
  resetStationForm()
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
    stationCode: String(stationForm.stationCode || '').trim(),
    stationName: String(stationForm.stationName || '').trim(),
    locationText: String(stationForm.locationText || '').trim() || null,
    longitude: stationForm.longitude,
    latitude: stationForm.latitude
  }

  try {
    stationSubmitLoading.value = true
    const res = await createStationApi(payload)
    const createdId = Number(res?.data?.id ?? res?.data ?? 0) || null
    ElMessage.success('站点新增成功')

    await loadStationOptions()
    await loadDeviceMapData()
    await nextTick()
    await renderDeviceStatusMap()
    await renderStationSelectMap()

    if (createdId) {
      form.stationId = createdId
    }

    emitStationDeviceChanged('station-created', {
      stationId: createdId
    })

    stationDialogVisible.value = false
    stationFormRef.value?.clearValidate?.()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '站点新增失败')
  } finally {
    stationSubmitLoading.value = false
  }
}


const handleDeleteSelectedStation = async () => {
  if (!selectedStation.id) {
    ElMessage.warning('请先选择一个已有站点')
    return
  }

  formRef.value?.clearValidate?.()
  stationFormRef.value?.clearValidate?.()

  try {
    await ElMessageBox.confirm(
      `确认删除站点【${selectedStation.stationName || '-'}】吗？该站点下关联的设备、任务、快照、告警和日志会一并删除。`,
      '删除站点确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    const deletedStationId = selectedStation.id

    await deleteStationApi(deletedStationId)

    if (Number(queryForm.stationId) === Number(deletedStationId)) {
      queryForm.stationId = ''
      queryForm.current = 1
    }
    if (Number(form.stationId) === Number(deletedStationId)) {
      form.stationId = ''
    }

    resetSelectedStation()
    ElMessage.success('站点删除成功，关联设备和任务数据已同步清理')

    emitStationDeviceChanged('station-deleted', {
      stationId: deletedStationId
    })

    await refreshAllData()
    await nextTick()
    await renderStationSelectMap()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error(error)
      ElMessage.error(error?.message || '站点删除失败')
    }
  }
}

const handleTaskDeviceLinkageChanged = async () => {
  await refreshAllData()
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
  window.addEventListener('task-device-linkage-changed', handleTaskDeviceLinkageChanged)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('task-device-linkage-changed', handleTaskDeviceLinkageChanged)

  if (deviceStatusMap) {
    deviceStatusMap.remove()
    deviceStatusMap = null
  }

  destroyStationSelectMap()
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 112px);
}

.top-metrics {
  margin-bottom: 16px;
}

.device-metric-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e8eef8;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

.device-metric-label {
  font-size: 13px;
  color: #8a97ab;
}

.device-metric-value {
  margin-top: 12px;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
  color: #1f2a37;
}

.device-metric-desc {
  margin-top: 10px;
  font-size: 13px;
  color: #607086;
  line-height: 1.6;
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
  flex-wrap: wrap;
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

.map-tip,
.device-list-tip {
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

.device-table :deep(.el-table__header th) {
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

.station-select-wrap {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  width: 100%;
}

.coord-helper-box {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fafcff;
}

.coord-helper-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a37;
}

.coord-helper-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.coord-helper-desc {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #607086;
}

@media (max-width: 900px) {
  .status-meaning-grid {
    grid-template-columns: 1fr;
  }

  .station-select-wrap {
    grid-template-columns: 1fr;
  }
}
</style>
