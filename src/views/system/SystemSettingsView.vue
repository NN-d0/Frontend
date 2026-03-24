<template>
  <div class="page-container">
    <el-row :gutter="16">
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
            <el-button @click="loadConfigList">刷新</el-button>
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
import { getConfigListApi, updateConfigApi } from '../../api/overview'

const EFFECTIVE_CONFIG_KEYS = [
  'alarm.power.threshold.dbm',
  'alarm.snr.threshold.db'
]

const loading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const configList = ref([])

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

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
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
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '配置保存失败')
  } finally {
    saveLoading.value = false
  }
}

onMounted(async () => {
  await loadConfigList()
})
</script>

<style scoped>
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
</style>