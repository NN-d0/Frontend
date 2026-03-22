<template>
  <el-card class="page-card">
    <div class="full-empty">
      <el-empty :description="desc">
        <template #image>
          <div style="font-size: 28px; font-weight: 700; color: #409eff; margin-bottom: 16px;">
            {{ title }}
          </div>
        </template>
        <el-button type="primary" @click="router.push('/overview')">返回首页总览</el-button>
      </el-empty>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const title = computed(() => route.meta?.title || '页面建设中')
const desc = computed(() => route.meta?.desc || '下一步继续实现该页面')
</script>