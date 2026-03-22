<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">系统参数总数</div>
          <div class="metric-value">{{ configList.length }}</div>
          <div class="metric-sub">当前数据库中的配置项数量</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">告警相关配置</div>
          <div class="metric-value">{{ alarmConfigCount }}</div>
          <div class="metric-sub">用于展示告警阈值类参数</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="overview-card" shadow="hover">
          <div class="metric-title">可编辑配置</div>
          <div class="metric-value">{{ configList.length }}</div>
          <div class="metric-sub">个人设置已迁移到右上角个人设置中心</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card" shadow="hover" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span>系统参数列表</span>
          <div>
            <el-button @click="loadConfigList">刷新</el-button>
            <el-tag type="success" style="margin-left: 10px;">真实数据</el-tag>
          </div>
        </div>
      </template>

      <el-table :data="configList" stripe border v-loading="loading" empty-text="暂无系统参数数据">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="configName" label="配置名称" min-width="180" />
        <el-table-column prop="configKey" label="配置键" min-width="220" />
        <el-table-column prop="configValue" label="配置值" min-width="220" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" title="修改系统参数" width="560px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="配置名称">
          <el-input v-model="editForm.configName" disabled />
        </el-form-item>

        <el-form-item label="配置键">
          <el-input v-model="editForm.configKey" disabled />
        </el-form-item>

        <el-form-item label="配置值">
          <el-input v-model="editForm.configValue" placeholder="请输入新的配置值" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigListApi, updateConfigApi } from '../../api/overview'

const loading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const configList = ref([])

const editForm = reactive({
  configName: '',
  configKey: '',
  configValue: '',
  remark: ''
})

const alarmConfigCount = computed(() => {
  return configList.value.filter(item => String(item.configKey || '').startsWith('alarm.')).length
})

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const loadConfigList = async () => {
  try {
    loading.value = true
    const res = await getConfigListApi()
    configList.value = res.data || []
  } catch (error) {
    console.error(error)
    ElMessage.error('系统参数加载失败')
  } finally {
    loading.value = false
  }
}

const openEdit = (row) => {
  editForm.configName = row.configName || ''
  editForm.configKey = row.configKey || ''
  editForm.configValue = row.configValue || ''
  editForm.remark = row.remark || ''
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!editForm.configValue) {
    ElMessage.warning('配置值不能为空')
    return
  }

  try {
    saveLoading.value = true
    await updateConfigApi({
      configKey: editForm.configKey,
      configValue: editForm.configValue
    })

    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadConfigList()
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
}
</style>