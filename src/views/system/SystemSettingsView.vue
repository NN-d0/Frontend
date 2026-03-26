<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="overview-card ai-card service-card" shadow="hover">
          <div class="metric-title">AI 服务状态</div>
          <div class="metric-value">{{ serviceStatusText }}</div>
          <div class="metric-sub">Core 通过 /health 检查 Flask AI 当前可达性</div>
          <div class="metric-tag-wrap">
            <el-tag :type="serviceTagType">{{ serviceStatusText }}</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card ai-card cnn-card" shadow="hover">
          <div class="metric-title">CNN 加载状态</div>
          <div class="metric-value">{{ cnnStatusText }}</div>
          <div class="metric-sub">直接判断模型是否已真正加载成功</div>
          <div class="metric-tag-wrap">
            <el-tag :type="cnnTagType">{{ cnnStatusText }}</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card ai-card path-card" shadow="hover">
          <div class="metric-title">模型路径检查</div>
          <div class="metric-value">{{ checkpointStatusText }}</div>
          <div class="metric-sub">检查 checkpoint 路径是否存在且是文件</div>
          <div class="metric-tag-wrap">
            <el-tag :type="checkpointTagType">{{ checkpointStatusText }}</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="overview-card ai-card risk-card" shadow="hover">
          <div class="metric-title">RULE 回退风险</div>
          <div class="metric-value">{{ fallbackRiskText }}</div>
          <div class="metric-sub">答辩前重点看这里，避免“看似在跑 CNN”</div>
          <div class="metric-tag-wrap">
            <el-tag :type="riskTagType">{{ fallbackRiskText }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      class="top-alert"
      :type="riskAlertType"
      show-icon
      :closable="false"
      :title="aiHealth.summary || '尚未获取 AI 健康状态'"
      :description="aiHealth.fallbackRiskReason || '请点击刷新 AI 状态，检查 CNN 是否已加载成功。'"
    />

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">AI 诊断信息</div>
            <div class="header-subtitle">
              这里集中展示 Flask /health、Core 当前 AI 配置、CNN 路径校验和 fallback 风险结论
            </div>
          </div>
          <div class="header-actions">
            <el-button :loading="aiLoading" @click="loadAiHealth">刷新 AI 状态</el-button>
            <el-tag :type="riskTagType">{{ fallbackRiskText }}</el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border class="ai-desc">
        <el-descriptions-item label="Core AI 开关">
          <el-tag :type="aiHealth.aiEnabled ? 'success' : 'info'">
            {{ aiHealth.aiEnabled ? '已启用' : '已关闭' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Flask 服务状态">
          <el-tag :type="serviceTagType">{{ serviceStatusText }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Flask 基础地址">
          <span class="mono-text">{{ aiHealth.aiBaseUrl || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="健康检查地址">
          <span class="mono-text">{{ aiHealth.aiHealthUrl || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="默认推理模式">
          <el-tag type="primary">{{ normalizeMode(aiHealth.defaultMode) }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="允许规则回退">
          <el-tag :type="aiHealth.allowRuleFallback ? 'warning' : 'success'">
            {{ aiHealth.allowRuleFallback ? '允许' : '不允许' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="规则模型">
          <span>{{ aiHealth.ruleModelName || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="规则模型可用">
          <el-tag :type="aiHealth.ruleModelAvailable ? 'success' : 'danger'">
            {{ aiHealth.ruleModelAvailable ? '可用' : '不可用' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="CNN 模型">
          <span>{{ aiHealth.cnnModelName || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="CNN 已加载">
          <el-tag :type="cnnTagType">{{ cnnStatusText }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="模型路径存在">
          <el-tag :type="aiHealth.cnnCheckpointExists ? 'success' : 'danger'">
            {{ aiHealth.cnnCheckpointExists ? '存在' : '不存在' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="模型路径为文件">
          <el-tag :type="aiHealth.cnnCheckpointIsFile ? 'success' : 'danger'">
            {{ aiHealth.cnnCheckpointIsFile ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="模型文件路径" :span="2">
          <span class="mono-text">{{ aiHealth.cnnCheckpointPath || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="推理设备">
          <span>{{ aiHealth.cnnDevice || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="输入形状">
          <span>{{ inputShapeText }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="Fallback 风险">
          <el-tag :type="riskTagType">{{ fallbackRiskText }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="风险等级">
          <el-tag :type="riskTagType">{{ aiHealth.fallbackRiskLevel || '-' }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="风险原因" :span="2">
          <span>{{ aiHealth.fallbackRiskReason || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="模型错误信息" :span="2">
          <span class="error-text">{{ aiHealth.cnnError || '-' }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="Core 拉取时间">
          <span>{{ formatTime(aiHealth.fetchedAt) }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="摘要">
          <span>{{ aiHealth.summary || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">有效配置项</div>
          <div class="metric-value">{{ filteredConfigList.length }}</div>
          <div class="metric-sub">当前只保留真正参与系统运行的告警阈值项</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">功率阈值项</div>
          <div class="metric-value">{{ powerThresholdCount }}</div>
          <div class="metric-sub">控制高功率异常告警判定</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">信噪比阈值项</div>
          <div class="metric-value">{{ snrThresholdCount }}</div>
          <div class="metric-sub">控制低信噪比异常告警判定</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <div>
            <div class="header-title">告警阈值设置</div>
            <div class="header-subtitle">
              当前页面只保留真正生效的配置项：告警功率阈值、告警信噪比阈值
            </div>
          </div>
          <div class="header-actions">
            <el-button :loading="loading" @click="loadConfigList">刷新阈值</el-button>
            <el-tag type="success">真实生效配置</el-tag>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredConfigList"
        stripe
        border
        v-loading="loading"
        empty-text="暂无有效告警阈值配置"
      >
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="configName" label="配置名称" min-width="180" />
        <el-table-column prop="configKey" label="配置键" min-width="240" />
        <el-table-column prop="configValue" label="配置值" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" min-width="180">
          <template #default="scope">
            {{ formatTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openEdit(scope.row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="修改告警阈值" width="560px">
      <el-form ref="formRef" :model="editForm" :rules="rules" label-width="100px">
        <el-form-item label="配置名称">
          <el-input v-model="editForm.configName" disabled />
        </el-form-item>

        <el-form-item label="配置键">
          <el-input v-model="editForm.configKey" disabled />
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <el-input v-model="editForm.configValue" placeholder="请输入新的阈值" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiHealthApi, getConfigListApi, updateConfigApi } from '../../api/overview'

const EFFECTIVE_CONFIG_KEYS = [
  'alarm.power.threshold.dbm',
  'alarm.snr.threshold.db'
]

const loading = ref(false)
const aiLoading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const configList = ref([])

const aiHealth = reactive({
  aiEnabled: false,
  aiBaseUrl: '',
  aiHealthUrl: '',
  service: 'radio-spectrum-ai',
  serviceStatus: 'UNKNOWN',
  serviceUp: false,
  defaultMode: 'auto',
  allowRuleFallback: true,
  ruleModelName: '',
  ruleModelAvailable: true,
  cnnModelName: '',
  cnnModelAvailable: false,
  cnnCheckpointPath: '',
  cnnCheckpointExists: false,
  cnnCheckpointIsFile: false,
  cnnDevice: '',
  cnnInputShape: [],
  cnnError: '',
  fallbackRisk: true,
  fallbackRiskLevel: 'HIGH',
  fallbackRiskReason: '',
  summary: '',
  fetchedAt: ''
})

const editForm = reactive({
  configName: '',
  configKey: '',
  configValue: '',
  remark: ''
})

const rules = {
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const filteredConfigList = computed(() => {
  return configList.value.filter(item => EFFECTIVE_CONFIG_KEYS.includes(item.configKey))
})

const powerThresholdCount = computed(() => {
  return filteredConfigList.value.filter(item => item.configKey === 'alarm.power.threshold.dbm').length
})

const snrThresholdCount = computed(() => {
  return filteredConfigList.value.filter(item => item.configKey === 'alarm.snr.threshold.db').length
})

const serviceStatusText = computed(() => {
  if (!aiHealth.aiEnabled) return '已关闭'
  if (aiHealth.serviceUp) return '正常'
  return '异常'
})

const cnnStatusText = computed(() => {
  return aiHealth.cnnModelAvailable ? '已加载' : '未加载'
})

const checkpointStatusText = computed(() => {
  if (aiHealth.cnnCheckpointExists && aiHealth.cnnCheckpointIsFile) return '正确'
  if (aiHealth.cnnCheckpointExists) return '不是文件'
  return '不存在'
})

const fallbackRiskText = computed(() => {
  return aiHealth.fallbackRisk ? '有风险' : '无风险'
})

const inputShapeText = computed(() => {
  const list = Array.isArray(aiHealth.cnnInputShape) ? aiHealth.cnnInputShape : []
  return list.length ? `[${list.join(', ')}]` : '-'
})

const serviceTagType = computed(() => {
  if (!aiHealth.aiEnabled) return 'info'
  return aiHealth.serviceUp ? 'success' : 'danger'
})

const cnnTagType = computed(() => {
  return aiHealth.cnnModelAvailable ? 'success' : 'danger'
})

const checkpointTagType = computed(() => {
  if (aiHealth.cnnCheckpointExists && aiHealth.cnnCheckpointIsFile) return 'success'
  return 'danger'
})

const riskTagType = computed(() => {
  return aiHealth.fallbackRisk ? 'danger' : 'success'
})

const riskAlertType = computed(() => {
  return aiHealth.fallbackRisk ? 'warning' : 'success'
})

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const normalizeMode = (value) => {
  return String(value || '-').trim().toUpperCase()
}

const assignAiHealth = (data) => {
  aiHealth.aiEnabled = !!data?.aiEnabled
  aiHealth.aiBaseUrl = data?.aiBaseUrl || ''
  aiHealth.aiHealthUrl = data?.aiHealthUrl || ''
  aiHealth.service = data?.service || 'radio-spectrum-ai'
  aiHealth.serviceStatus = data?.serviceStatus || 'UNKNOWN'
  aiHealth.serviceUp = !!data?.serviceUp
  aiHealth.defaultMode = data?.defaultMode || 'auto'
  aiHealth.allowRuleFallback = data?.allowRuleFallback !== false
  aiHealth.ruleModelName = data?.ruleModelName || ''
  aiHealth.ruleModelAvailable = data?.ruleModelAvailable !== false
  aiHealth.cnnModelName = data?.cnnModelName || ''
  aiHealth.cnnModelAvailable = !!data?.cnnModelAvailable
  aiHealth.cnnCheckpointPath = data?.cnnCheckpointPath || ''
  aiHealth.cnnCheckpointExists = !!data?.cnnCheckpointExists
  aiHealth.cnnCheckpointIsFile = !!data?.cnnCheckpointIsFile
  aiHealth.cnnDevice = data?.cnnDevice || ''
  aiHealth.cnnInputShape = Array.isArray(data?.cnnInputShape) ? data.cnnInputShape : []
  aiHealth.cnnError = data?.cnnError || ''
  aiHealth.fallbackRisk = !!data?.fallbackRisk
  aiHealth.fallbackRiskLevel = data?.fallbackRiskLevel || 'HIGH'
  aiHealth.fallbackRiskReason = data?.fallbackRiskReason || ''
  aiHealth.summary = data?.summary || ''
  aiHealth.fetchedAt = data?.fetchedAt || ''
}

const loadAiHealth = async () => {
  try {
    aiLoading.value = true
    const res = await getAiHealthApi()
    assignAiHealth(res?.data || {})
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || 'AI 健康状态加载失败')
  } finally {
    aiLoading.value = false
  }
}

const loadConfigList = async () => {
  try {
    loading.value = true
    const res = await getConfigListApi()
    configList.value = res?.data || []
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '告警阈值加载失败')
  } finally {
    loading.value = false
  }
}

const clearValidate = async () => {
  await nextTick()
  formRef.value?.clearValidate?.()
}

const openEdit = async (row) => {
  editForm.configName = row?.configName || ''
  editForm.configKey = row?.configKey || ''
  editForm.configValue = row?.configValue || ''
  editForm.remark = row?.remark || ''
  dialogVisible.value = true
  await clearValidate()
}

const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.clearValidate?.()
}

const validateConfigForm = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

const handleSave = async () => {
  const valid = await validateConfigForm()
  if (!valid) {
    ElMessage.warning('请输入配置值')
    return
  }

  if (!editForm.configKey) {
    ElMessage.warning('未获取到配置键')
    return
  }

  if (!EFFECTIVE_CONFIG_KEYS.includes(editForm.configKey)) {
    ElMessage.warning('当前页面只允许修改有效告警阈值项')
    return
  }

  if (!String(editForm.configValue ?? '').trim()) {
    ElMessage.warning('配置值不能为空')
    return
  }

  try {
    saveLoading.value = true

    await updateConfigApi({
      configKey: editForm.configKey,
      configValue: String(editForm.configValue).trim()
    })

    ElMessage.success('保存成功')
    dialogVisible.value = false
    formRef.value?.clearValidate?.()
    await loadConfigList()
    await loadAiHealth()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '配置保存失败')
  } finally {
    saveLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadConfigList(), loadAiHealth()])
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 112px);
}

.top-alert {
  margin-top: 16px;
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

.page-card {
  border-radius: 18px;
}

.overview-card {
  border-radius: 18px;
}

.metric-title {
  font-size: 13px;
}

.metric-value {
  margin-top: 14px;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
}

.metric-sub {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.overview-card:not(.ai-card) .metric-title {
  color: #8a97ab;
}

.overview-card:not(.ai-card) .metric-value {
  color: #1f2a37;
}

.overview-card:not(.ai-card) .metric-sub {
  color: #6b7280;
}

.ai-card .metric-title {
  color: #ffffff;
  opacity: 0.92;
}

.ai-card .metric-value {
  color: #ffffff;
}

.ai-card .metric-sub {
  color: rgba(255, 255, 255, 0.86);
}

.metric-tag-wrap {
  margin-top: 14px;
}

.ai-card {
  position: relative;
  overflow: hidden;
}

.ai-card::after {
  content: '';
  position: absolute;
  right: -18px;
  bottom: -18px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.service-card {
  background: linear-gradient(135deg, #409eff, #67c6ff);
}

.cnn-card {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.path-card {
  background: linear-gradient(135deg, #36cfc9, #5fe3da);
}

.risk-card {
  background: linear-gradient(135deg, #e6a23c, #f3c26b);
}

.ai-desc {
  margin-top: 6px;
}

.mono-text {
  font-family: Consolas, Menlo, Monaco, monospace;
  word-break: break-all;
}

.error-text {
  color: #f56c6c;
  word-break: break-all;
}
</style>
