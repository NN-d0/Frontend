<template>
  <div class="login-page">
    <div class="login-bg-grid"></div>
    <div class="login-bg-blur blur-one"></div>
    <div class="login-bg-blur blur-two"></div>

    <div class="login-shell">
      <div class="login-left">
        <div class="brand-panel">
          <div class="brand-top">
            <img class="school-logo" :src="schoolLogo" alt="school-logo" />
            <div class="brand-text">
              <div class="brand-mini">本科毕业设计演示系统</div>
              <h1 class="brand-title">无线电频谱智能监测系统</h1>
              <div class="brand-subtitle">
                面向无线电频谱监测管理的可视化工作台
              </div>
            </div>
          </div>

          <div class="brand-desc">
            系统覆盖设备管理、任务调度、实时监测、历史回放、告警处置等核心流程，
            用于毕业设计闭环演示与论文截图展示。
          </div>

          <div class="brand-tags">
            <span class="brand-tag">Spring Boot</span>
            <span class="brand-tag">Vue3</span>
            <span class="brand-tag">WebSocket</span>
            <span class="brand-tag">MySQL</span>
            <span class="brand-tag">Redis</span>
            <span class="brand-tag">Python AI</span>
          </div>

          <div class="brand-points">
            <div class="point-item">
              <span class="point-dot"></span>
              <span>频谱态势总览与地图展示</span>
            </div>
            <div class="point-item">
              <span class="point-dot"></span>
              <span>实时监测与历史快照回放</span>
            </div>
            <div class="point-item">
              <span class="point-dot"></span>
              <span>告警中心与设备任务协同管理</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-card-header">
            <div class="login-card-badge">管理员登录</div>
            <h2 class="login-card-title">欢迎进入系统</h2>
            <div class="login-card-subtitle">
              请输入管理员账号与密码登录 PC 工作台
            </div>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
            label-position="top"
            @keyup.enter="handleLogin"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                size="large"
                placeholder="请输入用户名"
                clearable
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                size="large"
                placeholder="请输入密码"
                show-password
                clearable
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <div class="form-extra">
              <el-checkbox v-model="rememberMe">记住本次账号</el-checkbox>
              <span class="form-tip">按 Enter 可直接登录</span>
            </div>

            <el-button
              type="primary"
              class="login-btn"
              size="large"
              :loading="loading"
              @click="handleLogin"
            >
              登录系统
            </el-button>
          </el-form>

          <div class="login-footer">
            <div class="footer-line"></div>
            <div class="footer-text">
              Radio Spectrum Monitor · Graduation Design Demo
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { loginApi } from '../../api/user'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(true)
const schoolLogo = '/images/school-logo.png'

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const extractToken = (res) => {
  const data = res?.data ?? res

  return (
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.jwt ||
    data?.data?.access_token ||
    (typeof data === 'string' ? data : '')
  )
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate()

  try {
    loading.value = true

    const res = await loginApi({
      username: form.username,
      password: form.password
    })

    const token = extractToken(res)

    if (!token) {
      console.error('登录返回结果：', res)
      ElMessage.error('登录成功，但未获取到 token，请检查后端返回结构')
      return
    }

    localStorage.setItem('radio_token', token)

    if (rememberMe.value) {
      localStorage.setItem('radio_login_username', form.username)
    } else {
      localStorage.removeItem('radio_login_username')
    }

    ElMessage.success('登录成功')
    router.replace('/overview')
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.msg || error?.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '频谱智能监测系统'

  const savedUsername = localStorage.getItem('radio_login_username')
  if (savedUsername) {
    form.username = savedUsername
  }
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 26%),
    radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.12), transparent 24%),
    linear-gradient(135deg, #071120 0%, #0d1b31 48%, #10223e 100%);
}

.login-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 34px 34px;
  opacity: 0.35;
}

.login-bg-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
}

.blur-one {
  width: 340px;
  height: 340px;
  background: rgba(59, 130, 246, 0.28);
  top: 60px;
  left: 80px;
}

.blur-two {
  width: 300px;
  height: 300px;
  background: rgba(34, 197, 94, 0.18);
  right: 120px;
  bottom: 60px;
}

.login-shell {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  gap: 36px;
  padding: 36px 56px;
}

.login-left {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-panel {
  width: 100%;
  max-width: 760px;
  padding: 42px 40px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.18);
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 22px;
}

.school-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.16);
  flex-shrink: 0;
}

.brand-text {
  min-width: 0;
}

.brand-mini {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.18);
  color: #cfe1ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-title {
  margin: 16px 0 0;
  font-size: 40px;
  line-height: 1.2;
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brand-subtitle {
  margin-top: 12px;
  font-size: 17px;
  color: #b8c7dc;
  line-height: 1.8;
}

.brand-desc {
  margin-top: 28px;
  font-size: 15px;
  line-height: 2;
  color: #d7e1ee;
}

.brand-tags {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.brand-tag {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #e9f1fb;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-points {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dbe6f3;
  font-size: 15px;
}

.point-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #22c55e);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.65);
  flex-shrink: 0;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 480px;
  padding: 34px 32px 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px);
  box-shadow: 0 30px 60px rgba(10, 25, 47, 0.2);
}

.login-card-header {
  text-align: left;
}

.login-card-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.login-card-title {
  margin: 18px 0 0;
  font-size: 32px;
  color: #1f2a37;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.login-card-subtitle {
  margin-top: 10px;
  font-size: 14px;
  color: #7b8aa0;
  line-height: 1.8;
}

.login-form {
  margin-top: 28px;
}

.login-form :deep(.el-form-item__label) {
  color: #5f6f86;
  font-weight: 700;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px #dde6f2 inset !important;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset !important;
}

.form-extra {
  margin: 6px 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7b8aa0;
  font-size: 13px;
}

.form-tip {
  color: #94a3b8;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 14px 26px rgba(59, 130, 246, 0.24);
}

.login-footer {
  margin-top: 24px;
}

.footer-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #dbe5f1, transparent);
}

.footer-text {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.4px;
}

@media (max-width: 1200px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 26px 22px;
  }

  .brand-panel {
    max-width: 100%;
    padding: 28px 24px;
  }

  .brand-top {
    align-items: flex-start;
  }

  .brand-title {
    font-size: 32px;
  }

  .login-card {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .brand-top {
    flex-direction: column;
    gap: 16px;
  }

  .school-logo {
    width: 82px;
    height: 82px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-subtitle {
    font-size: 15px;
  }

  .login-card {
    padding: 28px 20px 22px;
  }
}
</style>