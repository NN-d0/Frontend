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
          <div class="metric-desc">运行中任务会被后端定时执行</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">未启动任务</div>
          <div class="metric-number">{{ pendingCount }}</div>
          <div class="metric-desc">未启动任务仅保存，不会自动执行</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">任务查询</div>
            <div class="header-subtitle">支持任务新增、启动、停止、日志查看</div>
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
            <div class="header-subtitle">运行中任务会被调度器自动扫描执行</div>
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
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.taskStatus !== 1"
              link
              type="success"
              @click="handleStartTask(scope.row)"
            >
              启动
            </el-button>

            <el-button
              v-if="scope.row.taskStatus === 1"
              link
              type="warning"
              @click="handleStopTask(scope.row)"
            >
              停止
            </el-button>

            <el-button link type="primary" @click="openLogDrawer(scope.row)">执行日志</el-button>
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
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="logDrawerVisible" size="860px" :title="`任务执行日志 - ${logTask.taskName || ''}`">
      <div class="log-top-summary" v-if="latestLog">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="summary-box">
              <div class="summary-label">最近结果</div>
              <div class="summary-value">
                <el-tag :type="logStatusTag(latestLog.execStatus)">
                  {{ logStatusText(latestLog.execStatus) }}
                </el-tag>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="summary-box">
              <div class="summary-label">最近执行时间</div>
              <div class="summary-text">{{ formatTime(latestLog.executeTime) }}</div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="summary-box">
              <div class="summary-label">最近执行耗时</div>
              <div class="summary-text">{{ latestLog.durationMs || 0 }} ms</div>
            </div>
          </el-col>
        </el-row>

        <div class="latest-message">
          <span class="latest-message-label">最近结果说明：</span>
          <span>{{ latestLog.execMessage || '-' }}</span>
        </div>
      </div>

      <el-table :data="logPage.records" stripe border v-loading="logLoading" empty-text="暂无执行日志">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="execStatus" label="结果状态" width="120">
          <template #default="scope">
            <el-tag :type="logStatusTag(scope.row.execStatus)">
              {{ logStatusText(scope.row.execStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggerType" label="触发方式" width="120" />
        <el-table-column prop="execMessage" label="结果说明" min-width="260" show-overflow-tooltip />
        <el-table-column prop="snapshotId" label="快照ID" width="110" />
        <el-table-column prop="alarmId" label="告警ID" width="110" />
        <el-table-column prop="durationMs" label="耗时(ms)" width="110" />
        <el-table-column prop="executeTime" label="执行时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.executeTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="logPage.total"
          :current-page="logQuery.current"
          :page-size="logQuery.size"
          @current-change="handleLogCurrentChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceListApi, getStationListApi } from '../../api/overview'
import {
  createTaskApi,
  deleteTaskApi,
  getTaskLogPageApi,
  getTaskPageApi,
  startTaskApi,
  stopTaskApi,
  updateTaskApi
} from '../../api/manage'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref(null)

const logDrawerVisible = ref(false)
const logLoading = ref(false)

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
  taskStatus: 0,
  cronExpr: '0/5 * * * * ?'
})

const logTask = reactive({
  id: null,
  taskName: ''
})

const logQuery = reactive({
  current: 1,
  size: 10
})

const logPage = reactive({
  total: 0,
  records: []
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

const latestLog = computed(() => {
  return logPage.records.length > 0 ? logPage.records[0] : null
})

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

const logStatusText = (status) => {
  const map = {
    1: '成功',
    2: '失败',
    3: '已停止'
  }
  return map[status] || '未知'
}

const logStatusTag = (status) => {
  const map = {
    1: 'success',
    2: 'danger',
    3: 'warning'
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
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '任务列表加载失败')
  } finally {
    loading.value = false
  }
}

const loadTaskLogPage = async () => {
  if (!logTask.id) return

  try {
    logLoading.value = true
    const res = await getTaskLogPageApi({
      taskId: logTask.id,
      current: logQuery.current,
      size: logQuery.size
    })

    const data = res.data || {}
    logPage.total = data.total || 0
    logPage.records = data.records || []
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '任务日志加载失败')
  } finally {
    logLoading.value = false
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
  form.taskStatus = 0
  form.cronExpr = '0/5 * * * * ?'
}

const clearFormValidate = async () => {
  await nextTick()
  formRef.value?.clearValidate?.()
}

const openCreateDialog = async () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
  await clearFormValidate()
}

const openEditDialog = async (row) => {
  dialogMode.value = 'edit'
  form.id = row.id
  form.taskName = row.taskName || ''
  form.stationId = row.stationId || ''
  form.deviceId = row.deviceId || ''
  form.freqStartMhz = Number(row.freqStartMhz || 87.0)
  form.freqEndMhz = Number(row.freqEndMhz || 108.0)
  form.sampleRateKhz = Number(row.sampleRateKhz || 200.0)
  form.algorithmMode = row.algorithmMode || 'RULE'
  form.taskStatus = row.taskStatus ?? 0
  form.cronExpr = row.cronExpr || '0/5 * * * * ?'
  dialogVisible.value = true
  await clearFormValidate()
}

const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.clearValidate?.()
}

const handleFormStationChange = () => {
  if (!filteredDeviceOptions.value.some(item => item.id === form.deviceId)) {
    form.deviceId = ''
  }
}

const validateTaskForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleSubmit = async () => {
  const valid = await validateTaskForm()
  if (!valid) {
    ElMessage.warning('请先把任务表单填写完整')
    return
  }

  if (!form.taskName?.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }

  if (!form.stationId) {
    ElMessage.warning('请选择所属站点')
    return
  }

  if (!form.deviceId) {
    ElMessage.warning('请选择所属设备')
    return
  }

  if (!form.cronExpr?.trim()) {
    ElMessage.warning('请输入调度表达式')
    return
  }

  const payload = {
    id: form.id,
    taskName: form.taskName.trim(),
    stationId: form.stationId,
    deviceId: form.deviceId,
    freqStartMhz: form.freqStartMhz,
    freqEndMhz: form.freqEndMhz,
    sampleRateKhz: form.sampleRateKhz,
    algorithmMode: form.algorithmMode,
    taskStatus: form.taskStatus,
    cronExpr: form.cronExpr.trim()
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
    formRef.value?.clearValidate?.()
    await loadPage()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '任务保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除任务【${row.taskName}】吗？`, '删除确认', {
      type: 'warning'
    })

    await deleteTaskApi(row.id)
    ElMessage.success('任务删除成功')

    if (pageState.records.length === 1 && queryForm.current > 1) {
      queryForm.current -= 1
    }
    await loadPage()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error(error)
    ElMessage.error(error?.message || '任务删除失败')
  }
}

const handleStartTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认启动任务【${row.taskName}】吗？启动后将按调度表达式自动执行。`,
      '启动任务',
      { type: 'success' }
    )

    await startTaskApi(row.id)
    ElMessage.success('任务已启动')
    await loadPage()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error(error)
    ElMessage.error(error?.message || '启动任务失败')
  }
}

const handleStopTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认停止任务【${row.taskName}】吗？停止后将不再自动执行。`,
      '停止任务',
      { type: 'warning' }
    )

    await stopTaskApi(row.id)
    ElMessage.success('任务已停止')
    await loadPage()

    if (logDrawerVisible.value && logTask.id === row.id) {
      logQuery.current = 1
      await loadTaskLogPage()
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error(error)
    ElMessage.error(error?.message || '停止任务失败')
  }
}

const openLogDrawer = async (row) => {
  logTask.id = row.id
  logTask.taskName = row.taskName || ''
  logQuery.current = 1
  logDrawerVisible.value = true
  await loadTaskLogPage()
}

const handleLogCurrentChange = async (page) => {
  logQuery.current = page
  await loadTaskLogPage()
}

onMounted(async () => {
  try {
    await Promise.all([loadStations(), loadDevices()])
    await loadPage()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '任务页面初始化失败')
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

.log-top-summary {
  margin-bottom: 18px;
}

.summary-box {
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fbff, #eff6ff);
  border: 1px solid #dbeafe;
}

.summary-label {
  font-size: 13px;
  color: #8a97ab;
}

.summary-value {
  margin-top: 12px;
}

.summary-text {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2a37;
}

.latest-message {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #475569;
  line-height: 1.8;
}

.latest-message-label {
  font-weight: 700;
  color: #1f2a37;
}
</style>