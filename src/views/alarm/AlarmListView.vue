<template>
  <div class="page-container">
    <el-row :gutter="16" class="top-metrics">
      <el-col :span="6">
        <el-card class="metric-card metric-red" shadow="hover">
          <div class="metric-label">告警总数</div>
          <div class="metric-number">{{ pageState.total }}</div>
          <div class="metric-desc">当前筛选条件下总告警数量</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-orange" shadow="hover">
          <div class="metric-label">当前页未处理</div>
          <div class="metric-number">{{ pendingCount }}</div>
          <div class="metric-desc">当前页重点待处置告警</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-blue" shadow="hover">
          <div class="metric-label">当前页已确认</div>
          <div class="metric-number">{{ confirmedCount }}</div>
          <div class="metric-desc">已确认待进一步处理</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="metric-card metric-purple" shadow="hover">
          <div class="metric-label">当前页高等级</div>
          <div class="metric-number">{{ highLevelCount }}</div>
          <div class="metric-desc">高风险告警数量</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card query-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">告警查询</div>
            <div class="header-subtitle">按处理状态、站点、关键字快速定位告警</div>
          </div>
          <div class="header-actions">
            <el-button @click="loadPage">刷新数据</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="处理状态">
          <el-select
            v-model="queryForm.alarmStatus"
            placeholder="请选择状态"
            clearable
            style="width: 180px;"
          >
            <el-option label="未处理" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已处理" :value="2" />
          </el-select>
        </el-form-item>

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

        <el-form-item label="关键字">
          <el-input
            v-model="queryForm.keyword"
            placeholder="告警标题 / 告警编号"
            clearable
            style="width: 240px;"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="quick-tags">
        <span class="quick-label">快捷状态：</span>
        <el-tag class="click-tag" :effect="queryForm.alarmStatus === '' ? 'dark' : 'plain'" @click="setQuickStatus('')">全部</el-tag>
        <el-tag class="click-tag" type="danger" :effect="queryForm.alarmStatus === 0 ? 'dark' : 'plain'" @click="setQuickStatus(0)">未处理</el-tag>
        <el-tag class="click-tag" type="warning" :effect="queryForm.alarmStatus === 1 ? 'dark' : 'plain'" @click="setQuickStatus(1)">已确认</el-tag>
        <el-tag class="click-tag" type="success" :effect="queryForm.alarmStatus === 2 ? 'dark' : 'plain'" @click="setQuickStatus(2)">已处理</el-tag>
      </div>
    </el-card>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">告警列表</div>
            <div class="header-subtitle">已补充“确认 / 处理”闭环操作</div>
          </div>
          <el-tag type="info">共 {{ pageState.total }} 条</el-tag>
        </div>
      </template>

      <el-table :data="pageState.records" stripe border v-loading="loading" empty-text="暂无告警数据" class="beauty-table">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="alarmNo" label="告警编号" min-width="170" />
        <el-table-column prop="stationName" label="站点名称" min-width="140" />
        <el-table-column prop="deviceName" label="设备名称" min-width="180" />
        <el-table-column prop="alarmType" label="告警类型" min-width="130" />
        <el-table-column prop="alarmLevel" label="告警级别" width="110">
          <template #default="scope">
            <el-tag :type="alarmLevelTag(scope.row.alarmLevel)">
              {{ scope.row.alarmLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="告警标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="alarmStatus" label="处理状态" width="110">
          <template #default="scope">
            <el-tag :type="alarmStatusTag(scope.row.alarmStatus)">
              {{ alarmStatusText(scope.row.alarmStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alarmTime" label="告警时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.alarmTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>

            <el-button
              v-if="scope.row.alarmStatus === 0"
              link
              type="warning"
              @click="handleConfirm(scope.row)"
            >
              确认
            </el-button>

            <el-button
              v-if="scope.row.alarmStatus !== 2"
              link
              type="success"
              @click="openHandleDialog(scope.row)"
            >
              处理
            </el-button>
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

    <el-drawer v-model="detailVisible" title="告警详情" size="640px">
      <div v-if="currentAlarm" class="detail-shell">
        <div class="detail-top-card">
          <div class="detail-main-title">{{ currentAlarm.title || '未命名告警' }}</div>
          <div class="detail-top-tags">
            <el-tag :type="alarmLevelTag(currentAlarm.alarmLevel)">{{ currentAlarm.alarmLevel || '-' }}</el-tag>
            <el-tag :type="alarmStatusTag(currentAlarm.alarmStatus)">{{ alarmStatusText(currentAlarm.alarmStatus) }}</el-tag>
          </div>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警编号">{{ currentAlarm.alarmNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警类型">{{ currentAlarm.alarmType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="站点名称">{{ currentAlarm.stationName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentAlarm.deviceName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警时间">{{ formatTime(currentAlarm.alarmTime) }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ formatTime(currentAlarm.confirmTime) }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ formatTime(currentAlarm.handleTime) }}</el-descriptions-item>
          <el-descriptions-item label="处理备注">{{ currentAlarm.handleNote || '-' }}</el-descriptions-item>
          <el-descriptions-item label="告警内容" :span="2">{{ currentAlarm.content || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <el-dialog v-model="handleDialogVisible" title="处理告警" width="560px">
      <el-form :model="handleForm" label-width="90px">
        <el-form-item label="告警编号">
          <el-input :model-value="handleForm.alarmNo" disabled />
        </el-form-item>

        <el-form-item label="处理备注">
          <el-input
            v-model="handleForm.handleNote"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注，例如：已完成人工复核，确认干扰已消除"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="submitHandle">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStationListApi } from '../../api/overview'
import { getAlarmPageApi, confirmAlarmApi, handleAlarmApi } from '../../api/alarm'

const loading = ref(false)
const stationOptions = ref([])
const detailVisible = ref(false)
const currentAlarm = ref(null)

const handleDialogVisible = ref(false)
const handleLoading = ref(false)
const handleForm = reactive({
  alarmId: null,
  alarmNo: '',
  handleNote: ''
})

const queryForm = reactive({
  current: 1,
  size: 10,
  alarmStatus: '',
  stationId: '',
  keyword: ''
})

const pageState = reactive({
  total: 0,
  records: []
})

const pendingCount = computed(() => pageState.records.filter(item => item.alarmStatus === 0).length)
const confirmedCount = computed(() => pageState.records.filter(item => item.alarmStatus === 1).length)
const highLevelCount = computed(() => pageState.records.filter(item => item.alarmLevel === 'HIGH').length)

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

const loadStationOptions = async () => {
  const res = await getStationListApi()
  stationOptions.value = res.data || []
}

const loadPage = async () => {
  try {
    loading.value = true

    const res = await getAlarmPageApi({
      current: queryForm.current,
      size: queryForm.size,
      alarmStatus: queryForm.alarmStatus === '' ? undefined : queryForm.alarmStatus,
      stationId: queryForm.stationId || undefined,
      keyword: queryForm.keyword || undefined
    })

    const data = res.data || {}
    pageState.total = data.total || 0
    pageState.records = data.records || []
  } catch (error) {
    console.error(error)
    ElMessage.error('告警数据加载失败')
  } finally {
    loading.value = false
  }
}

const setQuickStatus = async (status) => {
  queryForm.alarmStatus = status
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
  queryForm.alarmStatus = ''
  queryForm.stationId = ''
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

const openDetail = (row) => {
  currentAlarm.value = row
  detailVisible.value = true
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(`确认将告警【${row.alarmNo}】标记为“已确认”吗？`, '确认操作', {
      type: 'warning'
    })

    await confirmAlarmApi({
      alarmId: row.id
    })

    ElMessage.success('告警已确认')
    await loadPage()
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    console.error(error)
    ElMessage.error('告警确认失败')
  }
}

const openHandleDialog = (row) => {
  handleForm.alarmId = row.id
  handleForm.alarmNo = row.alarmNo
  handleForm.handleNote = row.handleNote || ''
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  if (!handleForm.alarmId) {
    ElMessage.warning('未找到告警主键')
    return
  }

  try {
    handleLoading.value = true

    await handleAlarmApi({
      alarmId: handleForm.alarmId,
      handleNote: handleForm.handleNote
    })

    ElMessage.success('告警已处理')
    handleDialogVisible.value = false
    await loadPage()
  } catch (error) {
    console.error(error)
    ElMessage.error('告警处理失败')
  } finally {
    handleLoading.value = false
  }
}

onMounted(async () => {
  await loadStationOptions()
  await loadPage()
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

.metric-red::before,
.metric-orange::before,
.metric-blue::before,
.metric-purple::before {
  content: '';
  display: block;
  height: 4px;
  margin: -18px -22px 16px;
}

.metric-red::before {
  background: linear-gradient(90deg, #ef4444, #fca5a5);
}
.metric-orange::before {
  background: linear-gradient(90deg, #f59e0b, #fcd34d);
}
.metric-blue::before {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}
.metric-purple::before {
  background: linear-gradient(90deg, #8b5cf6, #c4b5fd);
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

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-top-card {
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #f2f6ff 100%);
  border: 1px solid #e8eef8;
}

.detail-main-title {
  font-size: 18px;
  font-weight: 800;
  color: #1f2a37;
}

.detail-top-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
</style>