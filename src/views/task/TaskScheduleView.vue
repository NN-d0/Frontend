<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前页任务数</div>
          <div class="metric-number">{{ pageState.records.length }}</div>
          <div class="metric-desc">当前分页内展示的任务数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-cyan" shadow="hover">
          <div class="metric-label">任务总数</div>
          <div class="metric-number">{{ pageState.total }}</div>
          <div class="metric-desc">当前筛选条件下总任务数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-green" shadow="hover">
          <div class="metric-label">运行中任务</div>
          <div class="metric-number">{{ runningCount }}</div>
          <div class="metric-desc">当前页内正在运行的任务</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">未启动任务</div>
          <div class="metric-number">{{ pendingCount }}</div>
          <div class="metric-desc">当前页内待执行任务</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">任务查询</div>
            <div class="header-subtitle">按站点、状态、名称快速定位监测任务</div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="openCreateDialog">新增任务</el-button>
            <el-button @click="loadPage">刷新数据</el-button>
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

        <el-form-item label="任务状态">
          <el-select v-model="queryForm.taskStatus" clearable placeholder="请选择状态" style="width: 180px;">
            <el-option label="未启动" :value="0" />
            <el-option label="运行中" :value="1" />
            <el-option label="已停止" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="关键字">
          <el-input v-model="queryForm.keyword" clearable placeholder="任务名称" style="width: 240px;" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="quick-tags">
        <span class="quick-label">快捷状态：</span>
        <el-tag class="click-tag" :effect="queryForm.taskStatus === '' ? 'dark' : 'plain'" @click="setQuickStatus('')">全部</el-tag>
        <el-tag class="click-tag" type="info" :effect="queryForm.taskStatus === 0 ? 'dark' : 'plain'" @click="setQuickStatus(0)">未启动</el-tag>
        <el-tag class="click-tag" type="success" :effect="queryForm.taskStatus === 1 ? 'dark' : 'plain'" @click="setQuickStatus(1)">运行中</el-tag>
        <el-tag class="click-tag" type="danger" :effect="queryForm.taskStatus === 2 ? 'dark' : 'plain'" @click="setQuickStatus(2)">已停止</el-tag>
      </div>
    </el-card>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">任务列表</div>
            <div class="header-subtitle">支持任务新增、修改、删除与分页浏览</div>
          </div>
          <el-tag type="info">共 {{ pageState.total }} 条</el-tag>
        </div>
      </template>

      <el-table :data="pageState.records" stripe border v-loading="loading" empty-text="暂无任务数据" class="beauty-table">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="taskName" label="任务名称" min-width="180" />
        <el-table-column prop="stationName" label="站点名称" min-width="140" />
        <el-table-column prop="deviceName" label="设备名称" min-width="180" />
        <el-table-column label="频率范围(MHz)" min-width="200">
          <template #default="scope">
            <span class="range-text">{{ scope.row.freqStartMhz }} ~ {{ scope.row.freqEndMhz }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sampleRateKhz" label="采样率(kHz)" min-width="120" />
        <el-table-column prop="algorithmMode" label="算法模式" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.algorithmMode === 'AI' ? 'primary' : 'info'">
              {{ scope.row.algorithmMode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taskStatus" label="任务状态" width="110">
          <template #default="scope">
            <el-tag :type="taskStatusTag(scope.row.taskStatus)">
              {{ taskStatusText(scope.row.taskStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cronExpr" label="调度表达式" min-width="180" />
        <el-table-column prop="updateTime" label="更新时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
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
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageState.total"
          :current-page="queryForm.current"
          :page-size="queryForm.size"
          :page-sizes="[10, 20, 30, 50]"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增任务' : '修改任务'" width="820px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <div class="dialog-section-title">任务基础信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="form.taskName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="算法模式" prop="algorithmMode">
              <el-select v-model="form.algorithmMode" style="width: 100%;">
                <el-option label="RULE" value="RULE" />
                <el-option label="AI" value="AI" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="dialog-section-title">任务绑定信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属站点" prop="stationId">
              <el-select
                v-model="form.stationId"
                filterable
                placeholder="请选择站点"
                style="width: 100%;"
                @change="handleFormStationChange"
              >
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
            <el-form-item label="所属设备" prop="deviceId">
              <el-select v-model="form.deviceId" filterable placeholder="请选择设备" style="width: 100%;">
                <el-option
                  v-for="item in filteredDeviceOptions"
                  :key="item.id"
                  :label="item.deviceName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="dialog-section-title">监测参数</div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="起始频率" prop="freqStartMhz">
              <el-input-number v-model="form.freqStartMhz" :precision="3" :step="0.1" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="结束频率" prop="freqEndMhz">
              <el-input-number v-model="form.freqEndMhz" :precision="3" :step="0.1" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="采样率" prop="sampleRateKhz">
              <el-input-number v-model="form.sampleRateKhz" :precision="3" :step="10" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="dialog-section-title">调度信息</div>
        <el-form-item label="任务状态" prop="taskStatus">
          <el-radio-group v-model="form.taskStatus">
            <el-radio :value="0">未启动</el-radio>
            <el-radio :value="1">运行中</el-radio>
            <el-radio :value="2">已停止</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="调度表达式" prop="cronExpr">
          <el-input v-model="form.cronExpr" placeholder="例如：0/5 * * * * ?" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceListApi, getStationListApi } from '../../api/overview'
import {
  createTaskApi,
  deleteTaskApi,
  getTaskPageApi,
  updateTaskApi
} from '../../api/manage'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)

const stationOptions = ref([])
const deviceOptions = ref([])
const pageState = reactive({
  total: 0,
  records: []
})

const queryForm = reactive({
  current: 1,
  size: 10,
  stationId: '',
  taskStatus: '',
  keyword: ''
})

const form = reactive({
  id: null,
  taskName: '',
  stationId: '',
  deviceId: '',
  freqStartMhz: 87.0,
  freqEndMhz: 108.0,
  sampleRateKhz: 200.0,
  algorithmMode: 'RULE',
  taskStatus: 1,
  cronExpr: '0/5 * * * * ?'
})

const rules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  stationId: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
  deviceId: [{ required: true, message: '请选择所属设备', trigger: 'change' }],
  freqStartMhz: [{ required: true, message: '请输入起始频率', trigger: 'change' }],
  freqEndMhz: [{ required: true, message: '请输入结束频率', trigger: 'change' }],
  sampleRateKhz: [{ required: true, message: '请输入采样率', trigger: 'change' }],
  algorithmMode: [{ required: true, message: '请选择算法模式', trigger: 'change' }],
  taskStatus: [{ required: true, message: '请选择任务状态', trigger: 'change' }],
  cronExpr: [{ required: true, message: '请输入调度表达式', trigger: 'blur' }]
}

const filteredDeviceOptions = computed(() => {
  if (!form.stationId) return deviceOptions.value
  return deviceOptions.value.filter(item => item.stationId === form.stationId)
})

const runningCount = computed(() => pageState.records.filter(item => item.taskStatus === 1).length)
const pendingCount = computed(() => pageState.records.filter(item => item.taskStatus === 0).length)

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const taskStatusText = (status) => {
  const map = {
    0: '未启动',
    1: '运行中',
    2: '已停止'
  }
  return map[status] || '未知'
}

const taskStatusTag = (status) => {
  const map = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return map[status] || 'info'
}

const loadStations = async () => {
  const res = await getStationListApi()
  stationOptions.value = res.data || []
}

const loadDevices = async () => {
  const res = await getDeviceListApi()
  deviceOptions.value = res.data || []
}

const loadPage = async () => {
  try {
    loading.value = true
    const res = await getTaskPageApi({
      current: queryForm.current,
      size: queryForm.size,
      stationId: queryForm.stationId || undefined,
      taskStatus: queryForm.taskStatus === '' ? undefined : queryForm.taskStatus,
      keyword: queryForm.keyword || undefined
    })

    const data = res.data || {}
    pageState.total = data.total || 0
    pageState.records = data.records || []
  } finally {
    loading.value = false
  }
}

const setQuickStatus = async (status) => {
  queryForm.taskStatus = status
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
  queryForm.taskStatus = ''
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
  form.taskName = ''
  form.stationId = ''
  form.deviceId = ''
  form.freqStartMhz = 87.0
  form.freqEndMhz = 108.0
  form.sampleRateKhz = 200.0
  form.algorithmMode = 'RULE'
  form.taskStatus = 1
  form.cronExpr = '0/5 * * * * ?'
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  form.id = row.id
  form.taskName = row.taskName
  form.stationId = row.stationId
  form.deviceId = row.deviceId
  form.freqStartMhz = Number(row.freqStartMhz)
  form.freqEndMhz = Number(row.freqEndMhz)
  form.sampleRateKhz = Number(row.sampleRateKhz)
  form.algorithmMode = row.algorithmMode
  form.taskStatus = row.taskStatus
  form.cronExpr = row.cronExpr
  dialogVisible.value = true
}

const handleFormStationChange = () => {
  if (!filteredDeviceOptions.value.some(item => item.id === form.deviceId)) {
    form.deviceId = ''
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()

  const payload = {
    id: form.id,
    taskName: form.taskName,
    stationId: form.stationId,
    deviceId: form.deviceId,
    freqStartMhz: form.freqStartMhz,
    freqEndMhz: form.freqEndMhz,
    sampleRateKhz: form.sampleRateKhz,
    algorithmMode: form.algorithmMode,
    taskStatus: form.taskStatus,
    cronExpr: form.cronExpr
  }

  try {
    submitLoading.value = true

    if (dialogMode.value === 'create') {
      await createTaskApi(payload)
      ElMessage.success('任务新增成功')
    } else {
      await updateTaskApi(payload)
      ElMessage.success('任务修改成功')
    }

    dialogVisible.value = false
    await loadPage()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确认删除任务【${row.taskName}】吗？`, '删除确认', {
    type: 'warning'
  })

  await deleteTaskApi(row.id)
  ElMessage.success('任务删除成功')

  if (pageState.records.length === 1 && queryForm.current > 1) {
    queryForm.current -= 1
  }
  await loadPage()
}

Promise.all([loadStations(), loadDevices()]).then(loadPage)
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quick-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.quick-label {
  color: #8a97ab;
  font-size: 13px;
}

.click-tag {
  cursor: pointer;
}

.range-text {
  color: #334155;
  font-weight: 600;
}

.dialog-section-title {
  margin-bottom: 14px;
  padding-left: 10px;
  border-left: 4px solid #3b82f6;
  font-size: 15px;
  font-weight: 800;
  color: #1f2a37;
}

.beauty-table {
  margin-top: 4px;
}
</style>