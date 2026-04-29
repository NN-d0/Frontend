<template>
  <el-card class="page-card station-manage-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div>
          <div class="header-title">站点管理</div>
          <div class="header-subtitle">支持新增、修改、删除、启停，删除前会校验是否存在关联设备或任务</div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="openCreateDialog">新增站点</el-button>
          <el-button :loading="loading" @click="loadStationList">刷新站点</el-button>
        </div>
      </div>
    </template>

    <el-row :gutter="16" class="station-metrics">
      <el-col :span="6">
        <div class="station-metric-card">
          <div class="station-metric-label">站点总数</div>
          <div class="station-metric-value">{{ stationList.length }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="station-metric-card">
          <div class="station-metric-label">在线站点</div>
          <div class="station-metric-value">{{ onlineCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="station-metric-card">
          <div class="station-metric-label">离线站点</div>
          <div class="station-metric-value">{{ offlineCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="station-metric-card">
          <div class="station-metric-label">筛选结果</div>
          <div class="station-metric-value">{{ filteredStationList.length }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="station-status-tip-list">
      <div v-for="item in stationStatusTips" :key="item.value" class="station-status-tip-item">
        <el-tag :type="item.tagType">{{ item.label }}</el-tag>
        <div class="station-status-tip-text">{{ item.meaning }}</div>
      </div>
    </div>

    <el-form :inline="true" :model="queryForm" class="filter-form">
      <el-form-item label="站点状态">
        <el-select v-model="queryForm.onlineStatus" clearable placeholder="请选择状态" style="width: 180px;">
          <el-option label="在线" :value="1" />
          <el-option label="离线" :value="0" />
        </el-select>
      </el-form-item>

      <el-form-item label="关键字">
        <el-input
          v-model="queryForm.keyword"
          clearable
          placeholder="站点编码 / 站点名称 / 位置说明"
          style="width: 280px;"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="quick-tags">
      <span class="quick-label">快捷状态：</span>
      <el-tag class="click-tag" :effect="queryForm.onlineStatus === '' ? 'dark' : 'plain'" @click="setQuickStatus('')">全部</el-tag>
      <el-tag class="click-tag" type="success" :effect="queryForm.onlineStatus === 1 ? 'dark' : 'plain'" @click="setQuickStatus(1)">在线</el-tag>
      <el-tag class="click-tag" type="danger" :effect="queryForm.onlineStatus === 0 ? 'dark' : 'plain'" @click="setQuickStatus(0)">离线</el-tag>
    </div>

    <el-table
      :data="filteredStationList"
      stripe
      border
      v-loading="loading"
      empty-text="暂无站点数据"
      class="station-table"
    >
      <el-table-column type="index" label="序号" width="70" />
      <el-table-column prop="stationCode" label="站点编码" min-width="130" />
      <el-table-column prop="stationName" label="站点名称" min-width="150" />
      <el-table-column prop="onlineStatus" label="站点状态" width="110">
        <template #default="scope">
          <el-tag :type="stationOnlineTag(scope.row.onlineStatus)">
            {{ stationOnlineText(scope.row.onlineStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="longitude" label="经度" min-width="120" />
      <el-table-column prop="latitude" label="纬度" min-width="120" />
      <el-table-column prop="locationText" label="位置说明" min-width="220" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="updateTime" label="更新时间" min-width="180">
        <template #default="scope">
          {{ formatTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openEditDialog(scope.row)">修改</el-button>
          <el-button
            link
            :type="Number(scope.row.onlineStatus) === 1 ? 'warning' : 'success'"
            @click="handleToggleStatus(scope.row)"
          >
            {{ Number(scope.row.onlineStatus) === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增站点' : '修改站点'"
      width="760px"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="站点编码" prop="stationCode">
              <el-input v-model="form.stationCode" placeholder="请输入站点编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点名称" prop="stationName">
              <el-input v-model="form.stationName" placeholder="请输入站点名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="位置说明">
          <el-input v-model="form.locationText" placeholder="请输入位置说明（可选）" clearable />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number
                v-model="form.longitude"
                :precision="6"
                :step="0.000001"
                :min="73"
                :max="136"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number
                v-model="form.latitude"
                :precision="6"
                :step="0.000001"
                :min="3"
                :max="54"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="coord-helper-card">
          <div class="coord-helper-header">
            <div class="coord-helper-title">坐标辅助</div>
            <div class="coord-helper-subtitle">默认坐标使用深圳市中心；也可以在地图上单击选点后自动回填经纬度。</div>
          </div>

          <div class="coord-helper-actions">
            <el-button @click="fillDefaultCoords">使用默认坐标</el-button>
            <el-button type="primary" plain @click="openMapPicker">地图点选回填</el-button>
            <el-button @click="syncLocationTextWithCoords">按坐标生成位置说明</el-button>
          </div>

          <div class="coord-helper-meta">
            <div class="coord-helper-item">
              <span class="coord-helper-label">当前经度：</span>
              <span class="coord-helper-value">{{ formatCoord(form.longitude) }}</span>
            </div>
            <div class="coord-helper-item">
              <span class="coord-helper-label">当前纬度：</span>
              <span class="coord-helper-value">{{ formatCoord(form.latitude) }}</span>
            </div>
            <div class="coord-helper-item">
              <span class="coord-helper-label">默认点：</span>
              <span class="coord-helper-value">{{ DEFAULT_LONGITUDE }}, {{ DEFAULT_LATITUDE }}</span>
            </div>
          </div>
        </div>

        <el-form-item label="站点状态" prop="onlineStatus">
          <el-radio-group v-model="form.onlineStatus">
            <el-radio :value="1">在线</el-radio>
            <el-radio :value="0">离线</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="mapDialogVisible"
      title="地图点选站点位置"
      width="860px"
      top="5vh"
      @opened="initMapPicker"
    >
      <div class="map-picker-wrap">
        <div class="map-toolbar">
          <div class="map-toolbar-left">
            <div class="map-toolbar-title">点选说明</div>
            <div class="map-toolbar-desc">
              在地图上单击任意位置即可选点。若外网不可用导致底图空白，仍可使用默认坐标或手动输入经纬度。
            </div>
          </div>
          <div class="map-toolbar-right">
            <el-button @click="resetMapToDefault">回到默认点</el-button>
            <el-button @click="locateByFormCoords">定位到当前表单坐标</el-button>
          </div>
        </div>

        <div class="picked-info-card">
          <div class="picked-info-item">
            <span class="picked-info-label">待回填经度：</span>
            <span class="picked-info-value">{{ formatCoord(pickedPoint.longitude) }}</span>
          </div>
          <div class="picked-info-item">
            <span class="picked-info-label">待回填纬度：</span>
            <span class="picked-info-value">{{ formatCoord(pickedPoint.latitude) }}</span>
          </div>
          <div class="picked-info-item">
            <span class="picked-info-label">位置说明：</span>
            <span class="picked-info-value">{{ pickedPoint.locationText || '尚未生成' }}</span>
          </div>
        </div>

        <div ref="mapRef" class="leaflet-map"></div>
      </div>

      <template #footer>
        <el-button @click="mapDialogVisible = false">取消</el-button>
        <el-button @click="fillDefaultCoords">使用默认坐标</el-button>
        <el-button type="primary" @click="confirmMapPick">回填到表单</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getStationListApi } from '../../api/overview'
import {
  changeStationStatusApi,
  createStationApi,
  deleteStationApi,
  updateStationApi
} from '../../api/manage'
import {
  stationOnlineTag,
  stationOnlineText,
  stationStatusTips
} from '../../utils/status'

const DEFAULT_LONGITUDE = 114.057868
const DEFAULT_LATITUDE = 22.543099
const DEFAULT_LOCATION_TEXT = '深圳市中心默认演示点'

const emit = defineEmits(['changed'])

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const mapDialogVisible = ref(false)
const formRef = ref(null)
const mapRef = ref(null)
const stationList = ref([])

const queryForm = reactive({
  onlineStatus: '',
  keyword: ''
})

const form = reactive({
  id: null,
  stationCode: '',
  stationName: '',
  locationText: '',
  longitude: DEFAULT_LONGITUDE,
  latitude: DEFAULT_LATITUDE,
  onlineStatus: 1,
  remark: ''
})

const pickedPoint = reactive({
  longitude: DEFAULT_LONGITUDE,
  latitude: DEFAULT_LATITUDE,
  locationText: DEFAULT_LOCATION_TEXT
})

const rules = {
  stationCode: [{ required: true, message: '请输入站点编码', trigger: 'blur' }],
  stationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  longitude: [{ required: true, message: '请输入经度', trigger: 'change' }],
  latitude: [{ required: true, message: '请输入纬度', trigger: 'change' }],
  onlineStatus: [{ required: true, message: '请选择站点状态', trigger: 'change' }]
}

let leafletMap = null
let pickedMarker = null
let mapTileLayer = null

const onlineCount = computed(() => stationList.value.filter(item => Number(item.onlineStatus) === 1).length)
const offlineCount = computed(() => stationList.value.filter(item => Number(item.onlineStatus) === 0).length)

const filteredStationList = computed(() => {
  const keyword = String(queryForm.keyword || '').trim().toLowerCase()
  return stationList.value.filter(item => {
    const statusMatch = queryForm.onlineStatus === '' || Number(item.onlineStatus) === Number(queryForm.onlineStatus)
    if (!statusMatch) {
      return false
    }
    if (!keyword) {
      return true
    }
    const text = [
      item.stationCode,
      item.stationName,
      item.locationText,
      item.remark
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(keyword)
  })
})

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatCoord = (value) => {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return '-'
  }
  return number.toFixed(6)
}

const buildCoordLocationText = (longitude, latitude) => {
  return `地图选点(${Number(longitude).toFixed(6)}, ${Number(latitude).toFixed(6)})`
}

const loadStationList = async () => {
  try {
    loading.value = true
    const res = await getStationListApi()
    stationList.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '站点数据加载失败')
  } finally {
    loading.value = false
  }
}

const setQuickStatus = (status) => {
  queryForm.onlineStatus = status
}

const handleSearch = async () => {
  await loadStationList()
}

const resetQuery = async () => {
  queryForm.onlineStatus = ''
  queryForm.keyword = ''
  await loadStationList()
}

const resetForm = () => {
  form.id = null
  form.stationCode = ''
  form.stationName = ''
  form.locationText = DEFAULT_LOCATION_TEXT
  form.longitude = DEFAULT_LONGITUDE
  form.latitude = DEFAULT_LATITUDE
  form.onlineStatus = 1
  form.remark = ''
  syncPickedPointFromForm()
}

const clearValidate = async () => {
  await nextTick()
  formRef.value?.clearValidate?.()
}

const fillDefaultCoords = () => {
  form.longitude = DEFAULT_LONGITUDE
  form.latitude = DEFAULT_LATITUDE
  if (!String(form.locationText || '').trim()) {
    form.locationText = DEFAULT_LOCATION_TEXT
  }
  syncPickedPointFromForm()
  if (leafletMap) {
    locateByCoords(DEFAULT_LATITUDE, DEFAULT_LONGITUDE, 12)
  }
  ElMessage.success('已回填默认经纬度')
}

const syncLocationTextWithCoords = () => {
  form.locationText = buildCoordLocationText(form.longitude, form.latitude)
  ElMessage.success('已按坐标生成位置说明')
}

const openCreateDialog = async () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
  await clearValidate()
}

const openEditDialog = async (row) => {
  dialogMode.value = 'edit'
  form.id = row?.id ?? null
  form.stationCode = row?.stationCode || ''
  form.stationName = row?.stationName || ''
  form.locationText = row?.locationText || ''
  form.longitude = Number(row?.longitude ?? DEFAULT_LONGITUDE)
  form.latitude = Number(row?.latitude ?? DEFAULT_LATITUDE)
  form.onlineStatus = Number(row?.onlineStatus ?? 1)
  form.remark = row?.remark || ''
  syncPickedPointFromForm()
  dialogVisible.value = true
  await clearValidate()
}

const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.clearValidate?.()
}

const validateForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleSubmit = async () => {
  const valid = await validateForm()
  if (!valid) {
    ElMessage.warning('请先完善站点表单')
    return
  }

  const payload = {
    id: form.id,
    stationCode: String(form.stationCode || '').trim(),
    stationName: String(form.stationName || '').trim(),
    locationText: String(form.locationText || '').trim() || null,
    longitude: Number(form.longitude),
    latitude: Number(form.latitude),
    onlineStatus: Number(form.onlineStatus),
    remark: String(form.remark || '').trim()
  }

  try {
    submitLoading.value = true
    if (dialogMode.value === 'create') {
      await createStationApi(payload)
      ElMessage.success('站点新增成功')
    } else {
      await updateStationApi(payload)
      ElMessage.success('站点修改成功')
    }

    dialogVisible.value = false
    await loadStationList()
    emit('changed')
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || (dialogMode.value === 'create' ? '站点新增失败' : '站点修改失败'))
  } finally {
    submitLoading.value = false
  }
}

const handleToggleStatus = async (row) => {
  const nextStatus = Number(row?.onlineStatus) === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}站点【${row?.stationName || '-'}】吗？`,
      '站点状态切换',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    )

    await changeStationStatusApi({
      id: row.id,
      onlineStatus: nextStatus
    })

    ElMessage.success(`站点已${actionText}`)
    await loadStationList()
    emit('changed')
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    console.error(error)
    ElMessage.error(error?.message || '站点状态更新失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除站点【${row?.stationName || '-'}】吗？删除前会校验是否存在关联设备或任务。`,
      '删除站点',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    await deleteStationApi(row.id)
    ElMessage.success('站点删除成功')
    await loadStationList()
    emit('changed')
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    console.error(error)
    ElMessage.error(error?.message || '站点删除失败')
  }
}

const syncPickedPointFromForm = () => {
  pickedPoint.longitude = Number(form.longitude ?? DEFAULT_LONGITUDE)
  pickedPoint.latitude = Number(form.latitude ?? DEFAULT_LATITUDE)
  pickedPoint.locationText = String(form.locationText || '').trim() || buildCoordLocationText(pickedPoint.longitude, pickedPoint.latitude)
}

const setPickedMarker = (latitude, longitude) => {
  if (!leafletMap) {
    return
  }

  if (pickedMarker) {
    pickedMarker.setLatLng([latitude, longitude])
    return
  }

  pickedMarker = L.circleMarker([latitude, longitude], {
    radius: 8,
    color: '#2563eb',
    weight: 3,
    fillColor: '#60a5fa',
    fillOpacity: 0.9
  }).addTo(leafletMap)
}

const handleMapClick = (event) => {
  const { lat, lng } = event.latlng
  pickedPoint.longitude = Number(lng.toFixed(6))
  pickedPoint.latitude = Number(lat.toFixed(6))
  pickedPoint.locationText = buildCoordLocationText(pickedPoint.longitude, pickedPoint.latitude)
  setPickedMarker(lat, lng)
}

const locateByCoords = (latitude, longitude, zoom = 12) => {
  if (!leafletMap) {
    return
  }
  leafletMap.setView([latitude, longitude], zoom)
  setPickedMarker(latitude, longitude)
}

const initMapPicker = async () => {
  await nextTick()

  const latitude = Number(form.latitude ?? DEFAULT_LATITUDE)
  const longitude = Number(form.longitude ?? DEFAULT_LONGITUDE)

  if (!mapRef.value) {
    return
  }

  if (!leafletMap) {
    leafletMap = L.map(mapRef.value, {
      center: [latitude, longitude],
      zoom: 12,
      preferCanvas: true
    })

    mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'OpenStreetMap'
    })

    mapTileLayer.addTo(leafletMap)
    leafletMap.on('click', handleMapClick)
  }

  syncPickedPointFromForm()
  locateByCoords(pickedPoint.latitude, pickedPoint.longitude, 12)

  setTimeout(() => {
    leafletMap?.invalidateSize()
  }, 100)
}

const openMapPicker = async () => {
  if (!dialogVisible.value) {
    return
  }
  syncPickedPointFromForm()
  mapDialogVisible.value = true
}

const resetMapToDefault = () => {
  pickedPoint.longitude = DEFAULT_LONGITUDE
  pickedPoint.latitude = DEFAULT_LATITUDE
  pickedPoint.locationText = DEFAULT_LOCATION_TEXT
  locateByCoords(DEFAULT_LATITUDE, DEFAULT_LONGITUDE, 12)
}

const locateByFormCoords = () => {
  syncPickedPointFromForm()
  locateByCoords(pickedPoint.latitude, pickedPoint.longitude, 12)
}

const confirmMapPick = () => {
  form.longitude = Number(pickedPoint.longitude)
  form.latitude = Number(pickedPoint.latitude)
  if (!String(form.locationText || '').trim() || form.locationText === DEFAULT_LOCATION_TEXT || String(form.locationText).startsWith('地图选点(')) {
    form.locationText = pickedPoint.locationText
  }
  mapDialogVisible.value = false
  ElMessage.success('地图选点已回填到表单')
}

onMounted(async () => {
  await loadStationList()
})

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.off('click', handleMapClick)
    leafletMap.remove()
    leafletMap = null
    pickedMarker = null
    mapTileLayer = null
  }
})
</script>

<style scoped>
.page-card {
  margin-top: 16px;
  border-radius: 18px;
}

.station-manage-card {
  border: 1px solid #e8eef8;
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

.station-metrics {
  margin-bottom: 14px;
}

.station-metric-card {
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e8eef8;
}

.station-metric-label {
  font-size: 13px;
  color: #8a97ab;
}

.station-metric-value {
  margin-top: 12px;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
  color: #1f2a37;
}

.station-status-tip-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.station-status-tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #f7faff;
  border: 1px solid #e8eef8;
  border-radius: 12px;
}

.station-status-tip-text {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

.filter-form {
  margin-bottom: 10px;
}

.quick-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.quick-label {
  font-size: 13px;
  color: #606266;
}

.click-tag {
  cursor: pointer;
  user-select: none;
}

.station-table :deep(.el-table__header th) {
  background: #f7f9fc;
  color: #303133;
}

.coord-helper-card {
  margin: 4px 0 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #dbeafe;
}

.coord-helper-header {
  margin-bottom: 12px;
}

.coord-helper-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a37;
}

.coord-helper-subtitle {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.coord-helper-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.coord-helper-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.coord-helper-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.coord-helper-label {
  font-size: 12px;
  color: #94a3b8;
}

.coord-helper-value {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.map-picker-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.map-toolbar-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2a37;
}

.map-toolbar-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.map-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.picked-info-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.picked-info-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.picked-info-label {
  font-size: 12px;
  color: #94a3b8;
}

.picked-info-value {
  margin-left: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  word-break: break-all;
}

.leaflet-map {
  width: 100%;
  height: 460px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #dbeafe;
  background: #eef4ff;
}

@media (max-width: 900px) {
  .station-status-tip-list,
  .coord-helper-meta,
  .picked-info-card {
    grid-template-columns: 1fr;
  }

  .map-toolbar {
    flex-direction: column;
  }

  .map-toolbar-right {
    flex-wrap: wrap;
  }
}
</style>
